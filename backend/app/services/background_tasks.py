"""
Background task service using FastAPI BackgroundTasks
"""
from typing import Dict, Any, Callable, Optional
import logging
from fastapi import BackgroundTasks
import asyncio

from .pdf_processor import PDFProcessor
from .embedding_service import EmbeddingService
from .qdrant_service import QDrantService

logger = logging.getLogger(__name__)


class BackgroundTaskService:
    """Service for managing background tasks"""

    def __init__(self):
        self.active_tasks: Dict[str, Dict[str, Any]] = {}
        self.pdf_processor = PDFProcessor()
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QDrantService()

    async def start_pdf_processing_task(
        self,
        background_tasks: BackgroundTasks,
        document_id: str,
        pdf_path: str,
        filename: str,
        user_id: str
    ) -> str:
        """
        Start PDF processing task in background

        Args:
            background_tasks: FastAPI BackgroundTasks instance
            document_id: Document ID in database
            pdf_path: Path to PDF file
            filename: Original filename
            user_id: User ID for access control

        Returns:
            Task ID for tracking
        """
        task_id = f"pdf_process_{document_id}"

        # Add to active tasks
        self.active_tasks[task_id] = {
            "type": "pdf_processing",
            "document_id": document_id,
            "user_id": user_id,
            "status": "running",
            "progress": 0,
            "started_at": asyncio.get_event_loop().time()
        }

        # Start background task
        background_tasks.add_task(
            self._process_pdf_background,
            task_id,
            document_id,
            pdf_path,
            filename,
            user_id
        )

        logger.info(f"Started PDF processing task {task_id} for document {document_id}")
        return task_id

    async def _process_pdf_background(
        self,
        task_id: str,
        document_id: str,
        pdf_path: str,
        filename: str,
        user_id: str
    ):
        """Background PDF processing task"""
        try:
            # Update task status
            self.active_tasks[task_id]["status"] = "processing_pdf"
            self.active_tasks[task_id]["progress"] = 10

            # Process PDF to markdown
            pdf_result = await self.pdf_processor.process_pdf_async(pdf_path, filename)

            if not pdf_result["success"]:
                raise Exception(f"PDF processing failed: {pdf_result.get('error', 'Unknown error')}")

            markdown_content = pdf_result["markdown_content"]

            # Update task status
            self.active_tasks[task_id]["status"] = "generating_embeddings"
            self.active_tasks[task_id]["progress"] = 50

            # Generate embeddings for the content
            async with self.embedding_service:
                embed_result = await self.embedding_service.chunk_and_embed(markdown_content)

            if embed_result["failed_count"] > 0:
                logger.warning(f"Some embeddings failed: {embed_result['failed_count']} of {embed_result['total_chunks']}")

            # Update task status
            self.active_tasks[task_id]["status"] = "storing_vectors"
            self.active_tasks[task_id]["progress"] = 80

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

            # Update task status
            self.active_tasks[task_id]["status"] = "completed"
            self.active_tasks[task_id]["progress"] = 100
            self.active_tasks[task_id]["result"] = {
                "markdown_content": markdown_content,
                "chunks_processed": embed_result["total_chunks"],
                "embeddings_created": embed_result["success_count"],
                "vectors_stored": len(points) if points else 0,
                "processing_time": pdf_result.get("processing_time", 0)
            }

            logger.info(f"Completed PDF processing task {task_id}")

        except Exception as e:
            # Update task status on failure
            self.active_tasks[task_id]["status"] = "failed"
            self.active_tasks[task_id]["error"] = str(e)

            logger.error(f"PDF processing task {task_id} failed: {e}")

    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a background task

        Args:
            task_id: Task ID to check

        Returns:
            Task status dict, or None if task not found
        """
        return self.active_tasks.get(task_id)

    def list_active_tasks(self, user_id: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """
        List all active tasks, optionally filtered by user

        Args:
            user_id: Optional user ID filter

        Returns:
            Dict of task_id -> task_info
        """
        if user_id:
            return {
                task_id: task_info
                for task_id, task_info in self.active_tasks.items()
                if task_info.get("user_id") == user_id
            }
        return self.active_tasks.copy()

    def cleanup_completed_tasks(self, max_age_seconds: int = 3600) -> int:
        """
        Clean up old completed/failed tasks

        Args:
            max_age_seconds: Maximum age of tasks to keep

        Returns:
            Number of tasks cleaned up
        """
        current_time = asyncio.get_event_loop().time()
        to_remove = []

        for task_id, task_info in self.active_tasks.items():
            start_time = task_info.get("started_at", 0)
            status = task_info.get("status", "")

            # Remove old completed/failed tasks
            if (status in ["completed", "failed"] and
                current_time - start_time > max_age_seconds):
                to_remove.append(task_id)

        # Remove old tasks
        for task_id in to_remove:
            del self.active_tasks[task_id]

        logger.info(f"Cleaned up {len(to_remove)} old background tasks")
        return len(to_remove)
