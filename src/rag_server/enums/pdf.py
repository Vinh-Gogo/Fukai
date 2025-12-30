"""
PDF-related enumerations for the RAG Server.

This module contains all enums related to PDF processing, status, and states.
"""

from enum import Enum


class PDFStatus(str, Enum):
    """Enumeration of PDF processing statuses."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"
    FAILED = "failed"


class PDFProcessingState(str, Enum):
    """Enumeration of PDF processing states."""
    UPLOADING = "uploading"
    PARSING = "parsing"
    INDEXING = "indexing"
    READY = "ready"
    FAILED = "failed"


class PDFContentType(str, Enum):
    """Enumeration of PDF content types."""
    DOCUMENT = "document"
    REPORT = "report"
    NEWSLETTER = "newsletter"
    MANUAL = "manual"
    OTHER = "other"


class PDFQuality(str, Enum):
    """Enumeration of PDF quality levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXCELLENT = "excellent"
