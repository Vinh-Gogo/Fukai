"""
Common Pydantic schemas for standardized API responses
"""
from typing import Any, Optional, List
from pydantic import BaseModel, Field


class APIResponse(BaseModel):
    """Standardized API response model"""
    success: bool
    message: str
    data: Optional[Any] = None
    timestamp: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standardized error response model"""
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Any] = None
    timestamp: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Standardized paginated response model"""
    success: bool
    message: str
    data: List[Any]
    total: int
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1)
    total_pages: int
    has_next: bool
    has_prev: bool
    timestamp: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    service: str
    version: Optional[str] = None
    uptime: Optional[str] = None
    timestamp: Optional[str] = None


class Token(BaseModel):
    """JWT token response model"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """JWT token data model"""
    user_id: Optional[str] = None
    email: Optional[str] = None
    exp: Optional[int] = None


def create_success_response(
    message: str,
    data: Any = None,
    include_timestamp: bool = True
) -> APIResponse:
    """Helper function to create standardized success responses"""
    import datetime
    return APIResponse(
        success=True,
        message=message,
        data=data,
        timestamp=datetime.datetime.now().isoformat() if include_timestamp else None
    )


def create_error_response(
    message: str,
    error_code: Optional[str] = None,
    details: Any = None,
    include_timestamp: bool = True
) -> ErrorResponse:
    """Helper function to create standardized error responses"""
    import datetime
    return ErrorResponse(
        success=False,
        message=message,
        error_code=error_code,
        details=details,
        timestamp=datetime.datetime.now().isoformat() if include_timestamp else None
    )


def create_paginated_response(
    data: List[Any],
    total: int,
    page: int = 1,
    page_size: int = 10,
    message: str = "Data retrieved successfully",
    include_timestamp: bool = True
) -> PaginatedResponse:
    """Helper function to create standardized paginated responses"""
    import datetime
    total_pages = (total + page_size - 1) // page_size  # Ceiling division

    return PaginatedResponse(
        success=True,
        message=message,
        data=data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
        timestamp=datetime.datetime.now().isoformat() if include_timestamp else None
    )
