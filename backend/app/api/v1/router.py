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


# Import and include endpoint routers
from app.api.v1.endpoints import health, documents, search, rag, crawler

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
    crawler.router,
    prefix="/crawler",
    tags=["crawler"]
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
            "crawler": "/crawler",
            "docs": "/docs",
            "openapi": "/openapi.json",
        },
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json",
        },
    }
