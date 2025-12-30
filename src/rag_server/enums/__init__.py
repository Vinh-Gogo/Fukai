"""
Enums package for the RAG Server.

This package contains all enumerations organized by module domain.
Import specific enums from their respective modules:

    from src.rag_server.enums.pdf import PDFStatus, PDFProcessingState
    from src.rag_server.enums.auth import UserRole, AuthMethod
    from src.rag_server.enums.activity import ActivityType, ActivityAction
    from src.rag_server.enums.crawler import CrawlerStatus, DownloadStatus
    from src.rag_server.enums.api import HTTPStatus, ErrorCategory
    from src.rag_server.enums.system import HealthStatus, LogLevel
"""

# Convenience imports for commonly used enums
try:
    from .activity import ActivityType, ActivityAction, EntityType
    from .auth import UserRole, AuthMethod
    from .pdf import PDFStatus, PDFProcessingState
    from .system import HealthStatus, LogLevel
except ImportError:
    # Handle absolute imports when running from different directories
    from activity import ActivityType, ActivityAction, EntityType
    from auth import UserRole, AuthMethod
    from pdf import PDFStatus, PDFProcessingState
    from system import HealthStatus, LogLevel

__all__ = [
    # Activity enums
    "ActivityType",
    "ActivityAction",
    "EntityType",

    # Auth enums
    "UserRole",
    "AuthMethod",

    # PDF enums
    "PDFStatus",
    "PDFProcessingState",

    # System enums
    "HealthStatus",
    "LogLevel",
]
