"""
Models package for the Search RAG backend.

This package contains all Pydantic models used throughout the application.
"""

# Import crawler models
from .crawler import (
    CrawlScanResponse,
    CrawlDownloadRequest,
    CrawlDownloadResponse,
    PDFFileInfo,
    CrawlStatusResponse,
    CrawlerConfig,
)

# Import document models (SQLAlchemy models for database)
from .documents import (
    Document,
    DocumentChunk,
    ProcessingJob,
    DocumentCollection,
    CollectionDocument,
)

__all__ = [
    "CrawlScanResponse",
    "CrawlDownloadRequest",
    "CrawlDownloadResponse",
    "PDFFileInfo",
    "CrawlStatusResponse",
    "CrawlerConfig",
    # Document models
    "Document",
    "DocumentChunk",
    "ProcessingJob",
    "DocumentCollection",
    "CollectionDocument",
]
