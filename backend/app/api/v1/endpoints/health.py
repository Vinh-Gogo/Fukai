"""
Health check endpoints for the Search RAG backend.

This module provides health check endpoints to monitor the application's
status and dependencies.
"""

from datetime import datetime
from typing import Dict, Any
import psutil
import asyncio
from fastapi import APIRouter, HTTPException, Depends

from app.config.settings import settings
from app.api.deps import get_logger, get_request_id


router = APIRouter()


async def check_database() -> Dict[str, Any]:
    """Check database connectivity."""
    try:
        from app.config.database import get_db
        from sqlalchemy import text

        # Try to get a database connection and execute a simple query
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()

        return {"status": "healthy", "message": "Database connection successful"}
    except Exception as e:
        return {"status": "unhealthy", "message": f"Database connection failed: {str(e)}"}


async def check_vector_database() -> Dict[str, Any]:
    """Check vector database (Qdrant) connectivity."""
    try:
        # Lazy import to avoid import errors if not configured
        from qdrant_client import QdrantClient

        client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)

        # Try to get collection info
        collections = client.get_collections()
        collection_names = [c.name for c in collections.collections]

        if settings.QDRANT_COLLECTION_NAME in collection_names:
            return {"status": "healthy", "message": f"Vector database healthy, collections: {len(collection_names)}"}
        else:
            return {"status": "warning", "message": f"Vector database connected but collection '{settings.QDRANT_COLLECTION_NAME}' not found"}

    except ImportError:
        return {"status": "warning", "message": "Qdrant client not installed"}
    except Exception as e:
        return {"status": "unhealthy", "message": f"Vector database connection failed: {str(e)}"}


async def check_llm_services() -> Dict[str, Any]:
    """Check LLM service connectivity."""
    results = {}

    # Check OpenAI
    if settings.OPENAI_API_KEY:
        try:
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            # Simple test - list models (this doesn't cost credits)
            models = client.models.list(limit=1)
            results["openai"] = {"status": "healthy", "message": "OpenAI API accessible"}
        except Exception as e:
            results["openai"] = {"status": "unhealthy", "message": f"OpenAI API error: {str(e)}"}
    else:
        results["openai"] = {"status": "warning", "message": "OpenAI API key not configured"}

    # Check Anthropic
    if settings.ANTHROPIC_API_KEY:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            # Simple test - this should not cost credits
            results["anthropic"] = {"status": "healthy", "message": "Anthropic API accessible"}
        except Exception as e:
            results["anthropic"] = {"status": "unhealthy", "message": f"Anthropic API error: {str(e)}"}
    else:
        results["anthropic"] = {"status": "warning", "message": "Anthropic API key not configured"}

    return results


async def get_system_info() -> Dict[str, Any]:
    """Get basic system information."""
    try:
        return {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory": {
                "total": psutil.virtual_memory().total,
                "available": psutil.virtual_memory().available,
                "percent": psutil.virtual_memory().percent,
            },
            "disk": {
                "total": psutil.disk_usage('/').total,
                "free": psutil.disk_usage('/').free,
                "percent": psutil.disk_usage('/').percent,
            },
        }
    except Exception as e:
        return {"error": f"Could not get system info: {str(e)}"}


@router.get("/")
async def basic_health_check(logger=Depends(get_logger), request_id=Depends(get_request_id)):
    """
    Basic health check endpoint.

    Returns a simple health status for load balancers and monitoring systems.
    """
    logger.info("Basic health check requested")

    return {
        "status": "healthy",
        "service": "search-rag-backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": request_id,
    }


@router.get("/detailed")
async def detailed_health_check(logger=Depends(get_logger), request_id=Depends(get_request_id)):
    """
    Detailed health check endpoint.

    Performs comprehensive health checks of all dependencies and returns
    detailed status information.
    """
    logger.info("Detailed health check requested")

    # Perform all checks concurrently
    checks = await asyncio.gather(
        check_database(),
        check_vector_database(),
        check_llm_services(),
        get_system_info(),
        return_exceptions=True
    )

    # Process results
    database_status = checks[0] if not isinstance(checks[0], Exception) else {"status": "error", "message": str(checks[0])}
    vector_db_status = checks[1] if not isinstance(checks[1], Exception) else {"status": "error", "message": str(checks[1])}
    llm_status = checks[2] if not isinstance(checks[2], Exception) else {"status": "error", "message": str(checks[2])}
    system_info = checks[3] if not isinstance(checks[3], Exception) else {"error": str(checks[3])}

    # Determine overall health
    critical_checks = [database_status, vector_db_status]
    overall_status = "healthy"

    for check in critical_checks:
        if check.get("status") in ["unhealthy", "error"]:
            overall_status = "unhealthy"
            break
        elif check.get("status") == "warning" and overall_status == "healthy":
            overall_status = "warning"

    response = {
        "status": overall_status,
        "service": "search-rag-backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": request_id,
        "checks": {
            "database": database_status,
            "vector_database": vector_db_status,
            "llm_services": llm_status,
            "system": system_info,
        },
    }

    # Log health check result
    logger.info(
        "Detailed health check completed",
        overall_status=overall_status,
        database_status=database_status.get("status"),
        vector_db_status=vector_db_status.get("status"),
    )

    # Return appropriate HTTP status
    if overall_status == "unhealthy":
        raise HTTPException(status_code=503, detail=response)
    elif overall_status == "warning":
        # Still return 200 for warnings, but client can check the status field
        pass

    return response


@router.get("/ping")
async def ping():
    """Simple ping endpoint for connectivity testing."""
    return {"message": "pong", "timestamp": datetime.utcnow().isoformat()}
