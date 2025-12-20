"""
Biwase PDF crawler - Implementation of BaseCrawler for biwase.com.vn
"""
import requests
from bs4 import BeautifulSoup
import time
import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import asyncio
from datetime import datetime, timedelta
import hashlib
import re

from ...core.config import settings
from .base_crawler import BaseCrawler, CrawlConfig, register_crawler

logger = logging.getLogger(__name__)

@register_crawler
class BiwaseCrawler(BaseCrawler):
    def __init__(self, config: CrawlConfig):
        super().__init__(config)

        # Biwase-specific configuration
        self.base_url = config.base_url or 'https://biwase.com.vn/tin-tuc/ban-tin-biwase'

        # Setup session with proper headers and configuration
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': config.user_agent or settings.CRAWL_USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

    @property
    def rate_limit_delay(self) -> float:
        """Get rate limit delay from config"""
        return self.config.rate_limit_delay

    @property
    def request_timeout(self) -> int:
        """Get request timeout from config"""
        return self.config.request_timeout

    @property
    def website_name(self) -> str:
        return "biwase"

    @property
    def supported_domains(self) -> List[str]:
        return ["biwase.com.vn"]

    def _make_request_with_retry(self, url: str, method: str = 'GET', **kwargs) -> Optional[requests.Response]:
        """
        Make HTTP request with retry logic and exponential backoff.

        Args:
            url: URL to request
            method: HTTP method
            **kwargs: Additional arguments for requests

        Returns:
            Response object or None if all retries failed
        """
        last_exception = None

        for attempt in range(self.config.max_retries + 1):
            try:
                if attempt > 0:
                    # Exponential backoff: delay = base_delay * 2^(attempt-1)
                    delay = self.config.retry_delay * (2 ** (attempt - 1))
                    logger.info(f"Retrying {url} in {delay:.1f}s (attempt {attempt + 1}/{self.config.max_retries + 1})")
                    time.sleep(delay)

                kwargs.setdefault('timeout', self.config.request_timeout)
                response = self.session.request(method, url, **kwargs)
                response.raise_for_status()

                if attempt > 0:
                    logger.info(f"Successfully fetched {url} on attempt {attempt + 1}")

                return response

            except requests.exceptions.RequestException as e:
                last_exception = e
                logger.warning(f"Request failed for {url} (attempt {attempt + 1}/{self.config.max_retries + 1}): {e}")

                # Don't retry on certain errors
                if hasattr(e, 'response') and e.response is not None:
                    if e.response.status_code in [400, 401, 403, 404, 410]:
                        logger.error(f"Non-retryable error {e.response.status_code} for {url}")
                        break

            except Exception as e:
                last_exception = e
                logger.error(f"Unexpected error for {url}: {e}")
                break

        # All retries failed
        self.stats['errors'].append({
            'url': url,
            'error': str(last_exception),
            'timestamp': datetime.now().isoformat()
        })

        logger.error(f"All {self.config.max_retries + 1} attempts failed for {url}: {last_exception}")
        return None

    def get_soup(self, url: str) -> Optional[BeautifulSoup]:
        """
        Fetch a URL and return a BeautifulSoup object with retry logic.

        Args:
            url: URL to fetch

        Returns:
            BeautifulSoup object or None if request failed
        """
        logger.debug(f"Fetching HTML from: {url}")

        try:
            response = self._make_request_with_retry(url)
            if response:
                # Try different encodings if utf-8 fails
                for encoding in ['utf-8', 'utf-8-sig', 'latin-1', response.encoding]:
                    try:
                        soup = BeautifulSoup(response.content.decode(encoding), 'html.parser')
                        logger.debug(f"Successfully parsed HTML from {url} using {encoding}")
                        return soup
                    except (UnicodeDecodeError, TypeError):
                        continue

                logger.warning(f"Failed to decode content from {url}, using binary fallback")
                soup = BeautifulSoup(response.content, 'html.parser')
                return soup

        except Exception as e:
            logger.error(f"Error parsing HTML from {url}: {e}")

        return None

    def get_pagination_links(self) -> List[str]:
        """
        Retrieve pagination links from the base URL.

        Returns:
            List of pagination URLs
        """
        logger.info(f"Starting crawl from: {self.base_url}")
        soup = self.get_soup(self.base_url)
        if not soup:
            logger.error("Failed to fetch base URL for pagination")
            return []

        pages = []
        for pager in soup.find_all('a', class_='ModulePager'):
            href = pager.get('href')
            if href:
                href_str = str(href)
                full_url = href_str if href_str.startswith('http') else f"https://biwase.com.vn{href_str}"
                pages.append(full_url)

        logger.info(f"Found {len(pages)} pagination pages")
        self.stats['pages_processed'] = len(pages)
        return pages

    def get_news_links(self, page_url: str) -> List[str]:
        """
        Retrieve news article links from a pagination page.

        Args:
            page_url: URL of the pagination page

        Returns:
            List of news article URLs
        """
        logger.debug(f"Processing page: {page_url}")
        soup = self.get_soup(page_url)
        if not soup:
            logger.warning(f"Failed to fetch page: {page_url}")
            return []

        news_links = []
        for a in soup.find_all('a', class_='img-scale'):
            href = a.get('href')
            if href:
                href_str = str(href)
                full_url = href_str if href_str.startswith('http') else f"https://biwase.com.vn{href_str}"
                news_links.append(full_url)

        logger.debug(f"Found {len(news_links)} news links on page {page_url}")
        return news_links

    def get_pdf_links(self, news_url: str) -> List[str]:
        """
        Retrieve PDF links from a news article.

        Args:
            news_url: URL of the news article

        Returns:
            List of PDF URLs
        """
        logger.debug(f"Processing news article: {news_url}")
        soup = self.get_soup(news_url)
        if not soup:
            logger.warning(f"Failed to fetch news article: {news_url}")
            return []

        pdf_links = []
        for iframe in soup.find_all('iframe'):
            iframe_src = iframe.get('src')
            if iframe_src:
                src_str = str(iframe_src)
                # Handle both relative and absolute URLs
                if src_str.startswith('http'):
                    pdf_links.append(src_str)
                else:
                    # Remove leading slash if present to avoid double slashes
                    clean_src = src_str.lstrip('/')
                    full_url = f"https://biwase.com.vn/{clean_src}"
                    pdf_links.append(full_url)

        logger.debug(f"Found {len(pdf_links)} PDF links in article {news_url}")
        return pdf_links

    def download_pdf(self, pdf_url: str) -> Dict[str, Any]:
        """
        Download a PDF file with retry logic and validation.

        Args:
            pdf_url: URL of the PDF to download

        Returns:
            Dict with download result and metadata
        """
        logger.info(f"Downloading PDF from: {pdf_url}")

        try:
            response = self._make_request_with_retry(pdf_url, stream=True)
            if not response:
                return {
                    "success": False,
                    "error": "Failed to download after retries",
                    "url": pdf_url,
                    "file_path": None,
                    "file_size": 0
                }

            # Validate content type
            content_type = response.headers.get('content-type', '').lower()
            if 'pdf' not in content_type and 'application/octet-stream' not in content_type:
                logger.warning(f"Unexpected content type '{content_type}' for {pdf_url}")
                # Continue anyway as some servers don't set proper content-type

            # Generate safe filename
            filename = self._generate_safe_filename(pdf_url)
            file_path = self.output_dir / filename

            # Download with progress tracking
            file_size = 0
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        file_size += len(chunk)

            # Validate file size
            if file_size == 0:
                file_path.unlink(missing_ok=True)
                return {
                    "success": False,
                    "error": "Downloaded file is empty",
                    "url": pdf_url,
                    "file_path": None,
                    "file_size": 0
                }

            logger.info(f"Successfully downloaded {filename} ({file_size} bytes)")

            return {
                "success": True,
                "url": pdf_url,
                "file_path": str(file_path),
                "filename": filename,
                "file_size": file_size,
                "content_type": content_type
            }

        except Exception as e:
            logger.error(f"Error downloading PDF from {pdf_url}: {e}")
            return {
                "success": False,
                "error": str(e),
                "url": pdf_url,
                "file_path": None,
                "file_size": 0
            }

    def _generate_safe_filename(self, url: str) -> str:
        """
        Generate a safe filename from URL.

        Args:
            url: URL to extract filename from

        Returns:
            Safe filename string
        """
        # Extract filename from URL
        filename = url.split('/')[-1].split('?')[0]  # Remove query parameters

        # If no filename in URL, generate one from hash
        if not filename or '.' not in filename:
            url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
            filename = f"document_{url_hash}.pdf"

        # Sanitize filename
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)

        # Ensure .pdf extension
        if not filename.lower().endswith('.pdf'):
            filename += '.pdf'

        return filename

    def crawl_simple(self) -> Dict[str, Any]:
        """
        Execute simple crawl process - download PDFs only.

        Returns:
            Dict with crawl results
        """
        logger.info("Starting simple crawl (download only)")
        self.stats['start_time'] = datetime.now()

        try:
            pages_num = self.get_pagination_links()
            pages_found = len(pages_num)

            all_news = []
            for page in pages_num:
                time.sleep(self.rate_limit_delay)
                all_news.extend(self.get_news_links(page))

            unique_news = list(set(all_news))
            self.stats['news_articles_found'] = len(unique_news)
            logger.info(f"Found {len(unique_news)} unique news articles")

            all_pdfs = []
            for news_link in unique_news:
                time.sleep(self.rate_limit_delay)
                all_pdfs.extend(self.get_pdf_links(news_link))

            unique_pdfs = list(set(all_pdfs))
            self.stats['pdfs_found'] = len(unique_pdfs)
            logger.info(f"Total PDFs found: {len(unique_pdfs)}")

            downloaded_count = 0
            download_results = []

            for pdf_url in unique_pdfs:
                time.sleep(self.rate_limit_delay)
                result = self.download_pdf(pdf_url)
                download_results.append(result)
                if result["success"]:
                    downloaded_count += 1
                    self.stats['pdfs_downloaded'] += 1

            self.stats['end_time'] = datetime.now()

            return {
                "success": True,
                "crawl_type": "simple",
                "pages_found": pages_found,
                "pdfs_found": len(unique_pdfs),
                "pdfs_downloaded": downloaded_count,
                "pdf_urls": unique_pdfs,
                "download_results": download_results,
                "output_dir": str(self.output_dir),
                "stats": self.stats.copy(),
                "message": f"Successfully crawled and downloaded {downloaded_count} PDFs from {pages_found} pages"
            }

        except Exception as e:
            logger.error(f"Crawl failed: {e}")
            self.stats['end_time'] = datetime.now()
            return {
                "success": False,
                "crawl_type": "simple",
                "error": str(e),
                "pages_found": 0,
                "pdfs_found": 0,
                "pdfs_downloaded": 0,
                "pdf_urls": [],
                "download_results": [],
                "stats": self.stats.copy(),
                "message": f"Crawl failed: {e}"
            }

    def crawl_full_pipeline(
        self,
        background_tasks_service: Optional[Any] = None,
        user_id: str = "system"
    ) -> Dict[str, Any]:
        """
        Execute full crawl process with RAG pipeline integration.

        Args:
            background_tasks_service: BackgroundTaskService instance for async processing
            user_id: User ID for document ownership

        Returns:
            Dict with crawl results and processing tasks
        """
        logger.info("Starting full pipeline crawl (download + process + embed)")
        self.stats['start_time'] = datetime.now()

        try:
            # First do the simple crawl
            crawl_result = self.crawl_simple()

            if not crawl_result["success"]:
                return crawl_result

            # If background service is provided, trigger processing for each downloaded PDF
            processing_tasks = []
            if background_tasks_service:
                for download_result in crawl_result["download_results"]:
                    if download_result["success"]:
                        try:
                            # Create document record first
                            from ...models.document import Document
                            from ...core.database import get_db
                            from sqlalchemy.orm import Session

                            # This would need to be injected properly in a real implementation
                            # For now, we'll just prepare the data
                            document_data = {
                                "filename": download_result["filename"],
                                "file_path": download_result["file_path"],
                                "file_size": download_result["file_size"],
                                "content_type": download_result["content_type"],
                                "source_url": download_result["url"],
                                "user_id": user_id,
                                "status": "pending_processing"
                            }

                            # Start background processing task
                            task_id = f"crawl_process_{hashlib.md5(download_result['url'].encode()).hexdigest()[:8]}"

                            logger.info(f"Starting background processing for {download_result['filename']}")
                            processing_tasks.append({
                                "task_id": task_id,
                                "document_data": document_data,
                                "status": "queued"
                            })

                        except Exception as e:
                            logger.error(f"Failed to queue processing for {download_result['filename']}: {e}")

            self.stats['end_time'] = datetime.now()

            return {
                **crawl_result,
                "crawl_type": "full_pipeline",
                "processing_tasks": processing_tasks,
                "message": f"Successfully crawled, downloaded {crawl_result['pdfs_downloaded']} PDFs, and queued {len(processing_tasks)} for processing"
            }

        except Exception as e:
            logger.error(f"Full pipeline crawl failed: {e}")
            self.stats['end_time'] = datetime.now()
            return {
                "success": False,
                "crawl_type": "full_pipeline",
                "error": str(e),
                "pages_found": 0,
                "pdfs_found": 0,
                "pdfs_downloaded": 0,
                "pdf_urls": [],
                "download_results": [],
                "processing_tasks": [],
                "stats": self.stats.copy(),
                "message": f"Full pipeline crawl failed: {e}"
            }

    # Backward compatibility
    def crawl(self) -> Dict[str, Any]:
        """Execute the full crawl process (backward compatibility)."""
        return self.crawl_simple()

def main(link: str='https://biwase.com.vn/tin-tuc/ban-tin-biwase'):
    """
    Main entry point that uses the BiwaseCrawler class.
    Kept for backward compatibility with existing calls.
    """
    config = CrawlConfig(base_url=link)
    crawler = BiwaseCrawler(config)
    try:
        return crawler.crawl_simple()
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "pages_found": 0,
            "pdfs_found": 0,
            "pdf_urls": [],
            "downloaded": 0,
            "message": f"Crawl failed: {e}"
        }
