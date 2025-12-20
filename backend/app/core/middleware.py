"""
Global middleware for error handling and request processing
"""
import logging
from typing import Callable
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.exceptions import RAGException

logger = logging.getLogger(__name__)


class ExceptionHandlerMiddleware(BaseHTTPMiddleware):
    """Global exception handler middleware"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except RAGException as e:
            # Handle custom RAG exceptions
            logger.error(f"RAG Exception: {e.error_code} - {e.message}", extra={
                "error_code": e.error_code,
                "details": e.details,
                "path": request.url.path,
                "method": request.method
            })

            return JSONResponse(
                status_code=e.status_code,
                content={
                    "success": False,
                    "message": e.message,
                    "error_code": e.error_code,
                    "details": e.details
                }
            )
        except HTTPException as e:
            # Handle FastAPI HTTP exceptions
            logger.error(f"HTTP Exception: {e.status_code} - {e.detail}", extra={
                "status_code": e.status_code,
                "detail": e.detail,
                "path": request.url.path,
                "method": request.method
            })

            return JSONResponse(
                status_code=e.status_code,
                content={
                    "success": False,
                    "message": e.detail,
                    "error_code": f"HTTP_{e.status_code}",
                    "details": {}
                }
            )
        except Exception as e:
            # Handle unexpected exceptions
            logger.error(f"Unexpected error: {str(e)}", exc_info=True, extra={
                "path": request.url.path,
                "method": request.method
            })

            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "An unexpected error occurred",
                    "error_code": "INTERNAL_SERVER_ERROR",
                    "details": {"error": str(e)} if logger.level <= logging.DEBUG else {}
                }
            )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Enhanced request logging middleware"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        import time
        start_time = time.time()

        # Log request
        logger.info("Request started", extra={
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent")
        })

        response = await call_next(request)

        # Calculate processing time
        process_time = time.time() - start_time

        # Log response
        logger.info("Request completed", extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time": round(process_time, 3)
        })

        return response
