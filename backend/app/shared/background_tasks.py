"""
Background task service with proper cancellation and async task management
"""
from typing import Dict, Any, Callable, Optional, List
import logging
import asyncio
import uuid
from enum import Enum
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import weakref

from ...domains.documents.pdf_processor import PDFProcessor
from ...domains.search.embedding_service import EmbeddingService
from ...domains.search.qdrant_service import QDrantService

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    """Background task status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BackgroundTask:
    """Represents a cancellable background task"""

    def __init__(self, task_id: str, task_type: str, user_id: str, metadata: Optional[Dict[str, Any]] = None):
        self.task_id = task_id
        self.task_type = task_type
        self.user_id = user_id
        self.status = TaskStatus.PENDING
        self.progress = 0
        self.metadata = metadata or {}
        self.result: Optional[Dict[str, Any]] = None
        self.error: Optional[str] = None
        self.created_at = datetime.utcnow()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self._task: Optional[asyncio.Task] = None
        self._cancel_event = asyncio.Event()

    def start(self, coro):
        """Start the task"""
        self.status = TaskStatus.RUNNING
        self.started_at = datetime.utcnow()
        self._task = asyncio.create_task(self._run_with_cancellation(coro))

    async def _run_with_cancellation(self, coro):
        """Run coroutine with cancellation support"""
        try:
            task_coro = asyncio.create_task(coro)
            cancel_coro = asyncio.create_task(self._cancel_event.wait())

            done, pending = await asyncio.wait(
                [task_coro, cancel_coro],
                return_when=asyncio.FIRST_COMPLETED
            )

            # Cancel pending tasks
            for task in pending:
                task.cancel()

            if cancel_coro in done:
                # Task was cancelled
                self.status = TaskStatus.CANCELLED
                self.completed_at = datetime.utcnow()
                return

            # Task completed normally
            result = await task_coro
            self.result = result
            self.status = TaskStatus.COMPLETED
            self.completed_at = datetime.utcnow()

        except asyncio.CancelledError:
            self.status = TaskStatus.CANCELLED
            self.completed_at = datetime.utcnow()
        except Exception as e:
            self.status = TaskStatus.FAILED
            self.error = str(e)
            self.completed_at = datetime.utcnow()
            logger.error(f"Task {self.task_id} failed: {e}")

    def cancel(self):
        """Cancel the task"""
        if self.status in [TaskStatus.PENDING, TaskStatus.RUNNING]:
            self._cancel_event.set()
            if self._task and not self._task.done():
                self._task.cancel()
            self.status = TaskStatus.CANCELLED
            self.completed_at = datetime.utcnow()

    def update_progress(self, progress: int, status_message: Optional[str] = None):
        """Update task progress"""
        self.progress = max(0, min(100, progress))
        if status_message:
            self.metadata["status_message"] = status_message

    def is_cancelled(self) -> bool:
        """Check if task is cancelled"""
        return self._cancel_event.is_set()

    def to_dict(self) -> Dict[str, Any]:
        """Convert task to dictionary representation"""
        return {
            "task_id": self.task_id,
            "task_type": self.task_type,
            "user_id": self.user_id,
            "status": self.status.value,
            "progress": self.progress,
            "metadata": self.metadata,
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class BackgroundTaskService:
    """Service for managing background tasks with proper cancellation"""

    def __init__(self, pdf_processor: Optional[PDFProcessor] = None,
                 embedding_service: Optional[EmbeddingService] = None,
                 qdrant_service: Optional[QDrantService] = None):
        self.active_tasks: Dict[str, BackgroundTask] = {}
        self.completed_tasks: Dict[str, BackgroundTask] = {}  # Keep recent completed tasks
        self.max_completed_tasks = 100  # Reduced from 1000 to prevent memory bloat
        self.cleanup_interval = 180  # Cleanup every 3 minutes (more frequent)
        self.max_task_age = 1800  # 30 minutes (reduced from 1 hour)
        self.max_active_tasks = 50  # Maximum concurrent active tasks

        # Dependency injection for services
        self.pdf_processor = pdf_processor or PDFProcessor()
        self.embedding_service = embedding_service or EmbeddingService()
        self.qdrant_service = qdrant_service or QDrantService()

        # Start cleanup task
        self._cleanup_task = asyncio.create_task(self._periodic_cleanup())

        # Track memory usage
        self._memory_cleanup_counter = 0

    async def _periodic_cleanup(self):
        """Periodic cleanup of old completed tasks"""
        while True:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self._cleanup_old_tasks()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic cleanup: {e}")

    async def _cleanup_old_tasks(self):
        """Clean up old completed tasks"""
        current_time = datetime.utcnow()
        to_remove = []

        for task_id, task in self.completed_tasks.items():
            if task.completed_at and (current_time - task.completed_at).total_seconds() > self.max_task_age:
                to_remove.append(task_id)

        for task_id in to_remove:
            del self.completed_tasks[task_id]

        if to_remove:
            logger.info(f"Cleaned up {len(to_remove)} old completed tasks")

        # Limit completed tasks count
        if len(self.completed_tasks) > self.max_completed_tasks:
            # Remove oldest tasks
            sorted_tasks = sorted(self.completed_tasks.items(),
                                key=lambda x: x[1].completed_at or x[1].created_at)
            to_remove = [task_id for task_id, _ in sorted_tasks[:-self.max_completed_tasks]]
            for task_id in to_remove:
                del self.completed_tasks[task_id]
            logger.info(f"Removed {len(to_remove)} excess completed tasks")

    def _move_completed_task(self, task_id: str):
        """
        Move a completed task from active to completed tasks

        Args:
            task_id: Task ID to move
        """
        if task_id in self.active_tasks:
            task = self.active_tasks[task_id]

            # Only move if task is actually completed/failed/cancelled
            if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
                # Move to completed tasks
                self.completed_tasks[task_id] = task
                del self.active_tasks[task_id]

                # Trigger cleanup if we have too many completed tasks
                if len(self.completed_tasks) > self.max_completed_tasks * 0.8:  # 80% threshold
                    asyncio.create_task(self._cleanup_old_tasks())

                logger.debug(f"Moved task {task_id} to completed tasks")

    def _check_task_limits(self) -> bool:
        """
        Check if we're approaching task limits

        Returns:
            True if limits are exceeded and new tasks should be rejected
        """
        if len(self.active_tasks) >= self.max_active_tasks:
            logger.warning(f"Active task limit reached ({self.max_active_tasks}). Rejecting new tasks.")
            return False
        return True

    async def create_task(
        self,
        task_type: str,
        user_id: str,
        task_func: Callable,
        *args,
        **kwargs
    ) -> Optional[str]:
        """
        Create and start a new background task with memory management

        Args:
            task_type: Type of task (e.g., 'crawl_simple', 'pdf_processing')
            user_id: User ID for the task
            task_func: Async function to execute
            *args: Positional arguments for task_func
            **kwargs: Keyword arguments for task_func

        Returns:
            Task ID if created successfully, None if limits exceeded
        """
        # Check limits before creating task
        if not self._check_task_limits():
            return None

        task_id = f"{task_type}_{uuid.uuid4().hex[:8]}"

        # Create background task
        task = BackgroundTask(
            task_id=task_id,
            task_type=task_type,
            user_id=user_id,
            metadata={"created_by": "task_service"}
        )

        # Add to active tasks
        self.active_tasks[task_id] = task

        # Create wrapper coroutine that moves task to completed when done
        async def task_wrapper():
            try:
                result = await task_func(*args, **kwargs)
                return result
            finally:
                # Always move to completed tasks after execution
                self._move_completed_task(task_id)

        # Start the task
        task.start(task_wrapper())

        logger.info(f"Created and started task {task_id} of type {task_type}")
        return task_id

    async def start_pdf_processing_task(
        self,
        document_id: str,
        pdf_path: str,
        filename: str,
        user_id: str
    ) -> str:
        """
        Start PDF processing task with cancellation support

        Args:
            document_id: Document ID in database
            pdf_path: Path to PDF file
            filename: Original filename
            user_id: User ID for access control

        Returns:
            Task ID for tracking
        """
        task_id = f"pdf_process_{document_id}_{uuid.uuid4().hex[:8]}"

        # Create background task
        task = BackgroundTask(
            task_id=task_id,
            task_type="pdf_processing",
            user_id=user_id,
            metadata={
                "document_id": document_id,
                "pdf_path": pdf_path,
                "filename": filename
            }
        )

        # Add to active tasks
        self.active_tasks[task_id] = task

        # Start the task
        task.start(self._process_pdf_background(task))

        logger.info(f"Started PDF processing task {task_id} for document {document_id}")
        return task_id

    async def _process_pdf_background(self, task: BackgroundTask) -> Dict[str, Any]:
        """Background PDF processing task with cancellation support"""
        document_id = task.metadata["document_id"]
        pdf_path = task.metadata["pdf_path"]
        filename = task.metadata["filename"]
        user_id = task.user_id

        try:
            # Check for cancellation
            if task.is_cancelled():
                raise asyncio.CancelledError("Task was cancelled")

            # Update progress: Processing PDF
            task.update_progress(10, "Processing PDF to markdown")

            # Process PDF to markdown
            pdf_result = await self.pdf_processor.process_pdf_async(pdf_path, filename)

            if not pdf_result["success"]:
                raise Exception(f"PDF processing failed: {pdf_result.get('error', 'Unknown error')}")

            markdown_content = pdf_result["markdown_content"]

            # Check for cancellation
            if task.is_cancelled():
                raise asyncio.CancelledError("Task was cancelled")

            # Update progress: Generating embeddings
            task.update_progress(50, "Generating embeddings")

            # Generate embeddings for the content
            async with self.embedding_service:
                embed_result = await self.embedding_service.chunk_and_embed(markdown_content)

            if embed_result["failed_count"] > 0:
                logger.warning(f"Some embeddings failed: {embed_result['failed_count']} of {embed_result['total_chunks']}")

            # Check for cancellation
            if task.is_cancelled():
                raise asyncio.CancelledError("Task was cancelled")

            # Update progress: Storing vectors
            task.update_progress(80, "Storing vectors in database")

            # Prepare points for QDrant
            points = []
            for i, (chunk, embedding) in enumerate(zip(embed_result["chunks"], embed_result["embeddings"])):
                if embedding is not None:  # Skip failed embeddings
                    points.append({
                        "vector": embedding,
                        "payload": {
                            "document_id": document_id,
                            "chunk_index": i,
                            "chunk_text": chunk[:500],  # Store first 500 chars of chunk
                            "filename": filename
                        }
                    })

            # Store in QDrant
            if points:
                qdrant_result = await self.qdrant_service.add_points(points, user_id)

                if not qdrant_result["success"]:
                    raise Exception(f"QDrant storage failed: {qdrant_result.get('error', 'Unknown error')}")

            # Update progress: Completed
            task.update_progress(100, "Processing completed")

            result = {
                "markdown_content": markdown_content,
                "chunks_processed": embed_result["total_chunks"],
                "embeddings_created": embed_result["success_count"],
                "vectors_stored": len(points) if points else 0,
                "processing_time": pdf_result.get("processing_time", 0)
            }

            logger.info(f"Completed PDF processing task {task.task_id}")
            return result

        except asyncio.CancelledError:
            logger.info(f"PDF processing task {task.task_id} was cancelled")
            raise
        except Exception as e:
            logger.error(f"PDF processing task {task.task_id} failed: {e}")
            raise

    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a running task

        Args:
            task_id: Task ID to cancel

        Returns:
            True if task was cancelled, False if not found or already completed
        """
        task = self.active_tasks.get(task_id)
        if task and task.status in [TaskStatus.PENDING, TaskStatus.RUNNING]:
            task.cancel()
            logger.info(f"Cancelled task {task_id}")
            return True
        return False

    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a background task

        Args:
            task_id: Task ID to check

        Returns:
            Task status dict, or None if task not found
        """
        # Check active tasks first
        task = self.active_tasks.get(task_id)
        if task:
            return task.to_dict()

        # Check completed tasks
        task = self.completed_tasks.get(task_id)
        if task:
            return task.to_dict()

        return None

    def list_active_tasks(self, user_id: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """
        List all active tasks, optionally filtered by user

        Args:
            user_id: Optional user ID filter

        Returns:
            Dict of task_id -> task_info
        """
        tasks = {}
        for task_id, task in self.active_tasks.items():
            if user_id is None or task.user_id == user_id:
                tasks[task_id] = task.to_dict()
        return tasks

    def list_completed_tasks(self, user_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        List completed tasks, optionally filtered by user

        Args:
            user_id: Optional user ID filter
            limit: Maximum number of tasks to return

        Returns:
            List of completed task dictionaries
        """
        tasks = []
        for task in self.completed_tasks.values():
            if user_id is None or task.user_id == user_id:
                tasks.append(task.to_dict())

        # Sort by completion time (most recent first)
        tasks.sort(key=lambda x: x.get("completed_at", ""), reverse=True)
        return tasks[:limit]

    async def shutdown(self):
        """Shutdown the task service and cancel all running tasks"""
        logger.info("Shutting down background task service")

        # Cancel cleanup task
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

        # Cancel all active tasks
        for task in self.active_tasks.values():
            task.cancel()

        # Wait for tasks to complete
        await asyncio.sleep(1)  # Give tasks time to cancel gracefully

        logger.info("Background task service shutdown complete")
