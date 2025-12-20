"""
Health check endpoints
"""
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import psutil
import platform

from app.core.config import settings


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    service: str
    version: str
    timestamp: str
    uptime: str


class SystemInfo(BaseModel):
    """System information response model"""
    cpu_percent: float
    memory_percent: float
    disk_usage: dict
    platform: str
    python_version: str


router = APIRouter()


@router.get("/", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Basic health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="fastapi-backend",
        version="1.0.0",
        timestamp=datetime.now().isoformat(),
        uptime="running"
    )


@router.get("/detailed", response_model=HealthResponse)
async def detailed_health_check() -> HealthResponse:
    """Detailed health check with system information"""
    return HealthResponse(
        status="healthy",
        service="fastapi-backend",
        version="1.0.0",
        timestamp=datetime.now().isoformat(),
        uptime="running"
    )


@router.get("/system", response_model=SystemInfo)
async def system_info() -> SystemInfo:
    """Get system information"""
    disk_usage = psutil.disk_usage('/')

    return SystemInfo(
        cpu_percent=psutil.cpu_percent(interval=1),
        memory_percent=psutil.virtual_memory().percent,
        disk_usage={
            "total": disk_usage.total,
            "used": disk_usage.used,
            "free": disk_usage.free,
            "percent": disk_usage.percent
        },
        platform=platform.platform(),
        python_version=platform.python_version()
    )
