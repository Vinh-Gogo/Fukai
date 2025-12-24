"""
Pydantic models for the BiwaseCrawler API.

This module defines the request and response models for the crawler endpoints.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class CrawlScanResponse(BaseModel):
    """Response model for the crawl scan operation."""
    success: bool = Field(..., description="Whether the scan operation was successful")
    pages_found: int = Field(..., description="Number of pagination pages found")
    articles_found: int = Field(..., description="Number of unique news articles found")
    pdfs_found: int = Field(..., description="Number of PDF files found")
    pdf_urls: List[str] = Field(default_factory=list, description="List of PDF URLs discovered")
    message: str = Field(..., description="Human-readable message about the operation")
    error: Optional[str] = Field(None, description="Error message if the operation failed")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the scan operation")


class CrawlDownloadRequest(BaseModel):
    """Request model for the crawl download operation."""
    pdf_urls: Optional[List[str]] = Field(
        None,
        description="Optional list of specific PDF URLs to download. If not provided, downloads all discovered PDFs."
    )


class PDFFileInfo(BaseModel):
    """Model for PDF file information."""
    filename: str = Field(..., description="Name of the downloaded PDF file")
    filepath: str = Field(..., description="Full path to the downloaded PDF file")
    url: str = Field(..., description="Original URL of the PDF")
    size: int = Field(..., description="File size in bytes")
    downloaded_at: float = Field(..., description="Unix timestamp when the file was downloaded")


class CrawlDownloadResponse(BaseModel):
    """Response model for the crawl download operation."""
    success: bool = Field(..., description="Whether the download operation was successful")
    downloaded_count: int = Field(..., description="Number of PDFs successfully downloaded")
    total_count: int = Field(..., description="Total number of PDFs that were attempted")
    files: List[PDFFileInfo] = Field(default_factory=list, description="Information about downloaded files")
    message: str = Field(..., description="Human-readable message about the operation")
    error: Optional[str] = Field(None, description="Error message if the operation failed")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the download operation")


class CrawlStatusResponse(BaseModel):
    """Response model for the crawl status endpoint."""
    last_scan: Optional[CrawlScanResponse] = Field(None, description="Result of the last scan operation")
    last_download: Optional[CrawlDownloadResponse] = Field(None, description="Result of the last download operation")
    downloaded_files_count: int = Field(..., description="Total number of downloaded PDF files")
    downloaded_files: List[Dict[str, Any]] = Field(default_factory=list, description="Information about all downloaded files")


class CrawlerConfig(BaseModel):
    """Configuration model for the crawler."""
    base_url: str = Field(
        default='https://biwase.com.vn/tin-tuc/ban-tin-biwase',
        description="Base URL to start crawling from"
    )
    output_dir: Optional[str] = Field(
        None,
        description="Directory to save downloaded PDFs. Defaults to configured upload directory."
    )
    rate_limit_delay: int = Field(
        default=1,
        description="Delay in seconds between requests to respect rate limits"
    )
