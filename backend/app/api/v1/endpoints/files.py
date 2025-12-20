"""
File management endpoints
"""
import os
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.core.config import settings


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


router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)) -> UploadResponse:
    """Upload a file"""
    try:
        # Validate filename
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename is required")

        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        # Ensure upload directory exists
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Save file
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        return UploadResponse(
            success=True,
            filename=file.filename,
            size=len(content),
            message=f"File {file.filename} uploaded successfully"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/list")
async def list_files() -> Dict[str, Any]:
    """List uploaded files"""
    try:
        upload_dir = Path(settings.UPLOAD_DIR)
        if not upload_dir.exists():
            return {"files": [], "total": 0}

        files = []
        for file_path in upload_dir.iterdir():
            if file_path.is_file():
                stat = file_path.stat()
                files.append({
                    "filename": file_path.name,
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                    "path": str(file_path),
                    "url": f"/api/v1/files/download/{file_path.name}"
                })

        return {
            "files": files,
            "total": len(files),
            "upload_dir": str(upload_dir)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@router.get("/download/{filename}")
async def download_file(filename: str):
    """Download a file"""
    try:
        file_path = Path(settings.UPLOAD_DIR) / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/pdf'
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.delete("/{filename}")
async def delete_file(filename: str) -> Dict[str, str]:
    """Delete a file"""
    try:
        file_path = Path(settings.UPLOAD_DIR) / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        file_path.unlink()

        return {"message": f"File {filename} deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

# Additional endpoints to match frontend expectations
@router.get("/existing")
async def get_existing_pdfs() -> Dict[str, List[str]]:
    """Get list of existing PDF files (frontend compatibility endpoint)"""
    try:
        upload_dir = Path(settings.UPLOAD_DIR)
        if not upload_dir.exists():
            return {"existing_files": []}

        existing_files = []
        for file_path in upload_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() == '.pdf':
                existing_files.append(file_path.name)

        return {"existing_files": existing_files}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get existing PDFs: {str(e)}")

@router.post("/download-pdfs")
async def download_pdfs(request: Dict[str, List[str]]) -> Dict[str, Any]:
    """Download multiple PDFs (frontend compatibility endpoint)"""
    try:
        pdf_urls = request.get("pdf_urls", [])
        if not pdf_urls:
            raise HTTPException(status_code=400, detail="pdf_urls is required")

        from app.services.crawler import BiwaseCrawler

        # Create crawler instance
        crawler = BiwaseCrawler(
            base_url=settings.BIWASE_BASE_URL,
            output_dir=settings.UPLOAD_DIR,
            max_retries=3,
            retry_delay=settings.CRAWL_DELAY,
            request_timeout=settings.CRAWL_TIMEOUT,
            rate_limit_delay=settings.CRAWL_DELAY
        )

        # Download PDFs
        downloaded_count = 0
        total_urls = len(pdf_urls)
        download_results = []

        for pdf_url in pdf_urls:
            try:
                result = crawler.download_pdf(pdf_url)
                download_results.append(result)
                if result["success"]:
                    downloaded_count += 1
                # Rate limiting
                import time
                time.sleep(settings.CRAWL_DELAY)
            except Exception as e:
                download_results.append({
                    "success": False,
                    "error": str(e),
                    "url": pdf_url
                })

        return {
            "success": True,
            "downloaded_count": downloaded_count,
            "total_urls": total_urls,
            "output_dir": str(settings.UPLOAD_DIR),
            "message": f"Downloaded {downloaded_count} of {total_urls} PDFs"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")
