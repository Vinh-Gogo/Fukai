"""
Pydantic schemas for file management API endpoints
"""
from pydantic import BaseModel


class FileInfo(BaseModel):
    """File information model"""
    filename: str
    size: int
    path: str
    url: str


class UploadResponse(BaseModel):
    """Upload response model"""
    success: bool
    filename: str
    size: int
    message: str
