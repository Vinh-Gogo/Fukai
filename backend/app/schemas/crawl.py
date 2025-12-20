"""
Pydantic schemas for crawl API endpoints
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class CrawlStartRequest(BaseModel):
    """Request model for starting a crawl"""
    crawl_type: str = Field("simple", description="Type of crawl: 'simple' or 'full_pipeline'")
    user_id: Optional[str] = Field(None, description="User ID for document ownership (required for full_pipeline)")


class CrawlStatusResponse(BaseModel):
    """Response model for crawl status"""
    task_id: str
    status: str
    progress: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: Optional[str] = None


class CrawlHistoryResponse(BaseModel):
    """Response model for crawl history"""
    crawls: list
    total: int
