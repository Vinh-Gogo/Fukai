import aiohttp
import asyncio
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
    async for db in get_db():
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
        break  # Only process once since get_db() yields once

class AsyncBiwaseCrawler:
    def __init__(self, base_url: str = 'https://biwase.com.vn/tin-tuc/ban-tin-biwase', output_dir: str = "src/store/pdfs"):
        """
        Initialize the AsyncBiwaseCrawler.

        Args:
            base_url: The base URL to start crawling from.
            output_dir: The directory to save downloaded PDFs.
        """
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session: Optional[aiohttp.ClientSession] = None
        self.rate_limit_delay = 0.5  # Reduced from 1 second for better performance

    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout=aiohttp.ClientTimeout(total=30)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()

    async def get_soup(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a URL and return a BeautifulSoup object."""
        if not self.session:
            raise RuntimeError("Crawler must be used as async context manager")

        try:
            async with self.session.get(url) as response:
                response.raise_for_status()
                content = await response.text(encoding='utf-8')
                return BeautifulSoup(content, 'html.parser')
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None

    async def get_pagination_links(self) -> List[str]:
        """Retrieve pagination links from the base URL."""
        print(f"Starting crawl from: {self.base_url}")
        soup = await self.get_soup(self.base_url)
        if not soup:
            return []

        pages = []
        for pager in soup.find_all('a', class_='ModulePager'):
            href = pager.get('href')
            if href:
                pages.append(href)

        print(f"Found {len(pages)} pagination pages")
        return pages

    async def get_news_links(self, page_url: str) -> List[str]:
        """Retrieve news article links from a pagination page."""
        print(f"Processing page: {page_url}")
        soup = await self.get_soup(page_url)
        if not soup:
            return []

        news_links = []
        for a in soup.find_all('a', class_='img-scale'):
            href = a.get('href')
            if href:
                news_links.append(href)
        return news_links

    async def get_pdf_links(self, news_url: str) -> List[str]:
        """Retrieve PDF links from a news article."""
        print(f"Processing news article: {news_url}")
        soup = await self.get_soup(news_url)
        if not soup:
            return []

        pdf_links = []
        for iframe in soup.find_all('iframe'):
            iframe_src = iframe.get('src')
            if iframe_src:
                src = f"https://biwase.com.vn/{iframe_src}"
                pdf_links.append(src)
        return pdf_links

    async def download_pdf(self, pdf_url: str, retry_count: int = 3) -> tuple[bool, str, Optional[int]]:
        """Download a PDF file with retry logic. Returns (success, status, file_size)."""
        if not self.session:
            raise RuntimeError("Crawler must be used as async context manager")

        filename = pdf_url.split('/')[-1]
        file_path = self.output_dir / filename

        # Check if file already exists
        if file_path.exists():
            file_size = file_path.stat().st_size
            print(f"File {filename} already exists, skipping download")
            return True, "skipped", file_size

        for attempt in range(retry_count):
            try:
                print(f"Downloading {pdf_url}... (attempt {attempt + 1})")
                async with self.session.get(pdf_url) as response:
                    response.raise_for_status()

                    # Stream download to handle large files
                    with open(file_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            f.write(chunk)

                    file_size = file_path.stat().st_size
                    print(f"Saved to {file_path} ({file_size} bytes)")
                    return True, "downloaded", file_size

            except Exception as e:
                print(f"Error downloading {pdf_url} (attempt {attempt + 1}): {e}")
                if attempt < retry_count - 1:
                    await asyncio.sleep(self.rate_limit_delay * (attempt + 1))  # Exponential backoff
                else:
                    return False, "failed", None

        return False, "failed", None

    async def download_pdfs_concurrent(self, pdf_urls: List[str], max_concurrent: int = 3) -> List[Dict[str, Any]]:
        """Download multiple PDFs concurrently with controlled parallelism."""
        semaphore = asyncio.Semaphore(max_concurrent)

        async def download_with_semaphore(pdf_url: str) -> Dict[str, Any]:
            async with semaphore:
                success, status, file_size = await self.download_pdf(pdf_url)
                filename = pdf_url.split('/')[-1]

                result = {
                    "filename": filename,
                    "url": pdf_url,
                    "success": success,
                    "status": status,
                    "size": file_size or 0
                }

                # Rate limiting between downloads
                await asyncio.sleep(self.rate_limit_delay)
                return result

        # Execute downloads concurrently
        tasks = [download_with_semaphore(url) for url in pdf_urls]
        return await asyncio.gather(*tasks, return_exceptions=True)



async def scan_crawler(base_url: str = 'https://biwase.com.vn/tin-tuc/ban-tin-biwase') -> Dict[str, Any]:
    """Scan for articles and PDFs without downloading."""
    start_time = time.time()
    parameters = {"base_url": base_url}

    async with AsyncBiwaseCrawler(base_url) as crawler:
        try:
            pages_num = await crawler.get_pagination_links()
            pages_found = len(pages_num)

            all_news = []
            for page in pages_num:
                await asyncio.sleep(crawler.rate_limit_delay)
                news_links = await crawler.get_news_links(page)
                all_news.extend(news_links)

            unique_news = list(set(all_news))
            articles_found = len(unique_news)

            all_pdfs = []
            for news_link in unique_news:
                await asyncio.sleep(crawler.rate_limit_delay)
                pdf_links = await crawler.get_pdf_links(news_link)
                all_pdfs.extend(pdf_links)

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

async def download_pdfs(pdf_urls: List[str], output_dir: str = "src/store/pdfs", max_concurrent: int = 3) -> Dict[str, Any]:
    """Download specified PDFs with concurrent processing."""
    start_time = time.time()
    parameters = {"pdf_urls_count": len(pdf_urls), "output_dir": output_dir, "max_concurrent": max_concurrent}

    async with AsyncBiwaseCrawler(output_dir=output_dir) as crawler:
        try:
            # Use concurrent downloading
            download_results = await crawler.download_pdfs_concurrent(pdf_urls, max_concurrent)

            downloaded_count = 0
            skipped_count = 0
            failed_count = 0
            total_count = len(pdf_urls)
            files = []

            for result in download_results:
                if isinstance(result, Exception):
                    # Handle exceptions from concurrent downloads
                    print(f"Download task failed: {result}")
                    failed_count += 1
                    continue

                if result["success"]:
                    if result["status"] == "skipped":
                        skipped_count += 1
                    elif result["status"] == "downloaded":
                        downloaded_count += 1
                else:
                    failed_count += 1

                files.append(result)

            execution_duration = time.time() - start_time
            result_summary = {
                "total_count": total_count,
                "downloaded_count": downloaded_count,
                "skipped_count": skipped_count,
                "failed_count": failed_count
            }

            result = {
                "success": True,
                "total_count": total_count,
                "downloaded_count": downloaded_count,
                "skipped_count": skipped_count,
                "failed_count": failed_count,
                "files": files,
                "execution_duration": execution_duration,
                "message": f"Downloaded {downloaded_count}, skipped {skipped_count}, failed {failed_count} PDFs out of {total_count} total"
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
                "total_count": len(pdf_urls),
                "downloaded_count": 0,
                "skipped_count": 0,
                "failed_count": len(pdf_urls),
                "files": [],
                "execution_duration": execution_duration,
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
