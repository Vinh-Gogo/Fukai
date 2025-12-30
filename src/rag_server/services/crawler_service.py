import requests
from bs4 import BeautifulSoup
import time
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.db import get_db
from ..models.models import CrawlerExecution

async def log_crawler_execution(
    api_endpoint: str,
    success: bool,
    parameters: Optional[Dict[str, Any]] = None,
    result_summary: Optional[Dict[str, Any]] = None,
    error_message: Optional[str] = None,
    execution_duration: Optional[float] = None
) -> None:
    """Log crawler API execution to database."""
    db: AsyncSession = await anext(get_db())
    try:
        execution = CrawlerExecution(
            api_endpoint=api_endpoint,
            success=success,
            parameters=parameters,
            result_summary=result_summary,
            error_message=error_message,
            execution_duration=execution_duration
        )
        db.add(execution)
        await db.commit()
    except Exception as e:
        print(f"Failed to log crawler execution: {e}")
    finally:
        await db.close()

class BiwaseCrawler:
    def __init__(self, base_url: str = 'https://biwase.com.vn/tin-tuc/ban-tin-biwase', output_dir: str = "src/store/pdfs"):
        """
        Initialize the BiwaseCrawler.

        Args:
            base_url: The base URL to start crawling from.
            output_dir: The directory to save downloaded PDFs.
        """
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()

    def get_soup(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a URL and return a BeautifulSoup object."""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return BeautifulSoup(response.content.decode('utf-8'), 'html.parser')
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None

    def get_pagination_links(self) -> List[str]:
        """Retrieve pagination links from the base URL."""
        print(f"Starting crawl from: {self.base_url}")
        soup = self.get_soup(self.base_url)
        if not soup:
            return []

        pages = []
        for pager in soup.find_all('a', class_='ModulePager'):
            href = pager.get('href')
            if href:
                pages.append(href)

        print(f"Found {len(pages)} pagination pages")
        return pages

    def get_news_links(self, page_url: str) -> List[str]:
        """Retrieve news article links from a pagination page."""
        print(f"Processing page: {page_url}")
        soup = self.get_soup(page_url)
        if not soup:
            return []

        news_links = []
        for a in soup.find_all('a', class_='img-scale'):
            href = a.get('href')
            if href:
                news_links.append(href)
        return news_links

    def get_pdf_links(self, news_url: str) -> List[str]:
        """Retrieve PDF links from a news article."""
        print(f"Processing news article: {news_url}")
        soup = self.get_soup(news_url)
        if not soup:
            return []

        pdf_links = []
        for iframe in soup.find_all('iframe'):
            iframe_src = iframe.get('src')
            if iframe_src:
                src = f"https://biwase.com.vn/{iframe_src}"
                pdf_links.append(src)
        return pdf_links

    def download_pdf(self, pdf_url: str) -> tuple[bool, str]:
        """Download a PDF file. Returns (success, status)."""
        try:
            filename = pdf_url.split('/')[-1]
            file_path = self.output_dir / filename

            # Check if file already exists
            if file_path.exists():
                print(f"File {filename} already exists, skipping download")
                return True, "skipped"

            print(f"Downloading {pdf_url}...")
            response = self.session.get(pdf_url)
            response.raise_for_status()

            with open(file_path, 'wb') as f:
                f.write(response.content)

            print(f"Saved to {file_path}")
            return True, "downloaded"
        except Exception as e:
            print(f"Error downloading {pdf_url}: {e}")
            return False, "failed"

    def crawl(self) -> Dict[str, Any]:
        """Execute the full crawl process."""
        pages_num = self.get_pagination_links()
        pages_found = len(pages_num)

        all_news = []
        for page in pages_num:
            time.sleep(1)  # Rate limiting
            all_news.extend(self.get_news_links(page))

        unique_news = list(set(all_news))
        print(f"Found {len(unique_news)} unique news articles")

        all_pdfs = []
        for news_link in unique_news:
            time.sleep(1)  # Rate limiting
            all_pdfs.extend(self.get_pdf_links(news_link))

        unique_pdfs = list(set(all_pdfs))
        pdfs_found = len(unique_pdfs)
        print(f"Total PDFs found: {pdfs_found}")

        downloaded_count = 0
        for pdf_url in unique_pdfs:
            time.sleep(1)  # Rate limiting
            if self.download_pdf(pdf_url):
                downloaded_count += 1

        return {
            "success": True,
            "pages_found": pages_found,
            "pdfs_found": pdfs_found,
            "pdf_urls": unique_pdfs,
            "downloaded": downloaded_count,
            "output_dir": str(self.output_dir),
            "message": f"Successfully crawled and downloaded {downloaded_count} PDFs from {pages_found} pages"
        }

async def scan_crawler(base_url: str = 'https://biwase.com.vn/tin-tuc/ban-tin-biwase') -> Dict[str, Any]:
    """Scan for articles and PDFs without downloading."""
    start_time = time.time()
    parameters = {"base_url": base_url}

    crawler = BiwaseCrawler(base_url)
    try:
        pages_num = crawler.get_pagination_links()
        pages_found = len(pages_num)

        all_news = []
        for page in pages_num:
            time.sleep(1)
            all_news.extend(crawler.get_news_links(page))

        unique_news = list(set(all_news))
        articles_found = len(unique_news)

        all_pdfs = []
        for news_link in unique_news:
            time.sleep(1)
            all_pdfs.extend(crawler.get_pdf_links(news_link))

        unique_pdfs = list(set(all_pdfs))
        pdfs_found = len(unique_pdfs)

        execution_duration = time.time() - start_time
        result_summary = {
            "pages_found": pages_found,
            "articles_found": articles_found,
            "pdfs_found": pdfs_found
        }

        result = {
            "success": True,
            "pages_found": pages_found,
            "articles_found": articles_found,
            "pdfs_found": pdfs_found,
            "pdf_urls": unique_pdfs,
            "message": f"Found {pdfs_found} PDFs from {articles_found} articles across {pages_found} pages"
        }

        await log_crawler_execution(
            api_endpoint="scan",
            success=True,
            parameters=parameters,
            result_summary=result_summary,
            execution_duration=execution_duration
        )

        return result
    except Exception as e:
        execution_duration = time.time() - start_time
        error_message = str(e)

        result = {
            "success": False,
            "error": error_message,
            "pages_found": 0,
            "articles_found": 0,
            "pdfs_found": 0,
            "pdf_urls": [],
            "message": f"Scan failed: {error_message}"
        }

        await log_crawler_execution(
            api_endpoint="scan",
            success=False,
            parameters=parameters,
            error_message=error_message,
            execution_duration=execution_duration
        )

        return result

async def download_pdfs(pdf_urls: List[str], output_dir: str = "src/store/pdfs") -> Dict[str, Any]:
    """Download specified PDFs."""
    start_time = time.time()
    parameters = {"pdf_urls_count": len(pdf_urls), "output_dir": output_dir}

    crawler = BiwaseCrawler(output_dir=output_dir)
    downloaded_count = 0
    skipped_count = 0
    total_count = len(pdf_urls)
    files = []

    try:
        for pdf_url in pdf_urls:
            time.sleep(1)
            success, status = crawler.download_pdf(pdf_url)

            if success:
                if status == "skipped":
                    skipped_count += 1
                elif status == "downloaded":
                    downloaded_count += 1

                filename = pdf_url.split('/')[-1]
                file_path = crawler.output_dir / filename
                file_size = file_path.stat().st_size if file_path.exists() else 0
                files.append({
                    "filename": filename,
                    "url": pdf_url,
                    "size": file_size,
                    "status": status
                })

        execution_duration = time.time() - start_time
        result_summary = {
            "total_count": total_count,
            "downloaded_count": downloaded_count,
            "skipped_count": skipped_count
        }

        result = {
            "success": True,
            "total_count": total_count,
            "downloaded_count": downloaded_count,
            "skipped_count": skipped_count,
            "files": files,
            "message": f"Downloaded {downloaded_count}, skipped {skipped_count} existing PDFs out of {total_count} total"
        }

        await log_crawler_execution(
            api_endpoint="download",
            success=True,
            parameters=parameters,
            result_summary=result_summary,
            execution_duration=execution_duration
        )

        return result
    except Exception as e:
        execution_duration = time.time() - start_time
        error_message = str(e)

        result = {
            "success": False,
            "error": error_message,
            "total_count": total_count,
            "downloaded_count": downloaded_count,
            "skipped_count": skipped_count,
            "files": files,
            "message": f"Download failed: {error_message}"
        }

        await log_crawler_execution(
            api_endpoint="download",
            success=False,
            parameters=parameters,
            error_message=error_message,
            execution_duration=execution_duration
        )

        return result

async def get_crawler_status(output_dir: str = "src/store/pdfs") -> Dict[str, Any]:
    """Get the status of downloaded files."""
    start_time = time.time()
    parameters = {"output_dir": output_dir}

    try:
        output_path = Path(output_dir)
        if not output_path.exists():
            result = {
                "downloaded_files_count": 0,
                "total_size": 0,
                "files": [],
                "output_dir": str(output_path)
            }

            execution_duration = time.time() - start_time
            result_summary = {"downloaded_files_count": 0, "total_size": 0}

            await log_crawler_execution(
                api_endpoint="status",
                success=True,
                parameters=parameters,
                result_summary=result_summary,
                execution_duration=execution_duration
            )

            return result

        files = []
        total_size = 0
        for file_path in output_path.glob("*.pdf"):
            if file_path.is_file():
                size = file_path.stat().st_size
                total_size += size
                files.append({
                    "filename": file_path.name,
                    "size": size,
                    "path": str(file_path)
                })

        execution_duration = time.time() - start_time
        result_summary = {
            "downloaded_files_count": len(files),
            "total_size": total_size
        }

        result = {
            "downloaded_files_count": len(files),
            "total_size": total_size,
            "files": files,
            "output_dir": str(output_path)
        }

        await log_crawler_execution(
            api_endpoint="status",
            success=True,
            parameters=parameters,
            result_summary=result_summary,
            execution_duration=execution_duration
        )

        return result
    except Exception as e:
        execution_duration = time.time() - start_time
        error_message = str(e)

        result = {
            "success": False,
            "error": error_message,
            "downloaded_files_count": 0,
            "total_size": 0,
            "files": [],
            "output_dir": output_dir
        }

        await log_crawler_execution(
            api_endpoint="status",
            success=False,
            parameters=parameters,
            error_message=error_message,
            execution_duration=execution_duration
        )

        return result
