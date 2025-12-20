"""
Crawl API endpoints for PDF crawling operations
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from pydantic import BaseModel, Field
import logging

from app.services.crawler import BiwaseCrawler
from app.services.background_tasks import BackgroundTaskService
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for request/response
class CrawlStartRequest(BaseModel):
    """Request model for starting a crawl"""
    crawl_type: str = Field("simple", description="Type of crawl: 'simple' or 'full_pipeline'")
    user_id: Optional[str] = Field(None, description="User ID for document ownership (required for full_pipeline)")

class CrawlStatusResponse(BaseModel):
    """Response model for crawl status"""
    task_id: str
    status: str
    progress: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: Optional[str] = None

class CrawlHistoryResponse(BaseModel):
    """Response model for crawl history"""
    crawls: list
    total: int

# Global background task service instance
# In a real application, this would be injected via dependency injection
background_task_service = BackgroundTaskService()

@router.post("/start", response_model=Dict[str, Any])
async def start_crawl(
    request: CrawlStartRequest,
    background_tasks: BackgroundTasks
):
    """
    Start a new crawl operation

    Args:
        request: Crawl configuration
        background_tasks: FastAPI background tasks

    Returns:
        Dict with task information
    """
    try:
        # Validate request
        if request.crawl_type not in ["simple", "full_pipeline"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid crawl_type. Must be 'simple' or 'full_pipeline'"
            )

        if request.crawl_type == "full_pipeline" and not request.user_id:
            request.user_id = "system"

        # Create crawler instance
        crawler = BiwaseCrawler(
            base_url=settings.BIWASE_BASE_URL,
            output_dir=settings.UPLOAD_DIR,
            max_retries=3,  # Fixed values for now
            retry_delay=settings.CRAWL_DELAY,
            request_timeout=settings.CRAWL_TIMEOUT,
            rate_limit_delay=settings.CRAWL_DELAY
        )

        # Generate task ID
        import uuid
        task_id = f"crawl_{uuid.uuid4().hex[:8]}"

        # Add to background tasks
        user_id = request.user_id or "system"
        if request.crawl_type == "simple":
            background_tasks.add_task(
                _execute_simple_crawl,
                task_id,
                crawler,
                user_id
            )
        else:
            background_tasks.add_task(
                _execute_full_pipeline_crawl,
                task_id,
                crawler,
                background_task_service,
                user_id
            )

        logger.info(f"Started {request.crawl_type} crawl task {task_id}")

        return {
            "success": True,
            "task_id": task_id,
            "crawl_type": request.crawl_type,
            "status": "running",
            "message": f"Crawl task {task_id} started successfully"
        }

    except Exception as e:
        logger.error(f"Failed to start crawl: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start crawl: {str(e)}")

@router.get("/status/{task_id}", response_model=CrawlStatusResponse)
async def get_crawl_status(task_id: str):
    """
    Get the status of a crawl task

    Args:
        task_id: Task ID to check

    Returns:
        CrawlStatusResponse with task status
    """
    try:
        # Check if task exists in background service
        task_info = background_task_service.get_task_status(task_id)

        if task_info:
            return CrawlStatusResponse(
                task_id=task_id,
                status=task_info.get("status", "unknown"),
                progress=task_info.get("progress"),
                result=task_info.get("result"),
                error=task_info.get("error"),
                created_at=task_info.get("started_at")
            )

        # If not found, return not found
        raise HTTPException(status_code=404, detail=f"Crawl task {task_id} not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get crawl status for {task_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get task status: {str(e)}")

@router.get("/history", response_model=CrawlHistoryResponse)
async def get_crawl_history(limit: int = 10, offset: int = 0):
    """
    Get crawl history

    Args:
        limit: Maximum number of results
        offset: Offset for pagination

    Returns:
        CrawlHistoryResponse with crawl history
    """
    try:
        # Get all active tasks
        active_tasks = background_task_service.list_active_tasks()

        # Convert to list and apply pagination
        tasks_list = list(active_tasks.values())
        paginated_tasks = tasks_list[offset:offset + limit]

        return CrawlHistoryResponse(
            crawls=paginated_tasks,
            total=len(tasks_list)
        )

    except Exception as e:
        logger.error(f"Failed to get crawl history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get crawl history: {str(e)}")

@router.delete("/cancel/{task_id}")
async def cancel_crawl(task_id: str):
    """
    Cancel a running crawl task

    Args:
        task_id: Task ID to cancel

    Returns:
        Dict with cancellation result
    """
    try:
        # Note: FastAPI background tasks don't have built-in cancellation
        # In a production system, you'd want to implement proper task cancellation
        logger.warning(f"Cancellation requested for task {task_id} - not implemented")

        return {
            "success": False,
            "message": "Task cancellation not implemented. Task will complete or timeout naturally."
        }

    except Exception as e:
        logger.error(f"Failed to cancel crawl {task_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel task: {str(e)}")

# Additional endpoints to match frontend expectations
@router.get("/pages")
async def get_pages(url: str):
    """
    Get pagination links from a URL (frontend compatibility endpoint)

    Args:
        url: URL to crawl for pages

    Returns:
        Dict with pages found
    """
    try:
        # Create crawler instance with the provided URL as base_url
        crawler = BiwaseCrawler(
            base_url=url,
            output_dir=settings.UPLOAD_DIR,
            max_retries=3,
            retry_delay=settings.CRAWL_DELAY,
            request_timeout=settings.CRAWL_TIMEOUT,
            rate_limit_delay=settings.CRAWL_DELAY
        )

        # Get pagination links (returns list of URLs)
        page_urls = crawler.get_pagination_links()

        return {
            "success": True,
            "pages_found": len(page_urls),
            "page_urls": page_urls,
            "message": f"Found {len(page_urls)} pages"
        }

    except Exception as e:
        logger.error(f"Failed to get pages from {url}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get pages: {str(e)}")

@router.post("/articles")
async def get_articles(request: Dict[str, Any]):
    """
    Get articles from page URLs (frontend compatibility endpoint)

    Args:
        request: Dict with page_urls

    Returns:
        Dict with articles found
    """
    try:
        page_urls = request.get("page_urls", [])
        if not page_urls:
            raise HTTPException(status_code=400, detail="page_urls is required")

        # Create crawler instance
        crawler = BiwaseCrawler(
            base_url=settings.BIWASE_BASE_URL,
            output_dir=settings.UPLOAD_DIR,
            max_retries=3,
            retry_delay=settings.CRAWL_DELAY,
            request_timeout=settings.CRAWL_TIMEOUT,
            rate_limit_delay=settings.CRAWL_DELAY
        )

        # Get articles from all pages
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

    except Exception as e:
        logger.error(f"Failed to get articles: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get articles: {str(e)}")

@router.post("/pdf-links")
async def get_pdf_links(request: Dict[str, Any]):
    """
    Extract PDF links from article URLs (frontend compatibility endpoint)

    Args:
        request: Dict with article_urls

    Returns:
        Dict with PDF links found
    """
    try:
        article_urls = request.get("article_urls", [])
        if not article_urls:
            raise HTTPException(status_code=400, detail="article_urls is required")

        # Create crawler instance
        crawler = BiwaseCrawler(
            base_url=settings.BIWASE_BASE_URL,
            output_dir=settings.UPLOAD_DIR,
            max_retries=3,
            retry_delay=settings.CRAWL_DELAY,
            request_timeout=settings.CRAWL_TIMEOUT,
            rate_limit_delay=settings.CRAWL_DELAY
        )

        # Get PDF links from all articles
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

    except Exception as e:
        logger.error(f"Failed to get PDF links: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get PDF links: {str(e)}")

# Background task execution functions
def _execute_simple_crawl(task_id: str, crawler: BiwaseCrawler, user_id: str):
    """
    Execute simple crawl in background

    Args:
        task_id: Background task ID
        crawler: BiwaseCrawler instance
        user_id: User ID for the crawl
    """
    try:
        logger.info(f"Executing simple crawl task {task_id}")

        # Store task in background service
        import datetime
        background_task_service.active_tasks[task_id] = {
            "type": "crawl_simple",
            "status": "running",
            "progress": {"stage": "crawling", "percentage": 0},
            "started_at": datetime.datetime.now().isoformat(),
            "user_id": user_id
        }

        # Execute crawl
        result = crawler.crawl_simple()

        # Update task status
        if result["success"]:
            background_task_service.active_tasks[task_id].update({
                "status": "completed",
                "progress": {"stage": "completed", "percentage": 100},
                "result": result
            })
            logger.info(f"Simple crawl task {task_id} completed successfully")
        else:
            background_task_service.active_tasks[task_id].update({
                "status": "failed",
                "error": result.get("error", "Unknown error"),
                "result": result
            })
            logger.error(f"Simple crawl task {task_id} failed: {result.get('error')}")

    except Exception as e:
        logger.error(f"Simple crawl task {task_id} failed with exception: {e}")
        background_task_service.active_tasks[task_id].update({
            "status": "failed",
            "error": str(e)
        })

def _execute_full_pipeline_crawl(
    task_id: str,
    crawler: BiwaseCrawler,
    background_service: BackgroundTaskService,
    user_id: str
):
    """
    Execute full pipeline crawl in background

    Args:
        task_id: Background task ID
        crawler: BiwaseCrawler instance
        background_service: BackgroundTaskService instance
        user_id: User ID for the crawl
    """
    try:
        logger.info(f"Executing full pipeline crawl task {task_id}")

        # Store task in background service
        import datetime
        background_task_service.active_tasks[task_id] = {
            "type": "crawl_full_pipeline",
            "status": "running",
            "progress": {"stage": "crawling", "percentage": 0},
            "started_at": datetime.datetime.now().isoformat(),
            "user_id": user_id
        }

        # Execute full pipeline crawl
        result = crawler.crawl_full_pipeline(
            background_tasks_service=background_service,
            user_id=user_id
        )

        # Update task status
        if result["success"]:
            background_task_service.active_tasks[task_id].update({
                "status": "completed",
                "progress": {"stage": "completed", "percentage": 100},
                "result": result
            })
            logger.info(f"Full pipeline crawl task {task_id} completed successfully")
        else:
            background_task_service.active_tasks[task_id].update({
                "status": "failed",
                "error": result.get("error", "Unknown error"),
                "result": result
            })
            logger.error(f"Full pipeline crawl task {task_id} failed: {result.get('error')}")

    except Exception as e:
        logger.error(f"Full pipeline crawl task {task_id} failed with exception: {e}")
        background_task_service.active_tasks[task_id].update({
            "status": "failed",
            "error": str(e)
        })
