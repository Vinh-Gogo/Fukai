"""
Crawler-related enumerations for the RAG Server.

This module contains all enums related to web crawling, PDF downloading, and crawler operations.
"""

from enum import Enum

class CrawlerStatus(str, Enum):
    """Enumeration of crawler statuses."""
    IDLE = "idle"
    SCANNING = "scanning"
    DOWNLOADING = "downloading"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    STOPPED = "stopped"

class DownloadStatus(str, Enum):
    """Enumeration of download statuses."""
    PENDING = "pending"
    DOWNLOADING = "downloading"
    DOWNLOADED = "downloaded"
    SKIPPED = "skipped"
    FAILED = "failed"
    RETRYING = "retrying"

class CrawlerType(str, Enum):
    """Enumeration of crawler types."""
    WEB_SCRAPER = "web_scraper"
    PDF_EXTRACTOR = "pdf_extractor"
    NEWS_CRAWLER = "news_crawler"
    GENERAL = "general"

class URLStatus(str, Enum):
    """Enumeration of URL processing statuses."""
    DISCOVERED = "discovered"
    QUEUED = "queued"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"
    SKIPPED = "skipped"

class ContentType(str, Enum):
    """Enumeration of content types."""
    HTML = "html"
    PDF = "pdf"
    IMAGE = "image"
    DOCUMENT = "document"
    UNKNOWN = "unknown"

class CrawlDepth(str, Enum):
    """Enumeration of crawl depths."""
    SHALLOW = "shallow"
    MEDIUM = "medium"
    DEEP = "deep"
    UNLIMITED = "unlimited"
