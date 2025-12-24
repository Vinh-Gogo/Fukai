"""
Application lifecycle events and handlers.

This module manages startup and shutdown events for the FastAPI application,
including database initialization, background task setup, and cleanup.
"""

import asyncio
from typing import Callable
import structlog

from app.config.database import create_tables
from app.config.settings import settings
from app.workers.celery_app import celery_app


logger = structlog.get_logger(__name__)


async def startup_event() -> None:
    """
    Application startup event handler.

    Performs initialization tasks:
    - Database table creation
    - Background task setup
    - External service connections
    - Logging setup
    """
    logger.info("Starting Search RAG backend application")

    try:
        # Create database tables
        logger.info("Creating database tables")
        create_tables()
        logger.info("Database tables created successfully")

        # Initialize vector database connection (lazy initialization)
        logger.info("Vector database connection will be initialized on first use")

        # Initialize background task queue
        logger.info("Initializing background task queue")
        # Celery will be initialized when first task is sent

        # Log startup completion
        logger.info(
            "Application startup completed",
            environment=settings.ENVIRONMENT,
            debug=settings.DEBUG,
            host=settings.HOST,
            port=settings.PORT,
        )

    except Exception as e:
        logger.error("Application startup failed", error=str(e), exc_info=True)
        raise


async def shutdown_event() -> None:
    """
    Application shutdown event handler.

    Performs cleanup tasks:
    - Close database connections
    - Stop background tasks
    - Close external service connections
    - Final logging
    """
    logger.info("Shutting down Search RAG backend application")

    try:
        # Close database connections (handled by SQLAlchemy connection pooling)

        # Stop background tasks gracefully
        logger.info("Stopping background tasks")
        # Cancel any running background tasks if needed

        # Close external connections
        logger.info("Closing external service connections")

        # Log shutdown completion
        logger.info("Application shutdown completed")

    except Exception as e:
        logger.error("Application shutdown error", error=str(e), exc_info=True)


def create_startup_handler() -> Callable[[], None]:
    """Create startup event handler."""
    async def startup_handler():
        await startup_event()
    return startup_handler


def create_shutdown_handler() -> Callable[[], None]:
    """Create shutdown event handler."""
    async def shutdown_handler():
        await shutdown_event()
    return shutdown_handler
