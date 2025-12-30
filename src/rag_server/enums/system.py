"""
System-related enumerations for the RAG Server.

This module contains all enums related to system health, logging, and general system operations.
"""

from enum import Enum

class HealthStatus(str, Enum):
    """Enumeration of system health statuses."""
    HEALTHY = "healthy"
    WARNING = "warning"
    UNHEALTHY = "unhealthy"
    CRITICAL = "critical"
    UNKNOWN = "unknown"

class LogLevel(str, Enum):
    """Enumeration of logging levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class SystemComponent(str, Enum):
    """Enumeration of system components."""
    DATABASE = "database"
    VECTOR_DB = "vector_database"
    LLM_SERVICES = "llm_services"
    API_SERVER = "api_server"
    FILE_SYSTEM = "file_system"
    CACHE = "cache"
    QUEUE = "queue"
    MONITORING = "monitoring"

class Environment(str, Enum):
    """Enumeration of deployment environments."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"

class ServiceStatus(str, Enum):
    """Enumeration of service statuses."""
    RUNNING = "running"
    STOPPED = "stopped"
    STARTING = "starting"
    STOPPING = "stopping"
    ERROR = "error"
    MAINTENANCE = "maintenance"

class MetricType(str, Enum):
    """Enumeration of metric types."""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"

class ConfigSource(str, Enum):
    """Enumeration of configuration sources."""
    ENVIRONMENT = "environment"
    FILE = "file"
    DATABASE = "database"
    DEFAULT = "default"
