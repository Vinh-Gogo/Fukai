"""
Health check utilities for the RAG platform
"""
import asyncio
import time
from typing import Dict, Any, List, Optional, Callable, Union, cast
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class HealthCheckResult:
    """Result of a health check"""

    def __init__(self, name: str, status: str, response_time: float,
                 error: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        self.name = name
        self.status = status  # "healthy", "unhealthy", "degraded"
        self.response_time = response_time
        self.error = error
        self.details = details or {}
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "name": self.name,
            "status": self.status,
            "response_time": self.response_time,
            "error": self.error,
            "details": self.details,
            "timestamp": self.timestamp.isoformat()
        }


class HealthChecker:
    """Health check coordinator"""

    def __init__(self):
        self.checks: Dict[str, Callable] = {}

    def add_check(self, name: str, check_func: Callable):
        """Add a health check"""
        self.checks[name] = check_func

    async def run_check(self, name: str) -> HealthCheckResult:
        """Run a single health check"""
        check_func = self.checks.get(name)
        if not check_func:
            return HealthCheckResult(
                name=name,
                status="unhealthy",
                response_time=0.0,
                error="Check not found"
            )

        start_time = time.time()
        try:
            result = await check_func() if asyncio.iscoroutinefunction(check_func) else check_func()
            response_time = time.time() - start_time

            if isinstance(result, dict):
                status = result.get("status", "healthy")
                error = result.get("error")
                details = result.get("details", {})
            else:
                status = "healthy" if result else "unhealthy"
                error = None
                details = {}

            return HealthCheckResult(
                name=name,
                status=status,
                response_time=response_time,
                error=error,
                details=details
            )

        except Exception as e:
            response_time = time.time() - start_time
            return HealthCheckResult(
                name=name,
                status="unhealthy",
                response_time=response_time,
                error=str(e)
            )

    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        results = {}
        total_start_time = time.time()

        # Run checks concurrently
        tasks = [self.run_check(name) for name in self.checks.keys()]
        check_results = await asyncio.gather(*tasks, return_exceptions=True)

        for name, result in zip(self.checks.keys(), check_results):
            if isinstance(result, Exception):
                error_result = HealthCheckResult(
                    name=name,
                    status="unhealthy",
                    response_time=0.0,
                    error=str(result)
                )
                results[name] = error_result.to_dict()
            else:
                # At this point, result is guaranteed to be a HealthCheckResult
                health_result = cast(HealthCheckResult, result)
                results[name] = health_result.to_dict()

        # Determine overall status
        statuses = [r["status"] for r in results.values()]
        if "unhealthy" in statuses:
            overall_status = "unhealthy"
        elif "degraded" in statuses:
            overall_status = "degraded"
        else:
            overall_status = "healthy"

        total_response_time = time.time() - total_start_time

        return {
            "status": overall_status,
            "total_response_time": total_response_time,
            "timestamp": datetime.utcnow().isoformat(),
            "dependencies": list(results.values())
        }


# Global health checker
health_checker = HealthChecker()


def add_health_check(name: str, check_func: Callable):
    """Add a health check to the global checker"""
    health_checker.add_check(name, check_func)


async def run_health_checks() -> Dict[str, Any]:
    """Run all health checks"""
    return await health_checker.run_all_checks()


# Common health check functions
async def check_database() -> Dict[str, Any]:
    """Check database connectivity"""
    try:
        # Import here to avoid circular imports
        from app.core.database import get_db
        from sqlalchemy import text

        # Try to get a database connection
        db = next(get_db())
        # Simple query to test connection
        db.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


async def check_qdrant() -> Dict[str, Any]:
    """Check QDrant connectivity"""
    try:
        # Import here to avoid circular imports
        from ...search import QDrantService

        service = QDrantService()
        # Test connection
        connection_result = await service.test_connection()
        if connection_result["connected"]:
            return {"status": "healthy", "details": {"collections_count": connection_result["collections_count"]}}
        else:
            return {"status": "unhealthy", "error": connection_result.get("error", "Connection failed")}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


async def check_embedding_service() -> Dict[str, Any]:
    """Check embedding service"""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8080/health", timeout=5.0)
            if response.status_code == 200:
                return {"status": "healthy"}
            else:
                return {"status": "unhealthy", "error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


def check_cache() -> Dict[str, Any]:
    """Check cache service"""
    try:
        # Import here to avoid circular imports
        from ...shared import CacheService

        cache = CacheService()
        # Simple cache operation
        set_result = cache.set("health_check", "ok", ttl=10)
        if not set_result:
            return {"status": "unhealthy", "error": "Cache set operation failed"}

        result = cache.get("health_check")
        if result == "ok":
            return {"status": "healthy"}
        else:
            return {"status": "unhealthy", "error": "Cache read/write failed"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# Initialize common health checks
add_health_check("database", check_database)
add_health_check("qdrant", check_qdrant)
add_health_check("embedding_service", check_embedding_service)
add_health_check("cache", check_cache)
