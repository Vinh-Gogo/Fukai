"""
Crawler endpoints for the Search RAG backend.

This module provides API endpoints for crawling PDF documents from biwase.com.vn.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import structlog

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
    return BiwaseCrawlerService(logger=logger)


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
            raise HTTPException(
                status_code=500,
                detail=f"Scan failed: {result.error}"
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

    except Exception as e:
        logger.error("Crawler scan failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Scan operation failed: {str(e)}")


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

        result = crawler.download(pdf_urls=pdf_urls)

        if not result.success:
            raise HTTPException(
                status_code=500,
                detail=f"Download failed: {result.error}"
            )

        # Convert dataclass to Pydantic model
        response = CrawlDownloadResponse(
            success=result.success,
            downloaded_count=result.downloaded_count,
            total_count=result.total_count,
            files=result.files,
            message=result.message,
            error=result.error,
        )

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
