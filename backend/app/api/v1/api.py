"""
Main API router that combines all endpoint routers
"""
from fastapi import APIRouter

from app.api.v1.endpoints import crawl, files, health

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

api_router.include_router(
    crawl.router,
    prefix="/crawl",
    tags=["crawl"]
)

api_router.include_router(
    files.router,
    prefix="/files",
    tags=["files"]
)
