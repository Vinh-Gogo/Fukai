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
        """Fetch a URL and return a BeautifulSoup object."""
        try:
            self.logger.debug("Fetching URL", url=url)
            response = self.session.get(url, timeout=settings.CRAWLER_REQUEST_TIMEOUT)
            response.raise_for_status()
            return BeautifulSoup(response.content.decode('utf-8'), 'html.parser')
        except Exception as e:
            self.logger.error("Error fetching URL", url=url, error=str(e))
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

    def download_pdf(self, pdf_url: str) -> Optional[Dict[str, Any]]:
        """Download a PDF file."""
        try:
            self.logger.debug("Downloading PDF", pdf_url=pdf_url)
            response = self.session.get(pdf_url, timeout=settings.CRAWLER_DOWNLOAD_TIMEOUT)
            response.raise_for_status()

            filename = pdf_url.split('/')[-1]
            file_path = self.output_dir / filename

            with open(file_path, 'wb') as f:
                f.write(response.content)

            file_info = {
                "filename": filename,
                "filepath": str(file_path),
                "url": pdf_url,
                "size": len(response.content),
                "downloaded_at": time.time()
            }

            self.logger.info("PDF downloaded successfully", filename=filename, size=len(response.content))
            return file_info

        except Exception as e:
            self.logger.error("Error downloading PDF", pdf_url=pdf_url, error=str(e))
            return None

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
            self.logger.error("Scan failed", error=str(e))
            return CrawlResult(
                success=False,
                pages_found=0,
                articles_found=0,
                pdfs_found=0,
                pdf_urls=[],
                message="Scan operation failed",
                error=str(e)
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

                file_info = self.download_pdf(pdf_url)
                if file_info:
                    downloaded_files.append(file_info)

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
