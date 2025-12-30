"""
Activity-related enumerations for the RAG Server.

This module contains all enums related to user activities, audit logs, and system events.
"""

from enum import Enum

class ActivityType(str, Enum):
    """Enumeration of activity types."""
    WEB_URL_CREATED = "web_url_created"
    PDF_CREATED = "pdf_created"
    PDF_DOWNLOADED = "pdf_downloaded"
    PDF_SKIPPED = "pdf_skipped"
    PDF_FAILED = "pdf_failed"
    API_ACCESSED = "api_accessed"
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    SEARCH_PERFORMED = "search_performed"
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_DELETED = "document_deleted"
    SYSTEM_STARTUP = "system_startup"
    SYSTEM_SHUTDOWN = "system_shutdown"
    CONFIG_CHANGED = "config_changed"

class ActivityAction(str, Enum):
    """Enumeration of activity actions."""
    CREATED = "created"
    UPDATED = "updated"
    DELETED = "deleted"
    ACCESSED = "accessed"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    STARTED = "started"
    STOPPED = "stopped"
    LOGGED_IN = "logged_in"
    LOGGED_OUT = "logged_out"
    UPLOADED = "uploaded"
    DOWNLOADED = "downloaded"
    SEARCHED = "searched"

class EntityType(str, Enum):
    """Enumeration of entity types."""
    WEB_URL = "WebURL"
    PDF = "PDF"
    API = "API"
    USER = "User"
    SYSTEM = "System"
    CRAWLER_EXECUTION = "CrawlerExecution"
    DOCUMENT = "Document"
    SEARCH = "Search"
    CONFIG = "Config"

class ActivitySeverity(str, Enum):
    """Enumeration of activity severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ActivityCategory(str, Enum):
    """Enumeration of activity categories."""
    SECURITY = "security"
    USER_ACTION = "user_action"
    SYSTEM_EVENT = "system_event"
    API_CALL = "api_call"
    DATA_OPERATION = "data_operation"
    CONFIGURATION = "configuration"
