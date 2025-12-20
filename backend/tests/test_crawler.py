"""
Unit tests for BiwaseCrawler service
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
import tempfile
import shutil

from app.services.crawler import BiwaseCrawler


class TestBiwaseCrawler:
    """Test cases for BiwaseCrawler"""

    @pytest.fixture
    def temp_output_dir(self):
        """Create temporary output directory for tests."""
        temp_dir = Path(tempfile.mkdtemp())
        yield temp_dir
        shutil.rmtree(temp_dir, ignore_errors=True)

    @pytest.fixture
    def crawler(self, temp_output_dir):
        """Create crawler instance with temp directory."""
        return BiwaseCrawler(
            base_url="https://biwase.com.vn/tin-tuc/ban-tin-biwase",
            output_dir=str(temp_output_dir)
        )

    @pytest.mark.unit
    @pytest.mark.crawler
    def test_crawler_initialization(self, temp_output_dir):
        """Test crawler initialization with custom parameters."""
        base_url = "https://test.com/news"
        crawler = BiwaseCrawler(base_url=base_url, output_dir=str(temp_output_dir))

        assert crawler.base_url == base_url
        assert crawler.output_dir == temp_output_dir
        assert crawler.output_dir.exists()
        assert isinstance(crawler.session, type(crawler.session))

    @pytest.mark.unit
    @pytest.mark.crawler
    @patch('app.services.crawler.requests.Session')
    def test_get_soup_success(self, mock_session_class, crawler):
        """Test successful HTML parsing."""
        # Mock the session and response
        mock_session = Mock()
        mock_response = Mock()
        mock_response.content = b'<html><body>Test content</body></html>'
        mock_response.encoding = 'utf-8'
        mock_response.headers = {}
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session

        # Create new crawler with mocked session
        crawler.session = mock_session

        soup = crawler.get_soup("https://test.com")

        assert soup is not None
        assert soup.find('body') is not None
        mock_session.get.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.crawler
    @patch('app.services.crawler.requests.Session')
    def test_get_soup_network_error(self, mock_session_class, crawler):
        """Test handling of network errors."""
        mock_session = Mock()
        mock_session.get.side_effect = Exception("Network error")
        mock_session_class.return_value = mock_session

        crawler.session = mock_session

        soup = crawler.get_soup("https://test.com")

        assert soup is None

    @pytest.mark.unit
    @pytest.mark.crawler
    @patch('app.services.crawler.requests.Session')
    def test_get_pagination_links_success(self, mock_session_class, crawler):
        """Test successful pagination link extraction."""
        mock_session = Mock()
        mock_response = Mock()
        # HTML with pagination links
        html_content = '''
        <html>
            <body>
                <a class="ModulePager" href="/page1">1</a>
                <a class="ModulePager" href="/page2">2</a>
                <a class="ModulePager" href="/page3">3</a>
            </body>
        </html>
        '''
        mock_response.content = html_content.encode('utf-8')
        mock_response.encoding = 'utf-8'
        mock_response.headers = {}
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session

        crawler.session = mock_session

        pages = crawler.get_pagination_links()

        assert len(pages) == 3
        assert "https://biwase.com.vn/page1" in pages
        assert "https://biwase.com.vn/page2" in pages
        assert "https://biwase.com.vn/page3" in pages

    @pytest.mark.unit
    @pytest.mark.crawler
    @patch('app.services.crawler.requests.Session')
    def test_get_pagination_links_no_links(self, mock_session_class, crawler):
        """Test pagination extraction when no links found."""
        mock_session = Mock()
        mock_response = Mock()
        # HTML without pagination links
        html_content = '<html><body><p>No pagination here</p></body></html>'
        mock_response.content = html_content.encode('utf-8')
        mock_response.encoding = 'utf-8'
        mock_response.headers = {}
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session

        crawler.session = mock_session

        pages = crawler.get_pagination_links()

        assert pages == []

    @pytest.mark.unit
    @pytest.mark.crawler
    @patch('app.services.crawler.requests.Session')
    def test_get_news_links_success(self, mock_session_class, crawler):
        """Test successful news article link extraction."""
        mock_session = Mock()
        mock_response = Mock()
        # HTML with news article links
        html_content = '''
        <html>
            <body>
                <a class="img-scale" href="/news/article1">Article 1</a>
                <a class="img-scale" href="/news/article2">Article 2</a>
                <div class="other-link">Not a news link</div>
            </body>
        </html>
        '''
        mock_response.content = html_content.encode('utf-8')
        mock_response.encoding = 'utf-8'
        mock_response.headers = {}
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session

        crawler.session = mock_session

        news_links = crawler.get_news_links("https://test.com/page1")

        assert len(news_links) == 2
        assert "https://biwase.com.vn/news/article1" in news_links
        assert "https://biwase.com.vn/news/article2" in news_links

    @pytest.mark.unit
    @pytest.mark.crawler
    @patch('app.services.crawler.requests.Session')
    def test_get_pdf_links_success(self, mock_session_class, crawler):
        """Test successful PDF link extraction from news articles."""
        mock_session = Mock()
        mock_response = Mock()
        # HTML with iframe containing PDF
        html_content = '''
        <html>
            <body>
                <iframe src="/uploads/document.pdf"></iframe>
                <iframe src="/files/report.pdf"></iframe>
            </body>
        </html>
        '''
        mock_response.content = html_content.encode('utf-8')
        mock_response.encoding = 'utf-8'
        mock_response.headers = {}
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session

        crawler.session = mock_session

        pdf_links = crawler.get_pdf_links("https://test.com/article1")

        assert len(pdf_links) == 2
        assert "https://biwase.com.vn/uploads/document.pdf" in pdf_links
        assert "https://biwase.com.vn/files/report.pdf" in pdf_links

    @pytest.mark.unit
    @pytest.mark.crawler
    @patch('app.services.crawler.requests.Session')
    def test_get_pdf_links_no_pdfs(self, mock_session_class, crawler):
        """Test PDF extraction when no PDFs found."""
        mock_session = Mock()
        mock_response = Mock()
        # HTML without iframes
        html_content = '<html><body><p>No PDFs here</p></body></html>'
        mock_response.content = html_content.encode('utf-8')
        mock_response.encoding = 'utf-8'
        mock_response.headers = {}
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session

        crawler.session = mock_session

        pdf_links = crawler.get_pdf_links("https://test.com/article1")

        assert pdf_links == []

    @pytest.mark.unit
    @pytest.mark.crawler
    @patch('app.services.crawler.requests.Session')
    def test_download_pdf_success(self, mock_session_class, crawler):
        """Test successful PDF download."""
        mock_session = Mock()
        mock_response = Mock()
        mock_response.content = b"PDF content here"
        mock_response.headers = {'content-type': 'application/pdf'}
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session

        crawler.session = mock_session

        result = crawler.download_pdf("https://example.com/test.pdf")

        assert result["success"] is True
        assert result["file_path"] is not None
        assert result["filename"] == "test.pdf"
        assert result["file_size"] == len(b"PDF content here")
        mock_session.get.assert_called_once()

        # Check if file was created
        downloaded_files = list(crawler.output_dir.glob("*.pdf"))
        assert len(downloaded_files) == 1
        assert downloaded_files[0].name == "test.pdf"

    @pytest.mark.unit
    @pytest.mark.crawler
    @patch('app.services.crawler.requests.Session')
    def test_download_pdf_failure(self, mock_session_class, crawler):
        """Test PDF download failure."""
        mock_session = Mock()
        mock_session.get.side_effect = Exception("Download failed")
        mock_session_class.return_value = mock_session

        crawler.session = mock_session

        result = crawler.download_pdf("https://example.com/test.pdf")

        assert result["success"] is False
        assert "Download failed" in result["error"]

    @pytest.mark.unit
    @pytest.mark.crawler
    @patch('app.services.crawler.requests.Session')
    @patch('app.services.crawler.time.sleep')
    def test_crawl_full_process(self, mock_sleep, mock_session_class, crawler):
        """Test the complete crawl process."""
        # Mock session for all operations
        mock_session = Mock()
        mock_session_class.return_value = mock_session

        # Mock pagination response
        pagination_html = '''
        <html><body>
            <a class="ModulePager" href="/page1">1</a>
            <a class="ModulePager" href="/page2">2</a>
        </body></html>
        '''
        pagination_response = Mock()
        pagination_response.content = pagination_html.encode('utf-8')
        pagination_response.encoding = 'utf-8'
        pagination_response.headers = {}

        # Mock news page response
        news_html = '''
        <html><body>
            <a class="img-scale" href="/news/article1">Article 1</a>
        </body></html>
        '''
        news_response = Mock()
        news_response.content = news_html.encode('utf-8')
        news_response.encoding = 'utf-8'
        news_response.headers = {}

        # Mock article page response
        article_html = '''
        <html><body>
            <iframe src="/uploads/doc1.pdf"></iframe>
        </body></html>
        '''
        article_response = Mock()
        article_response.content = article_html.encode('utf-8')
        article_response.encoding = 'utf-8'
        article_response.headers = {}

        # Mock PDF download response
        pdf_response = Mock()
        pdf_response.content = b"PDF data"
        pdf_response.headers = {'content-type': 'application/pdf'}

        # Set up responses in order
        mock_session.get.side_effect = [
            pagination_response,  # get_pagination_links
            news_response,        # get_news_links for page1
            news_response,        # get_news_links for page2
            article_response,     # get_pdf_links for article1
            article_response,     # get_pdf_links for article1 (duplicate)
            pdf_response,         # download_pdf
            pdf_response          # download_pdf (duplicate)
        ]

        crawler.session = mock_session

        result = crawler.crawl()

        # Verify basic structure
        assert "success" in result
        assert "crawl_type" in result
        assert "pages_found" in result
        assert "pdfs_found" in result
        assert "pdfs_downloaded" in result
        assert "download_results" in result
        assert "message" in result

        # Verify sleep was called for rate limiting (2 pages + 1 news article + 1 download = 4 calls)
        assert mock_sleep.call_count == 4

    @pytest.mark.unit
    @pytest.mark.crawler
    @patch('app.services.crawler.requests.Session')
    def test_crawl_network_failure(self, mock_session_class, crawler):
        """Test crawl process with network failures."""
        mock_session = Mock()
        mock_session.get.side_effect = Exception("Network completely down")
        mock_session_class.return_value = mock_session

        crawler.session = mock_session

        result = crawler.crawl()

        # The crawl method handles network failures gracefully and returns success=True with 0 counts
        assert result["success"] is True
        assert result["pages_found"] == 0
        assert result["pdfs_found"] == 0
        assert result["pdfs_downloaded"] == 0

    @pytest.mark.unit
    @pytest.mark.crawler
    def test_main_function_success(self):
        """Test the main function wrapper."""
        with patch('app.services.crawler.BiwaseCrawler') as mock_crawler_class:
            mock_crawler = Mock()
            mock_result = {"success": True, "message": "Test successful"}
            mock_crawler.crawl.return_value = mock_result
            mock_crawler_class.return_value = mock_crawler

            from app.services.crawler import main
            result = main()

            assert result == mock_result
            mock_crawler_class.assert_called_once()
            mock_crawler.crawl.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.crawler
    def test_main_function_failure(self):
        """Test the main function wrapper with exceptions."""
        with patch('app.services.crawler.BiwaseCrawler') as mock_crawler_class:
            mock_crawler = Mock()
            mock_crawler.crawl.side_effect = Exception("Crawl failed")
            mock_crawler_class.return_value = mock_crawler

            from app.services.crawler import main
            result = main()

            assert result["success"] is False
            assert "Crawl failed" in result["error"]
            assert result["pages_found"] == 0
            assert result["pdfs_found"] == 0
            assert result["downloaded"] == 0
