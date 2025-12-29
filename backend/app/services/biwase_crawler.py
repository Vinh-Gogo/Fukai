"""
BiwaseCrawler service for crawling PDF documents from biwase.com.vn

This service provides functionality to scan for articles and download PDFs
from the Biwase news website with proper error handling and logging.
"""

import requests
from bs4 import BeautifulSoup
import time
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import structlog
import json
from datetime import datetime
from requests.utils import requote_uri
from urllib.parse import urlparse, urlunparse, quote

from app.config.settings import settings


@dataclass
class CrawlResult:
    """Result of a crawl operation."""
    success: bool
    pages_found: int
    articles_found: int
    pdfs_found: int
    pdf_urls: List[str]
    message: str
    error: Optional[str] = None


@dataclass
class DownloadResult:
    """Result of a download operation."""
    success: bool
    downloaded_count: int
    total_count: int
    files: List[Dict[str, Any]]
    message: str
    error: Optional[str] = None


class BiwaseCrawlerService:
    """
    Service for crawling PDF documents from biwase.com.vn

    This service provides methods to scan for articles and download PDFs
    with proper error handling, logging, and rate limiting.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        output_dir: Optional[str] = None,
        logger: Optional[structlog.BoundLogger] = None
    ):
        """
        Initialize the BiwaseCrawlerService.

        Args:
            base_url: The base URL to start crawling from. Defaults to settings.CRAWLER_BASE_URL.
            output_dir: The directory to save downloaded PDFs. Defaults to settings.UPLOAD_DIR.
            logger: Logger instance for structured logging.
        """
        self.base_url = base_url or settings.CRAWLER_BASE_URL
        self.output_dir = Path(output_dir or settings.UPLOAD_DIR) / "biwase_crawler"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.logger = logger or structlog.get_logger(__name__)

        # Configure session headers to mimic a browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def get_soup(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a URL with retries and return a BeautifulSoup object."""
        from requests.exceptions import RequestException
        import math
        try:
            self.logger.debug("Fetching URL", url=url)
            retries = int(getattr(settings, "CRAWLER_REQUEST_RETRIES", 3))
            backoff = float(getattr(settings, "CRAWLER_REQUEST_BACKOFF_FACTOR", 1.0))
            timeout = int(getattr(settings, "CRAWLER_REQUEST_TIMEOUT", 60))

            for attempt in range(1, retries + 1):
                try:
                    self.logger.debug("Fetching attempt", url=url, attempt=attempt, timeout=timeout)
                    response = self.session.get(url, timeout=timeout)
                    response.raise_for_status()
                    return BeautifulSoup(response.content.decode('utf-8', errors='ignore'), 'html.parser')
                except RequestException as re:
                    # Log attempt failure
                    self.logger.warning("Fetch attempt failed", url=url, attempt=attempt, error=str(re))
                    if attempt == retries:
                        raise
                    # exponential backoff sleep
                    sleep_time = backoff * (2 ** (attempt - 1))
                    self.logger.debug("Sleeping before retry", seconds=sleep_time)
                    time.sleep(sleep_time)

        except Exception as e:
            # Capture full traceback for diagnostics
            import traceback
            tb = traceback.format_exc()
            self.logger.exception("Error fetching URL", url=url, error=str(e), traceback=tb)
            return None

    def get_pagination_links(self) -> List[str]:
        """Retrieve pagination links from the base URL."""
        self.logger.info("Starting crawl from base URL", base_url=self.base_url)
        soup = self.get_soup(self.base_url)
        if not soup:
            return []

        pages = []
        for pager in soup.find_all('a', class_='ModulePager'):
            href = pager.get('href')
            if href:
                pages.append(href)

        self.logger.info("Found pagination pages", count=len(pages))
        return pages

    def get_news_links(self, page_url: str) -> List[str]:
        """Retrieve news article links from a pagination page."""
        self.logger.debug("Processing page", page_url=page_url)
        soup = self.get_soup(page_url)
        if not soup:
            return []

        news_links = []
        for a in soup.find_all('a', class_='img-scale'):
            href = a.get('href')
            if href:
                news_links.append(href)

        self.logger.debug("Found news links on page", count=len(news_links), page_url=page_url)
        return news_links

    def get_pdf_links(self, news_url: str) -> List[str]:
        """Retrieve PDF links from a news article."""
        self.logger.debug("Processing news article", news_url=news_url)
        soup = self.get_soup(news_url)
        if not soup:
            return []

        pdf_links = []
        for iframe in soup.find_all('iframe'):
            iframe_src = iframe.get('src')
            if iframe_src:
                # Ensure full URL
                if iframe_src.startswith('/'):
                    src = f"https://biwase.com.vn{iframe_src}"
                else:
                    src = iframe_src
                pdf_links.append(src)

        self.logger.debug("Found PDF links in article", count=len(pdf_links), news_url=news_url)
        return pdf_links

    def download_pdf(self, pdf_url: str) -> Dict[str, Any]:
        """Download a PDF file. Returns file info on success or an error entry on failure."""
        try:
            self.logger.debug("Downloading PDF", pdf_url=pdf_url)

            # Remember original URL for diagnostics and filenames
            original_pdf_url = pdf_url

            # Ensure URL is properly quoted to handle spaces and unsafe characters.
            # If scheme is missing, prepend https:// so parsing yields netloc correctly.
            try:
                if not pdf_url.startswith(("http://", "https://")):
                    pdf_url_to_parse = "https://" + pdf_url.lstrip("/")
                else:
                    pdf_url_to_parse = pdf_url

                parsed = urlparse(pdf_url_to_parse)

                # Quote the path component to preserve slashes and encode spaces
                quoted_path = quote(parsed.path)
                safe_url = urlunparse(parsed._replace(path=quoted_path))

                # Ensure '//' after the scheme (handle edge-cases)
                if safe_url.startswith("https:") and not safe_url.startswith("https://"):
                    safe_url = safe_url.replace("https:", "https://", 1)

                # Fallback to requote_uri to handle other unsafe characters
                safe_url = requote_uri(safe_url)
                # Ensure scheme has '//' after it (handle edge-cases where netloc is missing)
                if safe_url.startswith("https:") and not safe_url.startswith("https://"):
                    safe_url = safe_url.replace("https:", "https://", 1)
                if safe_url.startswith("http:") and not safe_url.startswith("http://"):
                    safe_url = safe_url.replace("http:", "http://", 1)

                # Basic validation
                parsed_safe = urlparse(safe_url)
                if not parsed_safe.scheme or not parsed_safe.netloc:
                    raise ValueError(f"Invalid URL after parsing: {safe_url}")

            except Exception:
                # Last-resort: try requote_uri and ensure https scheme
                prefixed = pdf_url if pdf_url.startswith(("http://", "https://")) else "https://" + pdf_url
                safe_url = requote_uri(prefixed)

            # Stream download to avoid large memory usage
            with self.session.get(safe_url, timeout=settings.CRAWLER_DOWNLOAD_TIMEOUT, stream=True) as response:
                response.raise_for_status()

                # Use a safe filename derived from the original filename but normalize spaces
                original_filename = pdf_url.split('/')[-1]
                # Replace problematic filesystem characters and normalize spaces
                filename = original_filename.replace(' ', '_')
                file_path = self.output_dir / filename

                with open(file_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)

                size = file_path.stat().st_size

            file_info = {
                "original_filename": original_filename,
                "filename": filename,
                "filepath": str(file_path),
                "original_url": pdf_url,
                "requested_url": safe_url,
                "size": size,
                "downloaded_at": time.time()
            }

            self.logger.info("PDF downloaded successfully", filename=filename, size=size)
            return file_info

        except Exception as e:
            # Capture full traceback for diagnostics
            import traceback
            tb = traceback.format_exc()
            # Log both original and attempted URL for easier diagnostics
            self.logger.exception("Error downloading PDF", original_url=pdf_url, attempted_url=locals().get('safe_url'), error=str(e), traceback=tb)
            return {
                "original_url": pdf_url,
                "attempted_url": locals().get('safe_url'),
                "requested_url": locals().get('safe_url'),
                "filename": pdf_url.split('/')[-1],
                "error": tb
            }

    def scan(self) -> CrawlResult:
        """
        Scan the Biwase website for articles and PDFs.

        This method discovers all articles and PDF links without downloading any files.
        """
        try:
            self.logger.info("Starting Biwase website scan")

            # Get pagination links
            pages = self.get_pagination_links()
            if not pages:
                return CrawlResult(
                    success=False,
                    pages_found=0,
                    articles_found=0,
                    pdfs_found=0,
                    pdf_urls=[],
                    message="No pagination pages found",
                    error="Failed to retrieve pagination links"
                )

            # Get all news article links
            all_news = []
            for page in pages:
                time.sleep(settings.CRAWLER_RATE_LIMIT_DELAY)  # Rate limiting
                all_news.extend(self.get_news_links(page))

            unique_news = list(set(all_news))
            self.logger.info("Found unique news articles", count=len(unique_news))

            # Get all PDF links
            all_pdfs = []
            for news_link in unique_news:
                time.sleep(settings.CRAWLER_RATE_LIMIT_DELAY)  # Rate limiting
                all_pdfs.extend(self.get_pdf_links(news_link))

            unique_pdfs = list(set(all_pdfs))
            pdfs_found = len(unique_pdfs)
            self.logger.info("Scan completed", pdfs_found=pdfs_found)

            return CrawlResult(
                success=True,
                pages_found=len(pages),
                articles_found=len(unique_news),
                pdfs_found=pdfs_found,
                pdf_urls=unique_pdfs,
                message=f"Successfully scanned {len(pages)} pages and found {len(unique_news)} articles with {pdfs_found} PDFs"
            )

        except Exception as e:
            # Capture full traceback for diagnostics
            import traceback
            tb = traceback.format_exc()
            self.logger.exception("Scan failed", error=str(e), traceback=tb)
            return CrawlResult(
                success=False,
                pages_found=0,
                articles_found=0,
                pdfs_found=0,
                pdf_urls=[],
                message="Scan operation failed",
                error=tb
            )

    def download(self, pdf_urls: Optional[List[str]] = None) -> DownloadResult:
        """
        Download PDF files from the discovered URLs.

        Args:
            pdf_urls: Optional list of PDF URLs to download. If None, downloads all discovered PDFs.
        """
        try:
            self.logger.info("Starting PDF download operation")

            if pdf_urls is None:
                # Scan first to get all PDF URLs
                scan_result = self.scan()
                if not scan_result.success:
                    return DownloadResult(
                        success=False,
                        downloaded_count=0,
                        total_count=0,
                        files=[],
                        message="Failed to scan for PDFs before download",
                        error=scan_result.error
                    )
                pdf_urls = scan_result.pdf_urls

            total_count = len(pdf_urls)
            downloaded_files = []

            self.logger.info("Starting PDF downloads", total_count=total_count)

            for i, pdf_url in enumerate(pdf_urls):
                self.logger.debug("Downloading PDF", index=i+1, total=total_count, url=pdf_url)

                file_result = self.download_pdf(pdf_url)
                # Append whatever the download function returned (success info or error info)
                if file_result:
                    downloaded_files.append(file_result)

                time.sleep(settings.CRAWLER_RATE_LIMIT_DELAY)  # Rate limiting

            downloaded_count = len(downloaded_files)
            self.logger.info("Download operation completed", downloaded=downloaded_count, total=total_count)

            return DownloadResult(
                success=True,
                downloaded_count=downloaded_count,
                total_count=total_count,
                files=downloaded_files,
                message=f"Successfully downloaded {downloaded_count} out of {total_count} PDFs"
            )

        except Exception as e:
            self.logger.error("Download operation failed", error=str(e))
            return DownloadResult(
                success=False,
                downloaded_count=0,
                total_count=0,
                files=[],
                message="Download operation failed",
                error=str(e)
            )

    def export_urls_to_json(self, pdf_urls: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Export PDF URLs to a JSON file in the data directory.

        Args:
            pdf_urls: Optional list of PDF URLs to export. If None, scans first to get all URLs.

        Returns:
            Dictionary containing export result information.
        """
        try:
            self.logger.info("Starting URL export to JSON")

            if pdf_urls is None:
                # Scan first to get all PDF URLs
                scan_result = self.scan()
                if not scan_result.success:
                    return {
                        "success": False,
                        "message": "Failed to scan for PDFs before export",
                        "error": scan_result.error,
                        "file_path": None
                    }
                pdf_urls = scan_result.pdf_urls

            # Create data directory at project root (parent of backend directory)
            data_dir = Path(__file__).parent.parent.parent.parent / "data"
            data_dir.mkdir(parents=True, exist_ok=True)

            # Create JSON data structure
            export_data = {
                "scan_timestamp": datetime.now().isoformat(),
                "source_url": self.base_url,
                "total_urls": len(pdf_urls),
                "urls": pdf_urls
            }

            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"biwase_pdf_urls_{timestamp}.json"
            file_path = data_dir / filename

            # Write JSON file
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)

            self.logger.info("URLs exported to JSON successfully",
                           file_path=str(file_path),
                           total_urls=len(pdf_urls))

            return {
                "success": True,
                "message": f"Successfully exported {len(pdf_urls)} PDF URLs to JSON",
                "file_path": str(file_path),
                "total_urls": len(pdf_urls),
                "export_data": export_data
            }

        except Exception as e:
            self.logger.error("URL export to JSON failed", error=str(e))
            return {
                "success": False,
                "message": "Failed to export URLs to JSON",
                "error": str(e),
                "file_path": None
            }

    def get_downloaded_files(self) -> List[Dict[str, Any]]:
        """
        Get information about all downloaded PDF files.

        Returns:
            List of dictionaries containing file information.
        """
        try:
            files_info = []
            for file_path in self.output_dir.glob("*.pdf"):
                stat = file_path.stat()
                files_info.append({
                    "filename": file_path.name,
                    "filepath": str(file_path),
                    "size": stat.st_size,
                    "modified_at": stat.st_mtime,
                    "created_at": stat.st_ctime
                })

            self.logger.debug("Retrieved downloaded files info", count=len(files_info))
            return files_info

        except Exception as e:
            self.logger.error("Failed to get downloaded files", error=str(e))
            return []
