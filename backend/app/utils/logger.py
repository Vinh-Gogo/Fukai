"""
Structured logging configuration for the Search RAG backend.

This module sets up structured logging with JSON output for production
and human-readable output for development.
"""

import logging
import sys
from typing import Any, Dict
from pythonjsonlogger import jsonlogger

from app.config.settings import settings


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional fields."""

    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        """Add custom fields to the log record."""
        super().add_fields(log_record, record, message_dict)

        # Add application-specific fields
        log_record["service"] = "search-rag-backend"
        log_record["environment"] = settings.ENVIRONMENT
        log_record["version"] = settings.VERSION

        # Add request context if available
        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id

        # Clean up None values
        log_record = {k: v for k, v in log_record.items() if v is not None}


def setup_logging() -> None:
    """
    Setup structured logging for the application.

    Configures different loggers with appropriate formatters and levels
    based on the environment settings.
    """
    # Clear existing handlers
    root_logger = logging.getLogger()
    root_logger.handlers.clear()

    # Set root logger level
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))

    # Choose formatter based on log format setting
    if settings.LOG_FORMAT.lower() == "json":
        formatter = CustomJsonFormatter(
            fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    else:
        # Human-readable formatter for development
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Set specific log levels for noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("pydantic").setLevel(logging.WARNING)

    # Ensure uvicorn uses our logging configuration
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)

    # Log setup completion
    logger = logging.getLogger(__name__)
    logger.info(
        "Logging setup completed",
        log_level=settings.LOG_LEVEL,
        log_format=settings.LOG_FORMAT,
        environment=settings.ENVIRONMENT
    )


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the specified name.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


# Import structlog for structured logging (if available)
try:
    import structlog

    # Configure structlog to work with standard logging
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.WriteLoggerFactory(),
        cache_logger_on_first_use=True,
    )

except ImportError:
    # structlog not available, use standard logging
    pass
