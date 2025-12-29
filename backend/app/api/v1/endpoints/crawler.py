"""
Crawler endpoints for the Search RAG backend.

This module provides API endpoints for crawling PDF documents from biwase.com.vn.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import structlog
import asyncio
import json

from app.api.deps import get_logger
from app.services.biwase_crawler import BiwaseCrawlerService
from app.models.crawler import (
    CrawlScanResponse,
    CrawlDownloadRequest,
    CrawlDownloadResponse,
    CrawlStatusResponse,
)


router = APIRouter()


def get_crawler_service(logger: structlog.BoundLogger = Depends(get_logger)) -> BiwaseCrawlerService:
    """Dependency to get a BiwaseCrawlerService instance."""
    try:
        return BiwaseCrawlerService(logger=logger)
    except Exception as e:
        logger.exception("Failed to initialize BiwaseCrawlerService", error=str(e))
        # Raise an HTTPException so FastAPI surfaces a clear error to the client
        raise HTTPException(status_code=500, detail=f"Failed to initialize crawler service: {str(e)}")


@router.get("/scan", response_model=CrawlScanResponse, summary="Scan for PDF documents")
async def scan_for_pdfs(
    crawler: BiwaseCrawlerService = Depends(get_crawler_service),
    logger=Depends(get_logger),
):
    """
    Scan the Biwase website for articles and PDF documents.

    This endpoint discovers all available articles and PDF files without downloading them.
    Use this to get an overview of available content before initiating downloads.

    Returns:
        - Number of pages found
        - Number of articles discovered
        - Number of PDF files available
        - List of PDF URLs
    """
    logger.info("Crawler scan requested")

    try:
        result = crawler.scan()

        if not result.success:
            # Provide more detail when scan returns a failure result
            raise HTTPException(
                status_code=500,
                detail=f"Scan failed: {result.error or result.message or 'Unknown scan error'}"
            )

        # Convert dataclass to Pydantic model
        response = CrawlScanResponse(
            success=result.success,
            pages_found=result.pages_found,
            articles_found=result.articles_found,
            pdfs_found=result.pdfs_found,
            pdf_urls=result.pdf_urls,
            message=result.message,
            error=result.error,
        )

        logger.info(
            "Crawler scan completed",
            pages_found=result.pages_found,
            articles_found=result.articles_found,
            pdfs_found=result.pdfs_found
        )

        return response

    except HTTPException:
        # Re-raise HTTPExceptions so FastAPI handles them correctly
        raise
    except Exception as e:
        # Log full exception with stack trace to make debugging easier
        logger.exception("Crawler scan failed")
        # Include repr(e) to capture exception type when str(e) is empty
        raise HTTPException(status_code=500, detail=f"Scan operation failed: {repr(e)}")


@router.post("/download", response_model=CrawlDownloadResponse, summary="Download PDF documents")
async def download_pdfs(
    request: Optional[CrawlDownloadRequest] = None,
    crawler: BiwaseCrawlerService = Depends(get_crawler_service),
    logger=Depends(get_logger),
):
    """
    Download PDF documents from the Biwase website.

    This endpoint downloads PDF files to the local file system. If no specific URLs
    are provided, it will first scan for all available PDFs and then download them.

    Args:
        request: Optional request containing specific PDF URLs to download

    Returns:
        - Number of files downloaded successfully
        - Total number of files attempted
        - Details about each downloaded file
    """
    logger.info("Crawler download requested")

    try:
        pdf_urls = request.pdf_urls if request else None

        try:
            result = crawler.download(pdf_urls=pdf_urls)
        except Exception as e:
            logger.error("Crawler download raised exception", error=str(e))
            # Return a structured 200 response with success=False so the client can
            # inspect per-file errors and handle the failure gracefully.
            return CrawlDownloadResponse(
                success=False,
                downloaded_count=0,
                total_count=0,
                files=[],
                message="Download operation failed due to server error",
                error=str(e),
            )

        # Convert dataclass to Pydantic model and return it directly.
        # Return 200 even when `result.success` is False so the client
        # can inspect per-file errors and partial successes.
        response = CrawlDownloadResponse(
            success=result.success,
            downloaded_count=result.downloaded_count,
            total_count=result.total_count,
            files=result.files,
            message=result.message,
            error=result.error,
        )

        if not result.success:
            logger.error("Crawler download completed with errors", error=result.error)
        else:
            logger.info(
                "Crawler download completed",
                downloaded=result.downloaded_count,
                total=result.total_count
            )

        return response

    except Exception as e:
        logger.error("Crawler download failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Download operation failed: {str(e)}")


@router.get("/status", response_model=CrawlStatusResponse, summary="Get crawler status")
async def get_crawler_status(
    crawler: BiwaseCrawlerService = Depends(get_crawler_service),
    logger=Depends(get_logger),
):
    """
    Get the current status of the crawler and information about downloaded files.

    This endpoint provides information about:
    - Previously scanned content (if any)
    - Download history
    - Currently downloaded files
    """
    logger.info("Crawler status requested")

    try:
        downloaded_files = crawler.get_downloaded_files()

        # Note: In a production system, you might want to store scan/download
        # results in a database to provide last_scan and last_download info.
        # For now, we'll just return the downloaded files information.

        response = CrawlStatusResponse(
            last_scan=None,  # Would be populated from database in production
            last_download=None,  # Would be populated from database in production
            downloaded_files_count=len(downloaded_files),
            downloaded_files=downloaded_files,
        )

        logger.info("Crawler status retrieved", files_count=len(downloaded_files))

        return response

    except Exception as e:
        logger.error("Failed to get crawler status", error=str(e))
        raise HTTPException(status_code=500, detail=f"Status retrieval failed: {str(e)}")


@router.post("/export-urls", summary="Export PDF URLs to JSON file")
async def export_pdf_urls(
    crawler: BiwaseCrawlerService = Depends(get_crawler_service),
    logger=Depends(get_logger),
):
    """
    Export all discovered PDF URLs to a JSON file in the data directory.

    This endpoint scans for PDF URLs and saves them to a timestamped JSON file
    in the project's data/ directory. The JSON file contains metadata about
    the scan and all discovered PDF URLs.

    Returns:
        - Success status
        - File path where URLs were saved
        - Number of URLs exported
        - Export metadata
    """
    logger.info("PDF URL export requested")

    try:
        result = crawler.export_urls_to_json()

        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"URL export failed: {result.get('error', 'Unknown error')}"
            )

        logger.info(
            "PDF URLs exported successfully",
            file_path=result["file_path"],
            total_urls=result["total_urls"]
        )

        return result

    except Exception as e:
        logger.error("PDF URL export failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"URL export operation failed: {str(e)}")


@router.get("/downloads", summary="List downloaded PDF files")
async def list_downloaded_files(
    crawler: BiwaseCrawlerService = Depends(get_crawler_service),
    logger=Depends(get_logger),
):
    """
    Get a list of all downloaded PDF files with their metadata.

    Returns detailed information about each downloaded PDF file including
    filename, file path, size, and timestamps.
    """
    logger.info("Downloaded files list requested")

    try:
        files = crawler.get_downloaded_files()

        logger.info("Downloaded files list retrieved", count=len(files))

        return {
            "files": files,
            "total": len(files),
            "message": f"Found {len(files)} downloaded PDF files"
        }

    except Exception as e:
        logger.error("Failed to list downloaded files", error=str(e))
        raise HTTPException(status_code=500, detail=f"File listing failed: {str(e)}")


@router.get("/progress-stream", summary="Stream real-time crawl progress")
async def stream_crawl_progress(
    crawler: BiwaseCrawlerService = Depends(get_crawler_service),
    logger=Depends(get_logger),
):
    """
    Server-Sent Events endpoint for real-time crawl progress updates.

    This endpoint provides a streaming connection that emits progress events
    during active crawl operations, including:
    - crawl_started: When crawling begins
    - progress_update: Progress percentage and current stage
    - urls_found: When new PDF URLs are discovered
    - crawl_completed: When crawling finishes successfully
    - crawl_error: When crawling fails

    Returns:
        Server-Sent Events stream with crawl progress data
    """

    async def generate_progress_events():
        """Generator function that yields SSE-formatted progress events."""

        # Send initial connection event
        yield f"event: connected\ndata: {json.dumps({'message': 'Connected to crawl progress stream'})}\n\n"

        try:
            # For now, we'll send a mock progress stream
            # In a full implementation, this would be integrated with the actual crawl process
            import time

            # Simulate crawl progress
            progress_steps = [
                {"event": "crawl_started", "data": {"timestamp": time.time(), "message": "Crawl operation started"}},
                {"event": "progress_update", "data": {"progress": 10, "stage": "scanning", "message": "Scanning pages..."}},
                {"event": "urls_found", "data": {"urls": ["https://example.com/pdf1.pdf", "https://example.com/pdf2.pdf"], "count": 2, "total_found": 2}},
                {"event": "progress_update", "data": {"progress": 50, "stage": "processing", "message": "Processing articles..."}},
                {"event": "urls_found", "data": {"urls": ["https://example.com/pdf3.pdf"], "count": 1, "total_found": 3}},
                {"event": "progress_update", "data": {"progress": 100, "stage": "completed", "message": "Crawl completed"}},
                {"event": "crawl_completed", "data": {"total_urls": 3, "pages_found": 5, "articles_found": 15}},
            ]

            for step in progress_steps:
                yield f"event: {step['event']}\ndata: {json.dumps(step['data'])}\n\n"
                await asyncio.sleep(2)  # Simulate time between events

        except Exception as e:
            logger.error("Error in progress stream", error=str(e))
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate_progress_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
        }
    )
