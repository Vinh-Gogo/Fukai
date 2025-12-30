"""
Data Transfer Objects (DTOs) for the RAG Server API.

DTOs provide:
- Data validation and type safety
- API contract definition
- Security through field control
- Documentation and examples
- Decoupling from internal models
"""

from pydantic import BaseModel, Field, HttpUrl, validator, model_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import re
from ...enums.activity import ActivityType, ActivityAction, EntityType

# Common field constraints
URL_REGEX = re.compile(
    r'^https?://'  # http:// or https://
    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
    r'localhost|'  # localhost...
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
    r'(?::\d+)?'  # optional port
    r'(?:/?|[/?]\S+)$', re.IGNORECASE  # path
)

# Base DTO classes
class BaseDTO(BaseModel):
    """Base class for all DTOs with common configuration."""
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        validate_assignment = True

class PaginationDTO(BaseDTO):
    """Pagination parameters for list endpoints."""
    page: int = Field(default=1, ge=1, description="Page number (1-based)")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")
    sort_by: Optional[str] = Field(default=None, description="Field to sort by")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")

class PaginatedResponseDTO(BaseDTO):
    """Paginated response wrapper."""
    items: List[Any] = Field(description="List of items")
    total: int = Field(description="Total number of items")
    page: int = Field(description="Current page number")
    limit: int = Field(description="Items per page")
    pages: int = Field(description="Total number of pages")
    has_next: bool = Field(description="Whether there is a next page")
    has_prev: bool = Field(description="Whether there is a previous page")

# WebURL DTOs
class WebURLCreateDTO(BaseDTO):
    """DTO for creating a new WebURL."""
    url: str = Field(
        ...,
        min_length=1,
        max_length=2048,
        description="The URL to crawl for PDFs",
        example="https://biwase.com.vn/tin-tuc/ban-tin-biwase"
    )
    list_page: Optional[List[str]] = Field(
        default_factory=list,
        description="List of page URLs found during crawling",
        example=["https://biwase.com.vn/tin-tuc/ban-tin-biwase/page/1"]
    )
    list_pdf_url: Optional[List[str]] = Field(
        default_factory=list,
        description="List of PDF URLs found on the pages",
        example=["https://biwase.com.vn/uploads/pdf/document1.pdf"]
    )

    @validator('url')
    def validate_url(cls, v):
        """Validate URL format."""
        if not URL_REGEX.match(v):
            raise ValueError('Invalid URL format')
        return v

    @validator('list_page', 'list_pdf_url', each_item=True)
    def validate_list_urls(cls, v):
        """Validate URLs in lists."""
        if v and not URL_REGEX.match(v):
            raise ValueError('Invalid URL format in list')
        return v

    @model_validator(mode='after')
    def validate_lists(self):
        """Ensure list_page and list_pdf_url are consistent."""
        if self.list_page and not isinstance(self.list_page, list):
            raise ValueError('list_page must be a list')
        if self.list_pdf_url and not isinstance(self.list_pdf_url, list):
            raise ValueError('list_pdf_url must be a list')

        return self

class WebURLResponseDTO(BaseDTO):
    """DTO for WebURL responses."""
    id: int = Field(description="Unique identifier for the WebURL")
    url: str = Field(description="The crawled URL")
    list_page: List[str] = Field(description="List of page URLs found")
    list_pdf_url: List[str] = Field(description="List of PDF URLs found")
    count_list_pdf_url: int = Field(description="Number of PDF URLs found")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 1,
                "url": "https://biwase.com.vn/tin-tuc/ban-tin-biwase",
                "list_page": ["https://biwase.com.vn/tin-tuc/ban-tin-biwase/page/1"],
                "list_pdf_url": ["https://biwase.com.vn/uploads/pdf/document1.pdf"],
                "count_list_pdf_url": 1
            }
        }
    }

class WebURLListResponseDTO(PaginatedResponseDTO):
    """DTO for paginated WebURL list responses."""
    items: List[WebURLResponseDTO] = Field(description="List of WebURLs")

# PDF DTOs
class PDFCreateDTO(BaseDTO):
    """DTO for creating a new PDF."""
    pdf_url: str = Field(
        ...,
        min_length=1,
        max_length=2048,
        description="URL of the PDF file",
        example="https://biwase.com.vn/uploads/pdf/document.pdf"
    )
    web_url_id: Optional[int] = Field(
        None,
        ge=1,
        description="ID of the associated WebURL (optional)",
        example=1
    )

    @validator('pdf_url')
    def validate_pdf_url(cls, v):
        """Validate PDF URL format."""
        if not URL_REGEX.match(v):
            raise ValueError('Invalid PDF URL format')
        # Check if it's likely a PDF URL
        if not v.lower().endswith('.pdf'):
            raise ValueError('URL must point to a PDF file (.pdf extension)')
        return v

class PDFResponseDTO(BaseDTO):
    """DTO for PDF responses."""
    id: int = Field(description="Unique identifier for the PDF")
    pdf_url: str = Field(description="URL of the PDF file")
    web_url_id: Optional[int] = Field(description="ID of the associated WebURL")
    time_crawl: datetime = Field(description="When the PDF was crawled")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 1,
                "pdf_url": "https://biwase.com.vn/uploads/pdf/document.pdf",
                "web_url_id": 1,
                "time_crawl": "2025-12-30T11:15:00Z"
            }
        }
    }

class PDFListResponseDTO(PaginatedResponseDTO):
    """DTO for paginated PDF list responses."""
    items: List[PDFResponseDTO] = Field(description="List of PDFs")

# Crawler DTOs
class CrawlerScanRequestDTO(BaseDTO):
    """DTO for crawler scan requests."""
    base_url: str = Field(
        ...,
        min_length=1,
        max_length=2048,
        description="Base URL to start crawling from",
        example="https://biwase.com.vn/tin-tuc/ban-tin-biwase"
    )

    @validator('base_url')
    def validate_base_url(cls, v):
        """Validate base URL format."""
        if not URL_REGEX.match(v):
            raise ValueError('Invalid base URL format')
        return v

class CrawlerDownloadRequestDTO(BaseDTO):
    """DTO for crawler download requests."""
    pdf_urls: List[str] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of PDF URLs to download (max 100)",
        example=["https://biwase.com.vn/uploads/pdf/doc1.pdf"]
    )
    output_dir: Optional[str] = Field(
        default="src/store/pdfs",
        description="Directory to save downloaded PDFs",
        example="src/store/pdfs"
    )

    @validator('pdf_urls', each_item=True)
    def validate_pdf_urls(cls, v):
        """Validate PDF URLs."""
        # Allow URLs with spaces and special characters since they come from the crawler
        if not isinstance(v, str) or not v.strip():
            raise ValueError('PDF URL must be a non-empty string')
        # Just check it looks like a URL
        if not (v.startswith('http://') or v.startswith('https://')):
            raise ValueError('PDF URL must start with http:// or https://')
        return v
        if not v.lower().endswith('.pdf'):
            raise ValueError('URL must point to a PDF file (.pdf extension)')
        return v

    @validator('output_dir')
    def validate_output_dir(cls, v):
        """Validate output directory path."""
        if '..' in v:
            raise ValueError('Output directory path cannot contain ..')
        return v

class CrawlerStatusRequestDTO(BaseDTO):
    """DTO for crawler status requests."""
    output_dir: Optional[str] = Field(
        default="src/store/pdfs",
        description="Directory to check for downloaded files",
        example="src/store/pdfs"
    )

class CrawlerResponseDTO(BaseDTO):
    """DTO for crawler operation responses."""
    success: bool = Field(description="Whether the operation was successful")
    message: str = Field(description="Human-readable status message")
    pages_found: Optional[int] = Field(None, description="Number of pages found (scan only)")
    articles_found: Optional[int] = Field(None, description="Number of articles found (scan only)")
    pdfs_found: Optional[int] = Field(None, description="Number of PDFs found")
    pdf_urls: Optional[List[str]] = Field(None, description="List of PDF URLs found")
    downloaded_count: Optional[int] = Field(None, description="Number of PDFs downloaded")
    skipped_count: Optional[int] = Field(None, description="Number of PDFs skipped")
    files: Optional[List[Dict[str, Any]]] = Field(None, description="Details of downloaded files")
    downloaded_files_count: Optional[int] = Field(None, description="Total number of downloaded files")
    total_size: Optional[int] = Field(None, description="Total size of downloaded files in bytes")
    output_dir: Optional[str] = Field(None, description="Output directory used")

class FileInfoDTO(BaseDTO):
    """DTO for file information."""
    filename: str = Field(description="Name of the file")
    size: int = Field(description="Size of the file in bytes")
    path: str = Field(description="Full path to the file")

class CrawlerStatusResponseDTO(BaseDTO):
    """DTO for crawler status responses."""
    downloaded_files_count: int = Field(description="Number of downloaded files")
    total_size: int = Field(description="Total size in bytes")
    files: List[FileInfoDTO] = Field(description="List of downloaded files")
    output_dir: str = Field(description="Output directory")

# Activities DTOs
class ActivityFilterDTO(BaseDTO):
    """DTO for activity filtering."""
    activity_type: Optional[ActivityType] = Field(None, description="Filter by activity type")
    entity_type: Optional[EntityType] = Field(None, description="Filter by entity type")
    entity_id: Optional[int] = Field(None, ge=1, description="Filter by entity ID")
    action: Optional[ActivityAction] = Field(None, description="Filter by action")
    user_id: Optional[str] = Field(None, description="Filter by user ID")
    date_from: Optional[datetime] = Field(None, description="Filter activities from this date")
    date_to: Optional[datetime] = Field(None, description="Filter activities to this date")

class ActivityResponseDTO(BaseDTO):
    """DTO for activity responses."""
    id: int = Field(description="Unique identifier for the activity")
    activity_type: str = Field(description="Type of activity performed")
    entity_type: str = Field(description="Type of entity affected")
    entity_id: Optional[int] = Field(description="ID of the affected entity")
    action: str = Field(description="Action performed")
    timestamp: datetime = Field(description="When the activity occurred")
    user_id: Optional[str] = Field(description="ID of the user who performed the action")
    details: Dict[str, Any] = Field(description="Additional activity details")
    ip_address: Optional[str] = Field(description="IP address of the client")
    user_agent: Optional[str] = Field(description="User agent of the client")

class ActivityListResponseDTO(PaginatedResponseDTO):
    """DTO for paginated activity list responses."""
    items: List[ActivityResponseDTO] = Field(description="List of activities")

class ActivityStatsDTO(BaseDTO):
    """DTO for activity statistics."""
    total_activities: int = Field(description="Total number of activities")
    activities_by_type: Dict[str, int] = Field(description="Activities grouped by type")
    activities_by_action: Dict[str, int] = Field(description="Activities grouped by action")
    activities_by_entity: Dict[str, int] = Field(description="Activities grouped by entity type")
    recent_activities: List[ActivityResponseDTO] = Field(description="Most recent activities")
    period_days: int = Field(description="Number of days in the statistics period")

# Health DTOs
class HealthResponseDTO(BaseDTO):
    """DTO for health check responses."""
    status: str = Field(description="Health status")
    timestamp: datetime = Field(description="Current timestamp")
    version: str = Field(description="API version")
    uptime_seconds: Optional[float] = Field(None, description="Server uptime in seconds")

# Error DTOs
class ErrorResponseDTO(BaseDTO):
    """DTO for error responses."""
    error: str = Field(description="Error type or category")
    message: str = Field(description="Human-readable error message")
    status_code: int = Field(description="HTTP status code")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="When the error occurred")

class ValidationErrorDTO(BaseDTO):
    """DTO for validation errors."""
    field: str = Field(description="Field that failed validation")
    message: str = Field(description="Validation error message")
    value: Optional[Any] = Field(None, description="Invalid value provided")

class ValidationErrorResponseDTO(ErrorResponseDTO):
    """DTO for validation error responses."""
    errors: List[ValidationErrorDTO] = Field(description="List of validation errors")

# Authentication DTOs
class LoginRequestDTO(BaseDTO):
    """DTO for login requests."""
    username: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Username for authentication",
        example="admin"
    )
    password: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Password for authentication",
        example="password123"
    )

class LoginResponseDTO(BaseDTO):
    """DTO for login responses."""
    access_token: str = Field(description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(description="Token expiration time in seconds")
    user: Dict[str, Any] = Field(description="User information")

class TokenVerifyResponseDTO(BaseDTO):
    """DTO for token verification responses."""
    valid: bool = Field(description="Whether the token is valid")
    user: Optional[Dict[str, Any]] = Field(None, description="User information if token is valid")
    expires_at: Optional[datetime] = Field(None, description="Token expiration time")

class LogoutResponseDTO(BaseDTO):
    """DTO for logout responses."""
    success: bool = Field(description="Logout success status")
    message: str = Field(description="Logout message")

# Common response DTOs
class SuccessResponseDTO(BaseDTO):
    """DTO for successful operation responses."""
    success: bool = Field(default=True, description="Operation success status")
    message: str = Field(description="Success message")
    data: Optional[Any] = Field(None, description="Response data")

class EmptyResponseDTO(BaseDTO):
    """DTO for empty responses (204 No Content)."""
    pass
