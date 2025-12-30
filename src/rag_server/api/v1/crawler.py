from fastapi import APIRouter, BackgroundTasks, Query, HTTPException
from typing import List, Dict, Any
from ...services.crawler_service import scan_crawler, download_pdfs, get_crawler_status
from ...tasks import download_pdfs_background, scan_crawler_background, batch_download_pdfs_background
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

@router.post("/download/background", summary="Download PDFs in Background", description="Queue PDF downloads as background task")
async def download_background(payload: CrawlerDownloadRequestDTO) -> Dict[str, Any]:
    """Download PDFs using Celery background task."""
    try:
        # Queue the background task
        task = download_pdfs_background.delay(
            payload.pdf_urls,
            payload.output_dir,
            getattr(payload, 'max_concurrent', 3)
        )

        return {
            "success": True,
            "task_id": task.id,
            "status": "queued",
            "message": f"Download task queued with ID: {task.id}",
            "total_urls": len(payload.pdf_urls)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue download task: {str(e)}")

@router.post("/download/batch", summary="Download PDFs in Batches", description="Queue PDF downloads in batches for large operations")
async def download_batch(
    payload: CrawlerDownloadRequestDTO,
    batch_size: int = Query(10, description="Number of PDFs per batch", ge=1, le=50)
) -> Dict[str, Any]:
    """Download PDFs in batches using background processing."""
    try:
        # Queue the batch download task
        task = batch_download_pdfs_background.delay(
            payload.pdf_urls,
            payload.output_dir,
            batch_size
        )

        return {
            "success": True,
            "task_id": task.id,
            "status": "queued",
            "message": f"Batch download task queued with ID: {task.id}",
            "total_urls": len(payload.pdf_urls),
            "batch_size": batch_size,
            "estimated_batches": (len(payload.pdf_urls) + batch_size - 1) // batch_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue batch download task: {str(e)}")

@router.post("/scan/background", summary="Scan for PDFs in Background", description="Queue PDF scanning as background task")
async def scan_background(base_url: str = Query(..., description="Base URL to start crawling from")) -> Dict[str, Any]:
    """Scan for PDFs using Celery background task."""
    try:
        # Queue the background scan task
        task = scan_crawler_background.delay(base_url)

        return {
            "success": True,
            "task_id": task.id,
            "status": "queued",
            "message": f"Scan task queued with ID: {task.id}",
            "base_url": base_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue scan task: {str(e)}")

@router.get("/task/{task_id}", summary="Get Task Status", description="Get status of a background task")
async def get_task_status(task_id: str) -> Dict[str, Any]:
    """Get the status of a Celery background task."""
    try:
        from ...core.celery_app import celery_app
        task_result = celery_app.AsyncResult(task_id)

        response = {
            "task_id": task_id,
            "status": task_result.status,
            "current": task_result.info if task_result.info else None
        }

        # Add additional metadata based on status
        if task_result.status == "PENDING":
            response["message"] = "Task is waiting to be processed"
        elif task_result.status == "PROGRESS":
            response["message"] = "Task is in progress"
            if isinstance(task_result.info, dict):
                response.update(task_result.info)
        elif task_result.status == "SUCCESS":
            response["message"] = "Task completed successfully"
            response["result"] = task_result.result
        elif task_result.status == "FAILURE":
            response["message"] = "Task failed"
            response["error"] = str(task_result.info)
        elif task_result.status == "RETRY":
            response["message"] = "Task is being retried"
        elif task_result.status == "REVOKED":
            response["message"] = "Task was cancelled"

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get task status: {str(e)}")

@router.delete("/task/{task_id}", summary="Cancel Task", description="Cancel a running background task")
async def cancel_task(task_id: str) -> Dict[str, Any]:
    """Cancel a Celery background task."""
    try:
        from ...core.celery_app import celery_app
        celery_app.control.revoke(task_id, terminate=True)

        return {
            "success": True,
            "task_id": task_id,
            "status": "cancelled",
            "message": f"Task {task_id} has been cancelled"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel task: {str(e)}")
