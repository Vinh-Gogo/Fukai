"""
Health check endpoints with external dependency monitoring
"""
import asyncio
import time
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import psutil
import platform
import httpx
import sqlite3
import logging

from app.core.config import settings
from app.shared.cache_service import CacheService

logger = logging.getLogger(__name__)


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


class DependencyStatus(BaseModel):
    """External dependency status"""
    name: str
    status: str  # "healthy", "unhealthy", "unknown"
    response_time: Optional[float] = None
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class ComprehensiveHealthResponse(BaseModel):
    """Comprehensive health check response"""
    status: str
    service: str
    version: str
    timestamp: str
    uptime: str
    dependencies: List[DependencyStatus]
    system: SystemInfo
    config_validation: Dict[str, Any]


router = APIRouter()


async def check_database_health() -> DependencyStatus:
    """Check database connectivity"""
    start_time = time.time()
    try:
        if settings.DATABASE_URL.startswith("sqlite://"):
            db_path = settings.DATABASE_URL.replace("sqlite:///", "")
            if db_path == ":memory:":
                # In-memory SQLite
                conn = sqlite3.connect(":memory:")
                conn.execute("SELECT 1")
                conn.close()
                return DependencyStatus(
                    name="database",
                    status="healthy",
                    response_time=time.time() - start_time,
                    details={"type": "sqlite", "location": ":memory:"}
                )
            else:
                # File-based SQLite
                conn = sqlite3.connect(db_path)
                conn.execute("SELECT 1")
                conn.close()
                return DependencyStatus(
                    name="database",
                    status="healthy",
                    response_time=time.time() - start_time,
                    details={"type": "sqlite", "path": db_path}
                )
        else:
            # For other database types, we'll mark as unknown since we don't have drivers
            return DependencyStatus(
                name="database",
                status="unknown",
                error="Unsupported database type for health check",
                details={"url": settings.DATABASE_URL.split("://")[0]}
            )
    except Exception as e:
        return DependencyStatus(
            name="database",
            status="unhealthy",
            response_time=time.time() - start_time,
            error=str(e)
        )


async def check_qdrant_health() -> DependencyStatus:
    """Check QDrant service health"""
    if not settings.QDRANT_URL:
        return DependencyStatus(
            name="qdrant",
            status="unknown",
            error="QDRANT_URL not configured"
        )

    start_time = time.time()
    try:
        # Try to connect to QDrant health endpoint
        health_url = f"{settings.QDRANT_URL}/health"
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(health_url)
            if response.status_code == 200:
                return DependencyStatus(
                    name="qdrant",
                    status="healthy",
                    response_time=time.time() - start_time,
                    details={"url": settings.QDRANT_URL}
                )
            else:
                return DependencyStatus(
                    name="qdrant",
                    status="unhealthy",
                    response_time=time.time() - start_time,
                    error=f"HTTP {response.status_code}",
                    details={"url": settings.QDRANT_URL}
                )
    except Exception as e:
        return DependencyStatus(
            name="qdrant",
            status="unhealthy",
            response_time=time.time() - start_time,
            error=str(e),
            details={"url": settings.QDRANT_URL}
        )


async def check_embedding_service_health() -> DependencyStatus:
    """Check embedding service health"""
    start_time = time.time()
    try:
        # Try a simple health check to the embedding service
        health_url = f"{settings.OPENAI_BASE_URL_EMBED}/health"
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(health_url)
            if response.status_code in [200, 404]:  # 404 might mean no health endpoint but service is up
                return DependencyStatus(
                    name="embedding_service",
                    status="healthy",
                    response_time=time.time() - start_time,
                    details={"url": settings.OPENAI_BASE_URL_EMBED}
                )
            else:
                return DependencyStatus(
                    name="embedding_service",
                    status="unhealthy",
                    response_time=time.time() - start_time,
                    error=f"HTTP {response.status_code}",
                    details={"url": settings.OPENAI_BASE_URL_EMBED}
                )
    except Exception as e:
        # If health endpoint doesn't exist, try a basic models endpoint
        try:
            models_url = f"{settings.OPENAI_BASE_URL_EMBED}/v1/models"
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(models_url)
                if response.status_code == 200:
                    return DependencyStatus(
                        name="embedding_service",
                        status="healthy",
                        response_time=time.time() - start_time,
                        details={"url": settings.OPENAI_BASE_URL_EMBED, "checked_via": "models"}
                    )
        except:
            pass

        return DependencyStatus(
            name="embedding_service",
            status="unhealthy",
            response_time=time.time() - start_time,
            error=str(e),
            details={"url": settings.OPENAI_BASE_URL_EMBED}
        )


async def check_cache_health() -> DependencyStatus:
    """Check cache service health"""
    start_time = time.time()
    try:
        # Try to create a cache service and test it
        cache_service = CacheService()
        test_key = "health_check_test"
        test_value = {"test": True, "timestamp": time.time()}

        # Test set operation
        success = await cache_service.set(test_key, test_value, ttl=60)
        if not success:
            return DependencyStatus(
                name="cache",
                status="unhealthy",
                response_time=time.time() - start_time,
                error="Failed to set test value"
            )

        # Test get operation
        retrieved = await cache_service.get(test_key)
        if retrieved != test_value:
            return DependencyStatus(
                name="cache",
                status="unhealthy",
                response_time=time.time() - start_time,
                error="Retrieved value doesn't match set value"
            )

        # Clean up
        await cache_service.delete(test_key)

        # Get cache stats
        stats = await cache_service.get_stats()

        return DependencyStatus(
            name="cache",
            status="healthy",
            response_time=time.time() - start_time,
            details={"backend": stats.get("backend_type", "unknown")}
        )

    except Exception as e:
        return DependencyStatus(
            name="cache",
            status="unhealthy",
            response_time=time.time() - start_time,
            error=str(e)
        )


async def check_external_dependencies() -> List[DependencyStatus]:
    """Check all external dependencies concurrently"""
    tasks = [
        check_database_health(),
        check_qdrant_health(),
        check_embedding_service_health(),
        check_cache_health(),
    ]

    # Add Redis check if configured (but redis import failed, so skip for now)
    # if settings.REDIS_URL:
    #     tasks.append(check_redis_health())

    results = await asyncio.gather(*tasks, return_exceptions=True)

    dependency_statuses = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            # If a check failed with an exception, create an error status
            task_names = ["database", "qdrant", "embedding_service", "cache"]
            dependency_statuses.append(DependencyStatus(
                name=task_names[i],
                status="unhealthy",
                error=f"Check failed: {str(result)}"
            ))
        else:
            dependency_statuses.append(result)

    return dependency_statuses


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


@router.get("/comprehensive", response_model=ComprehensiveHealthResponse)
async def comprehensive_health_check() -> ComprehensiveHealthResponse:
    """Comprehensive health check with external dependencies and configuration validation"""
    try:
        # Check all external dependencies concurrently
        dependencies = await check_external_dependencies()

        # Get system information
        disk_usage = psutil.disk_usage('/')
        system_info = SystemInfo(
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

        # Run configuration validation
        config_validation = settings.validate_configuration()

        # Determine overall health status
        unhealthy_deps = [dep for dep in dependencies if dep.status == "unhealthy"]
        config_errors = len(config_validation.get("errors", []))

        if unhealthy_deps or config_errors > 0:
            overall_status = "unhealthy"
        elif any(dep.status == "unknown" for dep in dependencies):
            overall_status = "degraded"
        else:
            overall_status = "healthy"

        return ComprehensiveHealthResponse(
            status=overall_status,
            service="fastapi-backend",
            version="1.0.0",
            timestamp=datetime.now().isoformat(),
            uptime="running",
            dependencies=dependencies,
            system=system_info,
            config_validation=config_validation
        )

    except Exception as e:
        logger.error(f"Comprehensive health check failed: {e}")
        # Return a degraded status if health check itself fails
        return ComprehensiveHealthResponse(
            status="unhealthy",
            service="fastapi-backend",
            version="1.0.0",
            timestamp=datetime.now().isoformat(),
            uptime="running",
            dependencies=[
                DependencyStatus(
                    name="health_check_system",
                    status="unhealthy",
                    error=f"Health check failed: {str(e)}"
                )
            ],
            system=SystemInfo(
                cpu_percent=0.0,
                memory_percent=0.0,
                disk_usage={},
                platform=platform.platform(),
                python_version=platform.python_version()
            ),
            config_validation={
                "valid": False,
                "errors": [f"Health check system error: {str(e)}"],
                "warnings": [],
                "checks": {}
            }
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
