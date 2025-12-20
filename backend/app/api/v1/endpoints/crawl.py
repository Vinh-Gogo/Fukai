"""
Crawl API endpoints for PDF crawling operations
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, status
import logging
import re
import datetime
from urllib.parse import urlparse, urljoin

from app.core.config import settings
from app.schemas.crawl import CrawlStartRequest, CrawlStatusResponse, CrawlHistoryResponse
from app.schemas.common import APIResponse, PaginatedResponse, create_success_response, create_paginated_response
from app.core.dependencies import get_background_task_service, get_crawler_dependency
from app.domains.crawler.crawler import BiwaseCrawler
from app.domains.crawler.base_crawler import CrawlConfig
from app.domains.crawler.crawl_service import CrawlService
from app.shared.background_tasks import BackgroundTaskService, TaskStatus
from app.domains.auth.auth_service import AuthService
from app.core.rate_limiting import crawl_start_limit, crawl_status_limit, default_limit

logger = logging.getLogger(__name__)

# Configure structured logging for monitoring
def log_request_start(endpoint: str, user_id: str, **kwargs):
    """Log the start of a request for monitoring"""
    logger.info(f"API_REQUEST_START | endpoint={endpoint} | user_id={user_id} | params={kwargs}")

def log_request_end(endpoint: str, user_id: str, status_code: int, duration_ms: Optional[float] = None, **kwargs):
    """Log the end of a request for monitoring"""
    duration_str = f" | duration_ms={duration_ms:.2f}" if duration_ms else ""
    logger.info(f"API_REQUEST_END | endpoint={endpoint} | user_id={user_id} | status_code={status_code}{duration_str} | params={kwargs}")

def log_security_event(event_type: str, user_id: str, details: Optional[dict] = None):
    """Log security-related events"""
    logger.warning(f"SECURITY_EVENT | type={event_type} | user_id={user_id} | details={details or {}}")

def log_error(endpoint: str, user_id: str, error_type: str, error_message: str, **kwargs):
    """Log errors with structured format"""
    logger.error(f"API_ERROR | endpoint={endpoint} | user_id={user_id} | error_type={error_type} | message={error_message} | params={kwargs}")

# Dependency functions
def get_crawl_service(background_task_service: BackgroundTaskService = Depends(get_background_task_service)) -> CrawlService:
    """Get crawl service with dependencies"""
    return CrawlService(background_task_service=background_task_service)

router = APIRouter()

# Input validation and sanitization functions
def validate_url(url: str) -> str:
    """
    Validate and sanitize URL input

    Args:
        url: URL string to validate

    Returns:
        Sanitized URL string

    Raises:
        ValueError: If URL is invalid
    """
    if not url or not isinstance(url, str):
        raise ValueError("URL must be a non-empty string")

    # Remove leading/trailing whitespace
    url = url.strip()

    # Basic length check
    if len(url) > 2048:  # RFC 3986 recommends limiting to 2048 characters
        raise ValueError("URL too long (max 2048 characters)")

    try:
        parsed = urlparse(url)

        # Must have scheme and netloc
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("Invalid URL format")

        # Only allow http and https
        if parsed.scheme.lower() not in ['http', 'https']:
            raise ValueError("Only HTTP and HTTPS URLs are allowed")

        # Basic hostname validation (not localhost or private IPs for security)
        hostname = parsed.netloc.lower()
        if hostname in ['localhost', '127.0.0.1', '::1'] or hostname.startswith('192.168.') or hostname.startswith('10.') or hostname.startswith('172.'):
            raise ValueError("Localhost and private IP addresses not allowed")

        # Prevent URL injection attacks
        dangerous_chars = ['<', '>', '"', "'", '(', ')', '{', '}', '[', ']', '|', '\\', '^', '`']
        for char in dangerous_chars:
            if char in url:
                raise ValueError(f"Invalid character '{char}' in URL")

        return url

    except Exception as e:
        raise ValueError(f"Invalid URL: {str(e)}")

def validate_task_id(task_id: str) -> str:
    """
    Validate task ID format

    Args:
        task_id: Task ID string to validate

    Returns:
        Sanitized task ID

    Raises:
        ValueError: If task ID is invalid
    """
    if not task_id or not isinstance(task_id, str):
        raise ValueError("Task ID must be a non-empty string")

    # Remove leading/trailing whitespace
    task_id = task_id.strip()

    # Basic length and format check (should be crawl_ followed by 8 hex chars)
    if not re.match(r'^crawl_[0-9a-f]{8}$', task_id):
        raise ValueError("Invalid task ID format")

    return task_id

def validate_pagination_params(limit: int, offset: int) -> tuple[int, int]:
    """
    Validate pagination parameters

    Args:
        limit: Number of items per page
        offset: Offset for pagination

    Returns:
        Tuple of validated (limit, offset)

    Raises:
        ValueError: If parameters are invalid
    """
    if not isinstance(limit, int) or limit < 1 or limit > 100:
        raise ValueError("Limit must be an integer between 1 and 100")

    if not isinstance(offset, int) or offset < 0:
        raise ValueError("Offset must be a non-negative integer")

    return limit, offset

def sanitize_url_list(urls: list) -> list:
    """
    Validate and sanitize a list of URLs

    Args:
        urls: List of URL strings

    Returns:
        List of validated URLs

    Raises:
        ValueError: If any URL is invalid
    """
    if not isinstance(urls, list):
        raise ValueError("URLs must be provided as a list")

    if len(urls) > 50:  # Reasonable limit to prevent abuse
        raise ValueError("Too many URLs (max 50)")

    validated_urls = []
    for url in urls:
        if not isinstance(url, str):
            raise ValueError("All URLs must be strings")
        validated_urls.append(validate_url(url))

    # Remove duplicates while preserving order
    seen = set()
    unique_urls = []
    for url in validated_urls:
        if url not in seen:
            seen.add(url)
            unique_urls.append(url)

    return unique_urls

# Dependency injection - no global instances

@router.post("/start", response_model=APIResponse)
@crawl_start_limit()
async def start_crawl(
    request: CrawlStartRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(AuthService.get_current_user),
    crawl_service: CrawlService = Depends(get_crawl_service)
):
    """
    Start a new crawl operation

    Args:
        request: Crawl configuration
        background_tasks: FastAPI background tasks
        current_user: Authenticated user
        crawl_service: Crawl service instance

    Returns:
        Standardized API response with task information
    """
    try:
        # Use service to handle business logic
        task_info = await crawl_service.start_crawl_operation(
            request=request,
            user_id=str(current_user.id),
            background_tasks=background_tasks
        )

        # Return standardized response
        return create_success_response(
            message=f"Crawl task {task_info['task_id']} started successfully",
            data=task_info
        )

    except ValueError as e:
        # Handle validation errors
        logger.warning(f"Validation error in crawl start: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to start crawl: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error occurred while starting crawl"
        )

@router.get("/status/{task_id}", response_model=CrawlStatusResponse)
@crawl_status_limit()
async def get_crawl_status(
    task_id: str,
    current_user = Depends(AuthService.get_current_user),
    background_task_service: BackgroundTaskService = Depends(get_background_task_service)
):
    """
    Get the status of a crawl task

    Args:
        task_id: Task ID to check

    Returns:
        CrawlStatusResponse with task status
    """
    try:
        # Validate task ID
        task_id = validate_task_id(task_id)

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
    except ValueError as e:
        # Handle validation errors
        logger.warning(f"Validation error in get crawl status: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get crawl status for {task_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error occurred while retrieving task status"
        )

@router.get("/history", response_model=PaginatedResponse)
@default_limit()
async def get_crawl_history(
    limit: int = 10,
    offset: int = 0,
    background_task_service: BackgroundTaskService = Depends(get_background_task_service)
):
    """
    Get crawl history

    Args:
        limit: Number of items per page
        offset: Offset for pagination

    Returns:
        PaginatedResponse with crawl history
    """
    try:
        # Validate pagination parameters
        limit, offset = validate_pagination_params(limit, offset)

        # Get all active tasks
        active_tasks = background_task_service.list_active_tasks()

        # Convert to list and apply pagination
        tasks_list = list(active_tasks.values())
        total_tasks = len(tasks_list)
        paginated_tasks = tasks_list[offset:offset + limit]

        # Calculate page information
        page = (offset // limit) + 1

        return create_paginated_response(
            data=paginated_tasks,
            total=total_tasks,
            page=page,
            page_size=limit,
            message=f"Retrieved {len(paginated_tasks)} of {total_tasks} crawl tasks"
        )

    except ValueError as e:
        # Handle validation errors
        logger.warning(f"Validation error in get crawl history: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get crawl history: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error occurred while retrieving crawl history"
        )

@router.delete("/cancel/{task_id}")
@default_limit()
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
@default_limit()
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
        config = CrawlConfig(
            base_url=url,
            output_dir=settings.UPLOAD_DIR,
            max_retries=3,
            retry_delay=settings.CRAWL_DELAY,
            request_timeout=settings.CRAWL_TIMEOUT,
            rate_limit_delay=settings.CRAWL_DELAY
        )
        crawler = BiwaseCrawler(config)

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
@default_limit()
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

        # Validate and sanitize URLs
        page_urls = sanitize_url_list(page_urls)

        # Create crawler instance
        config = CrawlConfig(
            base_url=settings.BIWASE_BASE_URL,
            output_dir=settings.UPLOAD_DIR,
            max_retries=3,
            retry_delay=settings.CRAWL_DELAY,
            request_timeout=settings.CRAWL_TIMEOUT,
            rate_limit_delay=settings.CRAWL_DELAY
        )
        crawler = BiwaseCrawler(config)

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
@default_limit()
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

        # Validate and sanitize URLs
        article_urls = sanitize_url_list(article_urls)

        # Create crawler instance
        config = CrawlConfig(
            base_url=settings.BIWASE_BASE_URL,
            output_dir=settings.UPLOAD_DIR,
            max_retries=3,
            retry_delay=settings.CRAWL_DELAY,
            request_timeout=settings.CRAWL_TIMEOUT,
            rate_limit_delay=settings.CRAWL_DELAY
        )
        crawler = BiwaseCrawler(config)

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
def _execute_simple_crawl(task_id: str, crawler: BiwaseCrawler, background_task_service: BackgroundTaskService, user_id: str):
    """
    Execute simple crawl in background

    Args:
        task_id: Background task ID
        crawler: BiwaseCrawler instance
        background_task_service: Background task service instance
        user_id: User ID for the crawl
    """
    try:
        logger.info(f"Executing simple crawl task {task_id}")

        # Create background task instance
        from app.shared.background_tasks import BackgroundTask
        task = BackgroundTask(
            task_id=task_id,
            task_type="crawl_simple",
            user_id=user_id,
            metadata={"stage": "crawling", "percentage": 0}
        )

        # Add to active tasks
        background_task_service.active_tasks[task_id] = task
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.datetime.now()

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
            task.completed_at = datetime.datetime.now()
            logger.info(f"Simple crawl task {task_id} completed successfully")
        else:
            task.status = TaskStatus.FAILED
            task.error = result_dict.get("error", "Unknown error")
            task.result = result_dict
            task.completed_at = datetime.datetime.now()
            logger.error(f"Simple crawl task {task_id} failed: {result_dict.get('error')}")

        # Move to completed tasks for memory management
        background_task_service._move_completed_task(task_id)

    except Exception as e:
        logger.error(f"Simple crawl task {task_id} failed with exception: {e}")
        task = background_task_service.active_tasks.get(task_id)
        if task:
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.completed_at = datetime.datetime.now()
            background_task_service._move_completed_task(task_id)

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

        # Create background task instance
        from app.shared.background_tasks import BackgroundTask
        task = BackgroundTask(
            task_id=task_id,
            task_type="crawl_full_pipeline",
            user_id=user_id,
            metadata={"stage": "crawling", "percentage": 0}
        )

        # Add to active tasks
        background_service.active_tasks[task_id] = task
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.datetime.now()

        # Execute full pipeline crawl
        result = crawler.crawl_full_pipeline(
            background_tasks_service=background_service,
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
            task.completed_at = datetime.datetime.now()
            logger.info(f"Full pipeline crawl task {task_id} completed successfully")
        else:
            task.status = TaskStatus.FAILED
            task.error = result_dict.get("error", "Unknown error")
            task.result = result_dict
            task.completed_at = datetime.datetime.now()
            logger.error(f"Full pipeline crawl task {task_id} failed: {result_dict.get('error')}")

        # Move to completed tasks for memory management
        background_service._move_completed_task(task_id)

    except Exception as e:
        logger.error(f"Full pipeline crawl task {task_id} failed with exception: {e}")
        task = background_service.active_tasks.get(task_id)
        if task:
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.completed_at = datetime.datetime.now()
            background_service._move_completed_task(task_id)
