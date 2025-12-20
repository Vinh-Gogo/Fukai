"""
Abstract base crawler with plugin architecture for multiple websites
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Type
import logging
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class CrawlConfig:
    """Configuration for crawler instances"""
    base_url: str
    output_dir: str = "downloads"
    max_retries: int = 3
    retry_delay: float = 1.0
    request_timeout: int = 30
    rate_limit_delay: float = 1.0
    user_agent: Optional[str] = None
    max_pages: int = 10
    max_depth: int = 2


@dataclass
class CrawlResult:
    """Standardized crawl result structure"""
    success: bool
    crawl_type: str
    pages_found: int = 0
    pdfs_found: int = 0
    pdfs_downloaded: int = 0
    pdf_urls: List[str] = None  # type: ignore
    download_results: List[Dict[str, Any]] = None  # type: ignore
    processing_tasks: List[Dict[str, Any]] = None  # type: ignore
    error: Optional[str] = None
    stats: Dict[str, Any] = None  # type: ignore
    message: str = ""

    def __post_init__(self):
        if self.pdf_urls is None:
            self.pdf_urls = []
        if self.download_results is None:
            self.download_results = []
        if self.processing_tasks is None:
            self.processing_tasks = []
        if self.stats is None:
            self.stats = {}


class BaseCrawler(ABC):
    """Abstract base class for website crawlers"""

    def __init__(self, config: CrawlConfig):
        self.config = config
        self.output_dir = Path(config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Initialize stats
        self.stats = {
            'pages_processed': 0,
            'news_articles_found': 0,
            'pdfs_found': 0,
            'pdfs_downloaded': 0,
            'errors': [],
            'start_time': None,
            'end_time': None
        }

    @property
    @abstractmethod
    def website_name(self) -> str:
        """Name of the website this crawler handles"""
        pass

    @property
    @abstractmethod
    def supported_domains(self) -> List[str]:
        """List of domains this crawler can handle"""
        pass

    @abstractmethod
    def get_pagination_links(self) -> List[str]:
        """Retrieve pagination links from the base URL"""
        pass

    @abstractmethod
    def get_news_links(self, page_url: str) -> List[str]:
        """Retrieve news article links from a pagination page"""
        pass

    @abstractmethod
    def get_pdf_links(self, news_url: str) -> List[str]:
        """Retrieve PDF links from a news article"""
        pass

    def crawl_simple(self) -> CrawlResult:
        """Execute simple crawl process - download PDFs only"""
        logger.info(f"Starting simple crawl for {self.website_name}")
        self.stats['start_time'] = datetime.now()

        try:
            pages = self.get_pagination_links()
            pages_found = len(pages)

            all_news = []
            for page in pages:
                self._rate_limit_delay()
                all_news.extend(self.get_news_links(page))

            unique_news = list(set(all_news))
            self.stats['news_articles_found'] = len(unique_news)
            logger.info(f"Found {len(unique_news)} unique news articles")

            all_pdfs = []
            for news_link in unique_news:
                self._rate_limit_delay()
                all_pdfs.extend(self.get_pdf_links(news_link))

            unique_pdfs = list(set(all_pdfs))
            self.stats['pdfs_found'] = len(unique_pdfs)
            logger.info(f"Total PDFs found: {len(unique_pdfs)}")

            downloaded_count = 0
            download_results = []

            for pdf_url in unique_pdfs:
                self._rate_limit_delay()
                result = self.download_pdf(pdf_url)
                download_results.append(result)
                if result["success"]:
                    downloaded_count += 1
                    self.stats['pdfs_downloaded'] += 1

            self.stats['end_time'] = datetime.now()

            return CrawlResult(
                success=True,
                crawl_type="simple",
                pages_found=pages_found,
                pdfs_found=len(unique_pdfs),
                pdfs_downloaded=downloaded_count,
                pdf_urls=unique_pdfs,
                download_results=download_results,
                stats=self.stats.copy(),
                message=f"Successfully crawled and downloaded {downloaded_count} PDFs from {pages_found} pages"
            )

        except Exception as e:
            logger.error(f"Crawl failed for {self.website_name}: {e}")
            self.stats['end_time'] = datetime.now()
            return CrawlResult(
                success=False,
                crawl_type="simple",
                error=str(e),
                stats=self.stats.copy(),
                message=f"Crawl failed: {e}"
            )

    def crawl_full_pipeline(
        self,
        background_tasks_service: Optional[Any] = None,
        user_id: str = "system"
    ) -> CrawlResult:
        """Execute full crawl process with RAG pipeline integration"""
        logger.info(f"Starting full pipeline crawl for {self.website_name}")
        self.stats['start_time'] = datetime.now()

        try:
            # First do the simple crawl
            crawl_result = self.crawl_simple()

            if not crawl_result.success:
                return crawl_result

            # If background service is provided, trigger processing for each downloaded PDF
            processing_tasks = []
            if background_tasks_service:
                for download_result in crawl_result.download_results:
                    if download_result["success"]:
                        try:
                            # Prepare document data for processing
                            document_data = {
                                "filename": download_result["filename"],
                                "file_path": download_result["file_path"],
                                "file_size": download_result["file_size"],
                                "content_type": download_result.get("content_type", "application/pdf"),
                                "source_url": download_result["url"],
                                "user_id": user_id,
                                "status": "pending_processing"
                            }

                            # Start background processing task
                            import hashlib
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

            return CrawlResult(
                success=True,
                crawl_type="full_pipeline",
                pages_found=crawl_result.pages_found,
                pdfs_found=crawl_result.pdfs_found,
                pdfs_downloaded=crawl_result.pdfs_downloaded,
                pdf_urls=crawl_result.pdf_urls,
                download_results=crawl_result.download_results,
                processing_tasks=processing_tasks,
                stats=self.stats.copy(),
                message=f"Successfully crawled, downloaded {crawl_result.pdfs_downloaded} PDFs, and queued {len(processing_tasks)} for processing"
            )

        except Exception as e:
            logger.error(f"Full pipeline crawl failed for {self.website_name}: {e}")
            self.stats['end_time'] = datetime.now()
            return CrawlResult(
                success=False,
                crawl_type="full_pipeline",
                error=str(e),
                stats=self.stats.copy(),
                message=f"Full pipeline crawl failed: {e}"
            )

    @abstractmethod
    def download_pdf(self, pdf_url: str) -> Dict[str, Any]:
        """Download a PDF file with retry logic and validation"""
        pass

    def _rate_limit_delay(self):
        """Apply rate limiting delay"""
        import time
        time.sleep(self.config.rate_limit_delay)

    def can_handle_url(self, url: str) -> bool:
        """Check if this crawler can handle the given URL"""
        try:
            from urllib.parse import urlparse
            domain = urlparse(url).netloc.lower()
            return any(supported_domain in domain for supported_domain in self.supported_domains)
        except Exception:
            return False


class CrawlerRegistry:
    """Registry for managing crawler plugins"""

    def __init__(self):
        self._crawlers: Dict[str, Type[BaseCrawler]] = {}

    def register(self, crawler_class: Type[BaseCrawler]):
        """Register a crawler class"""
        if not issubclass(crawler_class, BaseCrawler):
            raise ValueError("Crawler must inherit from BaseCrawler")

        # Create a temporary instance to get metadata
        temp_config = CrawlConfig(base_url="https://example.com")
        temp_instance = crawler_class(temp_config)

        crawler_name = temp_instance.website_name
        self._crawlers[crawler_name] = crawler_class
        logger.info(f"Registered crawler: {crawler_name}")

    def get_crawler_class(self, website_name: str) -> Optional[Type[BaseCrawler]]:
        """Get crawler class by website name"""
        return self._crawlers.get(website_name)

    def get_crawler_for_url(self, url: str) -> Optional[Type[BaseCrawler]]:
        """Get appropriate crawler class for a URL"""
        for crawler_class in self._crawlers.values():
            # Create temp instance to check URL compatibility
            temp_config = CrawlConfig(base_url="https://example.com")
            temp_instance = crawler_class(temp_config)
            if temp_instance.can_handle_url(url):
                return crawler_class
        return None

    def list_available_crawlers(self) -> List[str]:
        """List all registered crawler names"""
        return list(self._crawlers.keys())


# Global registry instance
crawler_registry = CrawlerRegistry()


def register_crawler(crawler_class: Type[BaseCrawler]):
    """Decorator to register a crawler class"""
    crawler_registry.register(crawler_class)
    return crawler_class


def create_crawler_for_url(url: str, config: CrawlConfig) -> Optional[BaseCrawler]:
    """Create appropriate crawler instance for a URL"""
    crawler_class = crawler_registry.get_crawler_for_url(url)
    if crawler_class:
        return crawler_class(config)
    return None


def get_available_crawlers() -> List[str]:
    """Get list of available crawler names"""
    return crawler_registry.list_available_crawlers()
