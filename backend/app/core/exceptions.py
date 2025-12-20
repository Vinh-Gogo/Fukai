"""
Custom exceptions and error handling for the RAG platform
"""
from typing import Any, Dict, Optional
from fastapi import HTTPException


class RAGException(Exception):
    """Base exception for RAG platform"""

    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class CrawlException(RAGException):
    """Exception raised for crawl-related errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CRAWL_ERROR",
            status_code=500,
            details=details
        )


class FileProcessingException(RAGException):
    """Exception raised for file processing errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="FILE_PROCESSING_ERROR",
            status_code=500,
            details=details
        )


class ValidationException(RAGException):
    """Exception raised for validation errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=400,
            details=details
        )


class ConfigurationException(RAGException):
    """Exception raised for configuration errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            status_code=500,
            details=details
        )


def create_http_exception(exception: RAGException) -> HTTPException:
    """Convert RAG exception to HTTP exception"""
    return HTTPException(
        status_code=exception.status_code,
        detail={
            "success": False,
            "message": exception.message,
            "error_code": exception.error_code,
            "details": exception.details
        }
    )
