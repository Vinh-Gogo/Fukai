"""
Dependency injection container for services
"""
from typing import Optional
from contextlib import asynccontextmanager

from .config import settings
from ..infrastructure.repositories.user_repository import UserRepository
from ..infrastructure.repositories.document_repository import DocumentRepository
from ..domains.auth.auth_service import AuthService
from ..domains.search.embedding_service import EmbeddingService
from ..domains.search.qdrant_service import QDrantService
from ..domains.search.rag_service import RAGService
from ..domains.documents.pdf_processor import PDFProcessor
from ..domains.crawler.crawler import BiwaseCrawler
from ..domains.crawler.base_crawler import CrawlConfig
from ..shared.cache_service import CacheService
from ..shared.background_tasks import BackgroundTaskService


class ServiceContainer:
    """Dependency injection container for all services"""

    def __init__(self):
        # Initialize repositories
        self._user_repository: Optional[UserRepository] = None
        self._document_repository: Optional[DocumentRepository] = None

        # Initialize services
        self._auth_service: Optional[AuthService] = None
        self._cache_service: Optional[CacheService] = None
        self._embedding_service: Optional[EmbeddingService] = None
        self._qdrant_service: Optional[QDrantService] = None
        self._rag_service: Optional[RAGService] = None
        self._pdf_processor: Optional[PDFProcessor] = None
        self._crawler: Optional[BiwaseCrawler] = None
        self._background_task_service: Optional[BackgroundTaskService] = None

    @property
    def user_repository(self) -> UserRepository:
        if self._user_repository is None:
            self._user_repository = UserRepository()
        return self._user_repository

    @property
    def document_repository(self) -> DocumentRepository:
        if self._document_repository is None:
            self._document_repository = DocumentRepository()
        return self._document_repository

    @property
    def cache_service(self) -> CacheService:
        if self._cache_service is None:
            self._cache_service = CacheService()
        return self._cache_service

    @property
    def auth_service(self) -> AuthService:
        if self._auth_service is None:
            self._auth_service = AuthService()
        return self._auth_service

    @property
    def embedding_service(self) -> EmbeddingService:
        if self._embedding_service is None:
            self._embedding_service = EmbeddingService()
        return self._embedding_service

    @property
    def qdrant_service(self) -> QDrantService:
        if self._qdrant_service is None:
            self._qdrant_service = QDrantService()
        return self._qdrant_service

    @property
    def rag_service(self) -> RAGService:
        if self._rag_service is None:
            self._rag_service = RAGService()
        return self._rag_service

    @property
    def pdf_processor(self) -> PDFProcessor:
        if self._pdf_processor is None:
            self._pdf_processor = PDFProcessor()
        return self._pdf_processor

    @property
    def crawler(self) -> BiwaseCrawler:
        if self._crawler is None:
            config = CrawlConfig(
                base_url=settings.BIWASE_BASE_URL,
                output_dir=settings.UPLOAD_DIR,
                max_retries=3,
                retry_delay=settings.CRAWL_DELAY,
                request_timeout=settings.CRAWL_TIMEOUT,
                rate_limit_delay=settings.CRAWL_DELAY
            )
            self._crawler = BiwaseCrawler(config)
        return self._crawler

    @property
    def background_task_service(self) -> BackgroundTaskService:
        if self._background_task_service is None:
            self._background_task_service = BackgroundTaskService()
        return self._background_task_service

    async def initialize(self):
        """Initialize all services that need async setup"""
        # Services will be initialized lazily when accessed
        pass

    async def shutdown(self):
        """Shutdown all services that need cleanup"""
        # Services will be cleaned up when the application shuts down
        pass


# Global service container instance
service_container = ServiceContainer()


@asynccontextmanager
async def get_service_container():
    """Context manager for service container lifecycle"""
    await service_container.initialize()
    try:
        yield service_container
    finally:
        await service_container.shutdown()


# Dependency injection functions for FastAPI
def get_auth_service() -> AuthService:
    """Get auth service instance"""
    return service_container.auth_service

def get_cache_service() -> CacheService:
    """Get cache service instance"""
    return service_container.cache_service

def get_embedding_service() -> EmbeddingService:
    """Get embedding service instance"""
    return service_container.embedding_service

def get_qdrant_service() -> QDrantService:
    """Get QDrant service instance"""
    return service_container.qdrant_service

def get_rag_service() -> RAGService:
    """Get RAG service instance"""
    return service_container.rag_service

def get_pdf_processor() -> PDFProcessor:
    """Get PDF processor instance"""
    return service_container.pdf_processor

def get_crawler() -> BiwaseCrawler:
    """Get crawler instance"""
    return service_container.crawler

def get_background_task_service() -> BackgroundTaskService:
    """Get background task service instance"""
    return service_container.background_task_service
