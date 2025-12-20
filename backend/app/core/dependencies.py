"""
Dependency injection container and service providers for the RAG platform
"""
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.domains.crawler.crawler import BiwaseCrawler
from app.shared.background_tasks import BackgroundTaskService
from app.shared.cache_service import CacheService, CacheBackend
from app.infrastructure.repositories.user_repository import UserRepository
from app.infrastructure.repositories.document_repository import DocumentRepository
from app.core.config import settings


# Global service instances (for simple dependency injection)
# In production, consider using a proper DI container like dependency-injector
_background_task_service: Optional[BackgroundTaskService] = None
_crawler_instance: Optional[BiwaseCrawler] = None
_user_repository: Optional[UserRepository] = None
_document_repository: Optional[DocumentRepository] = None


def get_user_repository() -> UserRepository:
    """Get or create user repository instance"""
    global _user_repository
    if _user_repository is None:
        _user_repository = UserRepository()
    return _user_repository


def get_document_repository() -> DocumentRepository:
    """Get or create document repository instance"""
    global _document_repository
    if _document_repository is None:
        _document_repository = DocumentRepository()
    return _document_repository


def get_background_task_service() -> BackgroundTaskService:
    """Get or create background task service instance"""
    global _background_task_service
    if _background_task_service is None:
        _background_task_service = BackgroundTaskService()
    return _background_task_service


def get_crawler_service() -> BiwaseCrawler:
    """Get or create crawler service instance"""
    global _crawler_instance
    if _crawler_instance is None:
        from app.domains.crawler.base_crawler import CrawlConfig
        config = CrawlConfig(
            base_url=settings.BIWASE_BASE_URL,
            output_dir=settings.UPLOAD_DIR,
            max_retries=3,
            retry_delay=settings.CRAWL_DELAY,
            request_timeout=settings.CRAWL_TIMEOUT,
            rate_limit_delay=settings.CRAWL_DELAY
        )
        _crawler_instance = BiwaseCrawler(config)
    return _crawler_instance


# FastAPI dependency functions
async def get_user_repository_dependency() -> UserRepository:
    """FastAPI dependency for user repository"""
    return get_user_repository()


async def get_document_repository_dependency() -> DocumentRepository:
    """FastAPI dependency for document repository"""
    return get_document_repository()


async def get_crawler_dependency() -> BiwaseCrawler:
    """FastAPI dependency for crawler service"""
    return get_crawler_service()


async def get_background_tasks_dependency() -> BackgroundTaskService:
    """FastAPI dependency for background task service"""
    return get_background_task_service()


# Service interfaces for better testability
class ICrawlerService:
    """Interface for crawler services"""

    def crawl_simple(self) -> dict:
        """Execute simple crawl"""
        raise NotImplementedError

    def crawl_full_pipeline(self, background_tasks_service, user_id: str) -> dict:
        """Execute full pipeline crawl"""
        raise NotImplementedError

    def get_pagination_links(self) -> list:
        """Get pagination links"""
        raise NotImplementedError

    def get_news_links(self, page_url: str) -> list:
        """Get news links from page"""
        raise NotImplementedError

    def get_pdf_links(self, article_url: str) -> list:
        """Get PDF links from article"""
        raise NotImplementedError

    def download_pdf(self, pdf_url: str) -> dict:
        """Download PDF from URL"""
        raise NotImplementedError


class IBackgroundTaskService:
    """Interface for background task services"""

    async def start_pdf_processing_task(self, document_id: str, pdf_path: str, filename: str, user_id: str) -> str:
        """Start PDF processing task"""
        raise NotImplementedError

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a task"""
        raise NotImplementedError

    def get_task_status(self, task_id: str) -> Optional[dict]:
        """Get task status"""
        raise NotImplementedError

    def list_active_tasks(self, user_id: Optional[str] = None) -> dict:
        """List active tasks"""
        raise NotImplementedError

    def list_completed_tasks(self, user_id: Optional[str] = None, limit: int = 50) -> list:
        """List completed tasks"""
        raise NotImplementedError

    async def shutdown(self):
        """Shutdown the service"""
        raise NotImplementedError


# Service factory for creating instances with different configurations
class ServiceFactory:
    """Factory for creating service instances"""

    @staticmethod
    def create_crawler(base_url: Optional[str] = None, output_dir: Optional[str] = None) -> BiwaseCrawler:
        """Create a crawler instance with custom configuration"""
        from app.domains.crawler.base_crawler import CrawlConfig
        config = CrawlConfig(
            base_url=base_url or settings.BIWASE_BASE_URL,
            output_dir=output_dir or settings.UPLOAD_DIR,
            max_retries=3,  # Fixed value for now
            retry_delay=settings.CRAWL_DELAY,
            request_timeout=settings.CRAWL_TIMEOUT,
            rate_limit_delay=settings.CRAWL_DELAY
        )
        return BiwaseCrawler(config)

    @staticmethod
    def create_background_task_service() -> BackgroundTaskService:
        """Create a background task service instance"""
        return BackgroundTaskService()


# Context manager for service lifecycle management
@asynccontextmanager
async def service_lifecycle() -> AsyncGenerator[None, None]:
    """Context manager for service lifecycle"""
    # Initialize services
    global _background_task_service, _crawler_instance

    _background_task_service = ServiceFactory.create_background_task_service()
    _crawler_instance = ServiceFactory.create_crawler()

    try:
        yield
    finally:
        # Cleanup services if needed
        _background_task_service = None
        _crawler_instance = None


# Authentication dependencies (for future use)
security = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """Get current user from token (optional authentication)"""
    if not credentials:
        return None

    # TODO: Implement proper JWT token validation
    # For now, return a mock user ID
    return "user_123"


async def get_current_user_required(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Get current user from token (required authentication)"""
    if not credentials:
        # This will raise an HTTPException
        pass

    # TODO: Implement proper JWT token validation
    return "user_123"


# Request-scoped dependencies
def get_request_id(request: Request) -> str:
    """Extract request ID from request headers or generate one"""
    return request.headers.get("X-Request-ID", "req_unknown")
