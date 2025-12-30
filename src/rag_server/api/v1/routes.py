from fastapi import APIRouter

from .health import router as health_router
from .web_urls import router as web_urls_router
from .pdfs import router as pdfs_router
from .crawler import router as crawler_router
from .activities import router as activities_router
from .auth import router as auth_router

router = APIRouter()

# Include sub-routers
router.include_router(health_router)
router.include_router(auth_router)
router.include_router(web_urls_router, prefix="/web_urls", tags=["web_urls"])
router.include_router(pdfs_router, prefix="/pdfs", tags=["pdfs"])
router.include_router(crawler_router, prefix="/crawler", tags=["crawler"])
router.include_router(activities_router, prefix="/activities", tags=["activities"])
