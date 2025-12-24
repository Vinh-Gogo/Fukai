"""
Custom exception handlers and error responses for the Search RAG backend.

This module provides structured error handling and consistent error responses
across the API.
"""

from typing import Any, Dict, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import structlog


logger = structlog.get_logger(__name__)


class APIError(BaseModel):
    """Standard API error response model."""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None


class SearchRAGException(Exception):
    """Base exception class for Search RAG application."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(SearchRAGException):
    """Exception raised for validation errors."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, details=details)


class NotFoundError(SearchRAGException):
    """Exception raised when a resource is not found."""
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=404, details=details)


class AuthenticationError(SearchRAGException):
    """Exception raised for authentication failures."""
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, details=details)


class AuthorizationError(SearchRAGException):
    """Exception raised for authorization failures."""
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, details=details)


class ConflictError(SearchRAGException):
    """Exception raised for resource conflicts."""
    def __init__(self, message: str = "Resource conflict", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=409, details=details)


class ExternalServiceError(SearchRAGException):
    """Exception raised when external services fail."""
    def __init__(self, message: str = "External service error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=502, details=details)


async def search_rag_exception_handler(request: Request, exc: SearchRAGException) -> JSONResponse:
    """Handle custom SearchRAG exceptions."""
    # Log the error
    logger.error(
        "Application error",
        exc_type=type(exc).__name__,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        path=request.url.path,
        method=request.method,
    )

    # Return structured error response
    return JSONResponse(
        status_code=exc.status_code,
        content=APIError(
            error=type(exc).__name__,
            message=exc.message,
            details=exc.details,
            request_id=getattr(request.state, "request_id", None),
        ).dict(),
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions."""
    # Log the error
    logger.warning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path,
        method=request.method,
    )

    # Return structured error response
    return JSONResponse(
        status_code=exc.status_code,
        content=APIError(
            error="HTTPException",
            message=str(exc.detail),
            request_id=getattr(request.state, "request_id", None),
        ).dict(),
    )


async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle Pydantic validation exceptions."""
    # Log the error
    logger.warning(
        "Validation error",
        exc_type=type(exc).__name__,
        message=str(exc),
        path=request.url.path,
        method=request.method,
    )

    # Return structured error response
    return JSONResponse(
        status_code=422,
        content=APIError(
            error="ValidationError",
            message="Request validation failed",
            details={"validation_error": str(exc)},
            request_id=getattr(request.state, "request_id", None),
        ).dict(),
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    # Log the error with full traceback
    logger.error(
        "Unexpected error",
        exc_type=type(exc).__name__,
        message=str(exc),
        path=request.url.path,
        method=request.method,
        exc_info=True,
    )

    # Return generic error response (don't expose internal details)
    return JSONResponse(
        status_code=500,
        content=APIError(
            error="InternalServerError",
            message="An unexpected error occurred",
            request_id=getattr(request.state, "request_id", None),
        ).dict(),
    )


def setup_exception_handlers(app: FastAPI) -> None:
    """Setup custom exception handlers for the FastAPI application."""

    # Custom SearchRAG exceptions
    app.add_exception_handler(SearchRAGException, search_rag_exception_handler)

    # FastAPI built-in exceptions
    app.add_exception_handler(HTTPException, http_exception_handler)

    # Validation exceptions (from pydantic, etc.)
    from pydantic import ValidationError as PydanticValidationError
    app.add_exception_handler(PydanticValidationError, validation_exception_handler)

    # Catch-all for unexpected exceptions
    app.add_exception_handler(Exception, general_exception_handler)
