from fastapi import APIRouter, BackgroundTasks, Query
from typing import List
from ...services.crawler_service import scan_crawler, download_pdfs, get_crawler_status
from .dtos import (
    CrawlerScanRequestDTO,
    CrawlerDownloadRequestDTO,
    CrawlerStatusRequestDTO,
    CrawlerResponseDTO,
    CrawlerStatusResponseDTO
)

router = APIRouter()

@router.get("/scan", response_model=CrawlerResponseDTO, summary="Scan for PDFs", description="Scan website for articles and PDFs without downloading")
async def scan(base_url: str = Query(..., description="Base URL to start crawling from", example="https://biwase.com.vn/tin-tuc/ban-tin-biwase")):
    """Scan for articles and PDFs without downloading."""
    return await scan_crawler(base_url)

@router.post("/download", response_model=CrawlerResponseDTO, summary="Download PDFs", description="Download specified PDFs to local storage")
async def download(payload: CrawlerDownloadRequestDTO, background_tasks: BackgroundTasks):
    """Download specified PDFs."""
    # For now, run synchronously. In production, might want to run in background
    return await download_pdfs(payload.pdf_urls, payload.output_dir)

@router.get("/status", response_model=CrawlerStatusResponseDTO, summary="Get Download Status", description="Get status of downloaded PDF files")
async def status(output_dir: str = Query("src/store/pdfs", description="Directory to check for downloaded files")):
    """Get the status of downloaded files."""
    return await get_crawler_status(output_dir)

@router.get("/downloads", response_model=CrawlerStatusResponseDTO, summary="Get Downloads", description="Alias for status endpoint - get downloaded PDF files")
async def downloads(output_dir: str = Query("src/store/pdfs", description="Directory to check for downloaded files")):
    """Alias for status endpoint."""
    return await get_crawler_status(output_dir)
