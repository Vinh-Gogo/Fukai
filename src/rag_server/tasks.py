from .core.celery_app import celery_app
from .services.crawler_service import download_pdfs
from .services.crawler_service import scan_crawler
from typing import List, Dict, Any
import asyncio

@celery_app.task(bind=True, max_retries=3)
def download_pdfs_background(self, pdf_urls: List[str], output_dir: str = "src/store/pdfs", max_concurrent: int = 3):
    """
    Background task to download PDFs concurrently.

    Args:
        pdf_urls: List of PDF URLs to download
        output_dir: Directory to save downloaded files
        max_concurrent: Maximum concurrent downloads

    Returns:
        Dict containing download results
    """
    try:
        # Run the async download function in a new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        result = loop.run_until_complete(
            download_pdfs(pdf_urls, output_dir, max_concurrent)
        )

        loop.close()
        return result

    except Exception as exc:
        # Retry with exponential backoff
        countdown = 60 * (2 ** self.request.retries)  # 1min, 2min, 4min
        raise self.retry(exc=exc, countdown=countdown)

@celery_app.task(bind=True, max_retries=2)
def scan_crawler_background(self, base_url: str = 'https://biwase.com.vn/tin-tuc/ban-tin-biwase'):
    """
    Background task to scan for PDFs without downloading.

    Args:
        base_url: Base URL to start crawling from

    Returns:
        Dict containing scan results
    """
    try:
        # Run the async scan function in a new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        result = loop.run_until_complete(scan_crawler(base_url))

        loop.close()
        return result

    except Exception as exc:
        # Retry with delay
        raise self.retry(exc=exc, countdown=30)

@celery_app.task(bind=True)
def batch_download_pdfs_background(self, pdf_urls: List[str], output_dir: str = "src/store/pdfs", batch_size: int = 10):
    """
    Background task to download PDFs in batches to avoid overwhelming the system.

    Args:
        pdf_urls: List of PDF URLs to download
        output_dir: Directory to save downloaded files
        batch_size: Number of PDFs to download per batch

    Returns:
        Dict containing aggregated results
    """
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # Process in batches
        all_results = []
        total_downloaded = 0
        total_skipped = 0
        total_failed = 0

        for i in range(0, len(pdf_urls), batch_size):
            batch = pdf_urls[i:i + batch_size]
            print(f"Processing batch {i//batch_size + 1}: {len(batch)} PDFs")

            batch_result = loop.run_until_complete(
                download_pdfs(batch, output_dir, max_concurrent=3)
            )

            all_results.append(batch_result)
            total_downloaded += batch_result.get('downloaded_count', 0)
            total_skipped += batch_result.get('skipped_count', 0)
            total_failed += batch_result.get('failed_count', 0)

            # Small delay between batches to be respectful
            import time
            time.sleep(1)

        loop.close()

        return {
            "success": True,
            "total_urls": len(pdf_urls),
            "total_downloaded": total_downloaded,
            "total_skipped": total_skipped,
            "total_failed": total_failed,
            "batch_results": all_results,
            "message": f"Batch download completed: {total_downloaded} downloaded, {total_skipped} skipped, {total_failed} failed"
        }

    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "total_urls": len(pdf_urls),
            "total_downloaded": 0,
            "total_skipped": 0,
            "total_failed": len(pdf_urls),
            "message": f"Batch download failed: {str(exc)}"
        }
