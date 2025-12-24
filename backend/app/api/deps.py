"""
FastAPI dependency functions for the Search RAG backend.

This module provides common dependencies used across API endpoints,
including database sessions and request context.
"""

import uuid
from typing import Generator
from fastapi import Depends, Request
from sqlalchemy.orm import Session
import structlog

from app.config.database import get_db


def get_request_id(request: Request) -> str:
    """
    Generate or retrieve request ID for tracing.

    Args:
        request: FastAPI request object

    Returns:
        Request ID string
    """
    request_id = getattr(request.state, "request_id", None)
    if not request_id:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
    return request_id


def get_logger(request: Request) -> structlog.BoundLogger:
    """
    Get a logger with request context.

    Args:
        request: FastAPI request object

    Returns:
        Structured logger with request context
    """
    request_id = get_request_id(request)
    return structlog.get_logger().bind(request_id=request_id)


def get_db_session(
    request: Request,
    db: Session = Depends(get_db)
) -> Generator[Session, None, None]:
    """
    Get database session with request context logging.

    Args:
        request: FastAPI request object
        db: Database session

    Yields:
        Database session
    """
    logger = get_logger(request)

    try:
        # Log database operation start
        logger.debug("Database session started")

        yield db

        # Log successful completion
        logger.debug("Database session completed")

    except Exception as e:
        # Log database errors
        logger.error(
            "Database session error",
            error=str(e),
            exc_info=True
        )
        raise
    finally:
        # Session cleanup is handled by get_db dependency
        pass


# Common dependencies for reuse
CommonDeps = dict(
    db=Depends(get_db_session),
    logger=Depends(get_logger),
    request_id=Depends(get_request_id),
)
