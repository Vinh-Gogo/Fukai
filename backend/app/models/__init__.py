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

__all__ = [
    "CrawlScanResponse",
    "CrawlDownloadRequest",
    "CrawlDownloadResponse",
    "PDFFileInfo",
    "CrawlStatusResponse",
    "CrawlerConfig",
]
