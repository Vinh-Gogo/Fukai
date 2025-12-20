"""
Crawl service for handling crawl operations and business logic
"""
from typing import Dict, Any, Optional, List
import logging
import uuid
from datetime import datetime

from app.core.config import settings
from app.schemas.crawl import CrawlStartRequest
from app.schemas.common import APIResponse, create_success_response
from app.domains.crawler.crawler import BiwaseCrawler
from app.domains.crawler.base_crawler import CrawlConfig
from app.shared.background_tasks import BackgroundTaskService, TaskStatus

logger = logging.getLogger(__name__)


class CrawlService:
    """
    Service for handling crawl operations and business logic
    """

    def __init__(self, background_task_service: Optional[BackgroundTaskService] = None):
        """
        Initialize crawl service

        Args:
            background_task_service: Background task service instance
        """
        self.background_task_service = background_task_service

    def create_crawler_instance(self, base_url: Optional[str] = None) -> BiwaseCrawler:
        """
        Create a crawler instance with proper configuration

        Args:
            base_url: Base URL for crawling (defaults to settings)

        Returns:
            Configured BiwaseCrawler instance
        """
        config = CrawlConfig(
            base_url=base_url or settings.BIWASE_BASE_URL,
            output_dir=settings.UPLOAD_DIR,
            max_retries=3,
            retry_delay=settings.CRAWL_DELAY,
            request_timeout=settings.CRAWL_TIMEOUT,
            rate_limit_delay=settings.CRAWL_DELAY
        )
        return BiwaseCrawler(config)

    async def start_crawl_operation(
        self,
        request: CrawlStartRequest,
        user_id: str,
        background_tasks
    ) -> Dict[str, Any]:
        """
        Start a crawl operation with proper validation and task management

        Args:
            request: Crawl configuration request
            user_id: User ID initiating the crawl
            background_tasks: FastAPI background tasks

        Returns:
            Dict with task information
        """
        # Validate request
        if request.crawl_type not in ["simple", "full_pipeline"]:
            raise ValueError("Invalid crawl_type. Must be 'simple' or 'full_pipeline'")

        # Set default user_id if not provided
        if request.crawl_type == "full_pipeline" and not request.user_id:
            request.user_id = user_id

        # Create crawler instance
        crawler = self.create_crawler_instance()

        # Generate task ID
        task_id = f"crawl_{uuid.uuid4().hex[:8]}"

        # Add to background tasks
        if request.crawl_type == "simple":
            background_tasks.add_task(
                self._execute_simple_crawl_background,
                task_id,
                crawler,
                user_id
            )
        else:
            background_tasks.add_task(
                self._execute_full_pipeline_crawl_background,
                task_id,
                crawler,
                user_id
            )

        logger.info(f"Started {request.crawl_type} crawl task {task_id} for user {user_id}")

        return {
            "task_id": task_id,
            "crawl_type": request.crawl_type,
            "status": "running",
            "user_id": user_id
        }

    def get_crawl_pages(self, url: str) -> Dict[str, Any]:
        """
        Get pagination links from a URL

        Args:
            url: URL to crawl for pages

        Returns:
            Dict with page information
        """
        crawler = self.create_crawler_instance(base_url=url)
        page_urls = crawler.get_pagination_links()

        return {
            "success": True,
            "pages_found": len(page_urls),
            "page_urls": page_urls,
            "message": f"Found {len(page_urls)} pages"
        }

    def get_articles_from_pages(self, page_urls: List[str]) -> Dict[str, Any]:
        """
        Get articles from multiple page URLs

        Args:
            page_urls: List of page URLs to crawl

        Returns:
            Dict with article information
        """
        crawler = self.create_crawler_instance()
        all_articles = []

        for page_url in page_urls:
            try:
                articles = crawler.get_news_links(page_url)
                all_articles.extend(articles)
                # Rate limiting
                import time
                time.sleep(settings.CRAWL_DELAY)
            except Exception as e:
                logger.warning(f"Failed to get articles from page {page_url}: {e}")
                continue

        # Remove duplicates
        unique_articles = list(set(all_articles))

        return {
            "success": True,
            "article_urls": unique_articles,
            "message": f"Found {len(unique_articles)} articles from {len(page_urls)} pages"
        }

    def get_pdf_links_from_articles(self, article_urls: List[str]) -> Dict[str, Any]:
        """
        Extract PDF links from multiple article URLs

        Args:
            article_urls: List of article URLs to crawl

        Returns:
            Dict with PDF link information
        """
        crawler = self.create_crawler_instance()
        all_pdfs = []

        for article_url in article_urls:
            try:
                pdfs = crawler.get_pdf_links(article_url)
                all_pdfs.extend(pdfs)
                # Rate limiting
                import time
                time.sleep(settings.CRAWL_DELAY)
            except Exception as e:
                logger.warning(f"Failed to get PDFs from article {article_url}: {e}")
                continue

        # Remove duplicates
        unique_pdfs = list(set(all_pdfs))

        return {
            "success": True,
            "pdfs_found": len(unique_pdfs),
            "pdf_urls": unique_pdfs,
            "message": f"Found {len(unique_pdfs)} PDFs from {len(article_urls)} articles"
        }

    def _execute_simple_crawl_background(
        self,
        task_id: str,
        crawler: BiwaseCrawler,
        user_id: str
    ):
        """
        Execute simple crawl in background

        Args:
            task_id: Background task ID
            crawler: BiwaseCrawler instance
            user_id: User ID for the crawl
        """
        try:
            logger.info(f"Executing simple crawl task {task_id} for user {user_id}")

            # Create background task instance
            from app.shared.background_tasks import BackgroundTask
            task = BackgroundTask(
                task_id=task_id,
                task_type="crawl_simple",
                user_id=user_id,
                metadata={"stage": "crawling", "percentage": 0}
            )

            # Add to active tasks (only if background_task_service is available)
            if self.background_task_service:
                self.background_task_service.active_tasks[task_id] = task
            task.status = TaskStatus.RUNNING
            task.started_at = datetime.now()

            # Execute crawl
            result = crawler.crawl_simple()

            # Convert result to dict safely
            try:
                if hasattr(result, '__dict__'):
                    result_dict = vars(result)
                elif isinstance(result, dict):
                    result_dict = result
                else:
                    result_dict = {"result": str(result)}
            except Exception:
                result_dict = {"error": "Could not parse result"}

            # Update task status
            if result_dict.get("success", False):
                task.status = TaskStatus.COMPLETED
                task.progress = 100
                task.result = result_dict
                task.metadata.update({"stage": "completed", "percentage": 100})
                task.completed_at = datetime.now()
                logger.info(f"Simple crawl task {task_id} completed successfully")
            else:
                task.status = TaskStatus.FAILED
                task.error = result_dict.get("error", "Unknown error")
                task.result = result_dict
                task.completed_at = datetime.now()
                logger.error(f"Simple crawl task {task_id} failed: {result_dict.get('error')}")

            # Move to completed tasks for memory management
            if self.background_task_service:
                self.background_task_service._move_completed_task(task_id)

        except Exception as e:
            logger.error(f"Simple crawl task {task_id} failed with exception: {e}")
            if self.background_task_service:
                task = self.background_task_service.active_tasks.get(task_id)
                if task:
                    task.status = TaskStatus.FAILED
                    task.error = str(e)
                    task.completed_at = datetime.now()
                    self.background_task_service._move_completed_task(task_id)

    def _execute_full_pipeline_crawl_background(
        self,
        task_id: str,
        crawler: BiwaseCrawler,
        user_id: str
    ):
        """
        Execute full pipeline crawl in background

        Args:
            task_id: Background task ID
            crawler: BiwaseCrawler instance
            user_id: User ID for the crawl
        """
        try:
            logger.info(f"Executing full pipeline crawl task {task_id} for user {user_id}")

            # Create background task instance
            from app.shared.background_tasks import BackgroundTask
            task = BackgroundTask(
                task_id=task_id,
                task_type="crawl_full_pipeline",
                user_id=user_id,
                metadata={"stage": "crawling", "percentage": 0}
            )

            # Add to active tasks (only if background_task_service is available)
            if self.background_task_service:
                self.background_task_service.active_tasks[task_id] = task
            task.status = TaskStatus.RUNNING
            task.started_at = datetime.now()

            # Execute full pipeline crawl
            result = crawler.crawl_full_pipeline(
                background_tasks_service=self.background_task_service,
                user_id=user_id
            )

            # Convert result to dict safely
            try:
                if hasattr(result, '__dict__'):
                    result_dict = vars(result)
                elif isinstance(result, dict):
                    result_dict = result
                else:
                    result_dict = {"result": str(result)}
            except Exception:
                result_dict = {"error": "Could not parse result"}

            # Update task status
            if result_dict.get("success", False):
                task.status = TaskStatus.COMPLETED
                task.progress = 100
                task.result = result_dict
                task.metadata.update({"stage": "completed", "percentage": 100})
                task.completed_at = datetime.now()
                logger.info(f"Full pipeline crawl task {task_id} completed successfully")
            else:
                task.status = TaskStatus.FAILED
                task.error = result_dict.get("error", "Unknown error")
                task.result = result_dict
                task.completed_at = datetime.now()
                logger.error(f"Full pipeline crawl task {task_id} failed: {result_dict.get('error')}")

            # Move to completed tasks for memory management
            if self.background_task_service:
                self.background_task_service._move_completed_task(task_id)

        except Exception as e:
            logger.error(f"Full pipeline crawl task {task_id} failed with exception: {e}")
            if self.background_task_service:
                task = self.background_task_service.active_tasks.get(task_id)
                if task:
                    task.status = TaskStatus.FAILED
                    task.error = str(e)
                    task.completed_at = datetime.now()
                    self.background_task_service._move_completed_task(task_id)
