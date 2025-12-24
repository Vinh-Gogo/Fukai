"""
Search RAG Backend - Main FastAPI Application

This is the main entry point for the Search RAG backend service.
It provides REST API endpoints for document processing, search, and RAG operations.
"""

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog

from app.config.settings import settings
from app.core.exceptions import setup_exception_handlers
from app.core.events import create_startup_handler, create_shutdown_handler
from app.api.v1.router import api_router
from app.utils.logger import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown events."""
    # Startup
    startup_handler = create_startup_handler()
    await startup_handler()

    yield

    # Shutdown
    shutdown_handler = create_shutdown_handler()
    await shutdown_handler()


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""

    # Setup structured logging
    setup_logging()

    # Create FastAPI app with lifespan
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.PROJECT_DESCRIPTION,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Set up CORS
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Set up trusted hosts
    if not settings.DEBUG:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS,
        )

    # Setup custom exception handlers
    setup_exception_handlers(app)

    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Health check endpoint (simple, without dependencies)
    @app.get("/health", tags=["health"])
    async def health_check():
        """Basic health check endpoint."""
        return {
            "status": "healthy",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
        }

    # Root endpoint
    @app.get("/", tags=["root"])
    async def root():
        """Root endpoint with API information."""
        return {
            "message": f"Welcome to {settings.PROJECT_NAME}",
            "version": settings.VERSION,
            "docs": "/docs",
            "health": "/health",
            "api": settings.API_V1_STR,
        }

    return app


# Create the FastAPI application instance
app = create_application()


if __name__ == "__main__":
    # Run the application with uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_config=None,  # Use our custom logging
        access_log=True,
    )
