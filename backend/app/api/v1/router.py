"""
API v1 router for the Search RAG backend.

This module defines the main API router for version 1 of the API,
including all endpoint routers and middleware.
"""

from fastapi import APIRouter, Request
import structlog

from app.api.deps import get_logger, get_request_id


# Create the main API v1 router
api_router = APIRouter()


# Request logging middleware
@api_router.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware to log API requests and responses.

    This middleware logs request details and response status for monitoring
    and debugging purposes.
    """
    logger = get_logger(request)
    request_id = get_request_id(request)

    # Log request start
    logger.info(
        "API request started",
        method=request.method,
        url=str(request.url),
        headers=dict(request.headers),
        client=request.client.host if request.client else None,
    )

    try:
        # Process the request
        response = await call_next(request)

        # Log successful response
        logger.info(
            "API request completed",
            status_code=response.status_code,
            content_length=response.headers.get("content-length"),
        )

        return response

    except Exception as e:
        # Log error response
        logger.error(
            "API request failed",
            error=str(e),
            exc_info=True,
        )
        raise


# Import and include endpoint routers
from app.api.v1.endpoints import health, documents, search, rag, auth

# Include routers with prefixes
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

api_router.include_router(
    documents.router,
    prefix="/documents",
    tags=["documents"]
)

api_router.include_router(
    search.router,
    prefix="/search",
    tags=["search"]
)

api_router.include_router(
    rag.router,
    prefix="/rag",
    tags=["rag"]
)

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)


# API info endpoint
@api_router.get("/", tags=["info"])
async def api_info():
    """
    Get API information and available endpoints.

    Returns basic information about the API and links to documentation.
    """
    return {
        "name": "Search RAG Backend API",
        "version": "v1",
        "description": "REST API for document search and retrieval-augmented generation",
        "endpoints": {
            "health": "/health",
            "documents": "/documents",
            "search": "/search",
            "rag": "/rag",
            "auth": "/auth",
            "docs": "/docs",
            "openapi": "/openapi.json",
        },
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json",
        },
    }
