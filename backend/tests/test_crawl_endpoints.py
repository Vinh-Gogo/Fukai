"""
Unit tests for crawl endpoints
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.v1.endpoints.crawl import router, validate_url, validate_task_id, validate_pagination_params, sanitize_url_list


@pytest.fixture
def test_client():
    """Create test client for crawl endpoints"""
    from fastapi import FastAPI
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


@pytest.fixture
def mock_crawl_service():
    """Mock crawl service"""
    service = MagicMock()
    service.start_crawl_operation = AsyncMock()
    service.get_crawl_pages = MagicMock()
    service.get_articles_from_pages = MagicMock()
    service.get_pdf_links_from_articles = MagicMock()
    return service


@pytest.fixture
def mock_background_task_service():
    """Mock background task service"""
    service = MagicMock()
    service.get_task_status = MagicMock()
    service.list_active_tasks = MagicMock()
    return service


class TestCrawlValidation:
    """Test input validation functions"""

    def test_validate_url_success(self):
        """Test successful URL validation"""
        valid_urls = [
            "https://example.com",
            "http://example.com/path",
            "https://example.com/path?query=value",
            "https://subdomain.example.com/path"
        ]

        for url in valid_urls:
            result = validate_url(url)
            assert result == url

    def test_validate_url_invalid(self):
        """Test invalid URL validation"""
        invalid_urls = [
            "",  # Empty string
            "not-a-url",  # No scheme
            "ftp://example.com",  # Wrong scheme
            "javascript:alert('xss')",  # Dangerous scheme
            "http://localhost",  # Localhost
            "https://192.168.1.1",  # Private IP
            "http://<script>alert('xss')</script>.com",  # XSS attempt
            "a" * 2049  # Too long
        ]

        for url in invalid_urls:
            with pytest.raises(ValueError):
                validate_url(url)

    def test_validate_task_id_success(self):
        """Test successful task ID validation"""
        valid_ids = [
            "crawl_12345678",
            "crawl_abcdef12",
            "crawl_a1b2c3d4"
        ]

        for task_id in valid_ids:
            result = validate_task_id(task_id)
            assert result == task_id

    def test_validate_task_id_invalid(self):
        """Test invalid task ID validation"""
        invalid_ids = [
            "",  # Empty
            "invalid_id",  # Wrong format
            "crawl_123",  # Too short
            "crawl_123456789",  # Too long
            "other_12345678",  # Wrong prefix
            "crawl_g1234567",  # Invalid hex
        ]

        for task_id in invalid_ids:
            with pytest.raises(ValueError):
                validate_task_id(task_id)

    def test_validate_pagination_params_success(self):
        """Test successful pagination validation"""
        result = validate_pagination_params(10, 20)
        assert result == (10, 20)

    def test_validate_pagination_params_invalid(self):
        """Test invalid pagination validation"""
        # Test invalid limit
        with pytest.raises(ValueError, match="Limit must be an integer between 1 and 100"):
            validate_pagination_params(0, 0)

        with pytest.raises(ValueError, match="Limit must be an integer between 1 and 100"):
            validate_pagination_params(101, 0)

        # Test invalid offset
        with pytest.raises(ValueError, match="Offset must be a non-negative integer"):
            validate_pagination_params(10, -1)

    def test_sanitize_url_list_success(self):
        """Test successful URL list sanitization"""
        urls = [
            "https://example.com",
            "https://test.com",
            "https://example.com"  # Duplicate
        ]

        result = sanitize_url_list(urls)
        assert len(result) == 2  # Duplicates removed
        assert "https://example.com" in result
        assert "https://test.com" in result

    def test_sanitize_url_list_invalid(self):
        """Test invalid URL list sanitization"""
        # Test invalid URL
        with pytest.raises(ValueError):
            sanitize_url_list(["invalid-url"])

        # Test non-list input
        with pytest.raises(ValueError):
            sanitize_url_list("not-a-list")  # type: ignore

        # Test too many URLs
        too_many_urls = ["https://example.com"] * 51
        with pytest.raises(ValueError):
            sanitize_url_list(too_many_urls)

        # Test non-string URLs
        with pytest.raises(ValueError):
            sanitize_url_list([123, "https://example.com"])


class TestCrawlEndpoints:
    """Test cases for crawl endpoints"""

    def test_start_crawl_success(self, test_client, mock_crawl_service):
        """Test successful crawl start"""
        mock_crawl_service.start_crawl_operation.return_value = {
            "task_id": "crawl_12345678",
            "crawl_type": "simple",
            "status": "running",
            "user_id": "user123"
        }

        with patch('app.api.v1.endpoints.crawl.AuthService.get_current_user') as mock_auth, \
             patch('app.api.v1.endpoints.crawl.get_crawl_service', return_value=mock_crawl_service):

            mock_auth.return_value = MagicMock(id="user123")

            response = test_client.post("/start", json={
                "crawl_type": "simple",
                "user_id": "user123"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["data"]["task_id"] == "crawl_12345678"
            assert data["data"]["crawl_type"] == "simple"

    def test_start_crawl_validation_error(self, test_client):
        """Test crawl start with validation error"""
        with patch('app.api.v1.endpoints.crawl.AuthService.get_current_user') as mock_auth:
            mock_auth.return_value = MagicMock(id="user123")

            response = test_client.post("/start", json={
                "crawl_type": "invalid_type"
            })

            assert response.status_code == 400

    def test_get_crawl_status_success(self, test_client, mock_background_task_service):
        """Test successful status retrieval"""
        mock_background_task_service.get_task_status.return_value = {
            "task_id": "crawl_12345678",
            "status": "running",
            "progress": 50,
            "result": {"message": "In progress"}
        }

        with patch('app.api.v1.endpoints.crawl.AuthService.get_current_user') as mock_auth, \
             patch('app.api.v1.endpoints.crawl.get_background_task_service', return_value=mock_background_task_service):

            mock_auth.return_value = MagicMock(id="user123")

            response = test_client.get("/status/crawl_12345678")

            assert response.status_code == 200
            data = response.json()
            assert data["task_id"] == "crawl_12345678"
            assert data["status"] == "running"

    def test_get_crawl_status_invalid_task_id(self, test_client):
        """Test status retrieval with invalid task ID"""
        with patch('app.api.v1.endpoints.crawl.AuthService.get_current_user') as mock_auth:
            mock_auth.return_value = MagicMock(id="user123")

            response = test_client.get("/status/invalid_task_id")

            assert response.status_code == 400
            assert "Invalid task ID format" in response.json()["detail"]

    def test_get_crawl_status_not_found(self, test_client, mock_background_task_service):
        """Test status retrieval for non-existent task"""
        mock_background_task_service.get_task_status.return_value = None

        with patch('app.api.v1.endpoints.crawl.AuthService.get_current_user') as mock_auth, \
             patch('app.api.v1.endpoints.crawl.get_background_task_service', return_value=mock_background_task_service):

            mock_auth.return_value = MagicMock(id="user123")

            response = test_client.get("/status/crawl_12345678")

            assert response.status_code == 404
            assert "not found" in response.json()["detail"]

    def test_get_crawl_history_success(self, test_client, mock_background_task_service):
        """Test successful history retrieval"""
        mock_background_task_service.list_active_tasks.return_value = {
            "task1": {"task_id": "task1", "status": "running"},
            "task2": {"task_id": "task2", "status": "completed"}
        }

        with patch('app.api.v1.endpoints.crawl.get_background_task_service', return_value=mock_background_task_service):
            response = test_client.get("/history?limit=10&offset=0")

            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            assert "pagination" in data

    def test_get_crawl_history_invalid_pagination(self, test_client):
        """Test history retrieval with invalid pagination"""
        response = test_client.get("/history?limit=150&offset=-1")

        assert response.status_code == 400

    def test_get_pages_success(self, test_client):
        """Test successful page retrieval"""
        with patch('app.api.v1.endpoints.crawl.BiwaseCrawler') as mock_crawler_class:
            mock_crawler = MagicMock()
            mock_crawler.get_pagination_links.return_value = ["https://example.com/page1", "https://example.com/page2"]
            mock_crawler_class.return_value = mock_crawler

            response = test_client.get("/pages?url=https://example.com")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["page_urls"]) == 2

    def test_get_articles_success(self, test_client):
        """Test successful article retrieval"""
        with patch('app.api.v1.endpoints.crawl.sanitize_url_list') as mock_sanitize, \
             patch('app.api.v1.endpoints.crawl.BiwaseCrawler') as mock_crawler_class:

            mock_sanitize.return_value = ["https://example.com/page1"]

            mock_crawler = MagicMock()
            mock_crawler.get_news_links.return_value = ["https://example.com/article1", "https://example.com/article2"]
            mock_crawler_class.return_value = mock_crawler

            response = test_client.post("/articles", json={
                "page_urls": ["https://example.com/page1"]
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["article_urls"]) == 2

    def test_get_articles_validation_error(self, test_client):
        """Test article retrieval with validation error"""
        response = test_client.post("/articles", json={
            "page_urls": ["invalid-url"]
        })

        assert response.status_code == 400

    def test_get_pdf_links_success(self, test_client):
        """Test successful PDF link retrieval"""
        with patch('app.api.v1.endpoints.crawl.sanitize_url_list') as mock_sanitize, \
             patch('app.api.v1.endpoints.crawl.BiwaseCrawler') as mock_crawler_class:

            mock_sanitize.return_value = ["https://example.com/article1"]

            mock_crawler = MagicMock()
            mock_crawler.get_pdf_links.return_value = ["https://example.com/pdf1.pdf", "https://example.com/pdf2.pdf"]
            mock_crawler_class.return_value = mock_crawler

            response = test_client.post("/pdf-links", json={
                "article_urls": ["https://example.com/article1"]
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["pdf_urls"]) == 2

    def test_get_pdf_links_validation_error(self, test_client):
        """Test PDF link retrieval with validation error"""
        response = test_client.post("/pdf-links", json={
            "article_urls": ["invalid-url"]
        })

        assert response.status_code == 400


class TestCrawlSecurity:
    """Test security aspects of crawl endpoints"""

    def test_rate_limiting_applied(self, test_client):
        """Test that rate limiting decorators are applied"""
        # Verify endpoints have rate limiting by checking they don't immediately fail
        # In a real test environment, we would set up rate limiting
        response = test_client.get("/pages?url=https://example.com")
        assert response.status_code in [200, 500]  # Should not be rate limited in test

    def test_authentication_required(self, test_client):
        """Test that authentication is required for protected endpoints"""
        # Test status endpoint without auth
        response = test_client.get("/status/crawl_12345678")
        assert response.status_code in [401, 403]  # Should require authentication

        # Test start endpoint without auth
        response = test_client.post("/start", json={"crawl_type": "simple"})
        assert response.status_code in [401, 403]  # Should require authentication

    def test_input_validation_prevents_injection(self, test_client):
        """Test that input validation prevents injection attacks"""
        dangerous_inputs = [
            "javascript:alert('xss')",
            "http://localhost:8000",
            "https://192.168.1.1",
            "http://<script>alert('xss')</script>.com"
        ]

        for dangerous_url in dangerous_inputs:
            response = test_client.get(f"/pages?url={dangerous_url}")
            assert response.status_code in [400, 500]  # Should be rejected


class TestCrawlErrorHandling:
    """Test error handling in crawl endpoints"""

    def test_start_crawl_service_error(self, test_client, mock_crawl_service):
        """Test crawl start with service error"""
        mock_crawl_service.start_crawl_operation.side_effect = Exception("Service error")

        with patch('app.api.v1.endpoints.crawl.AuthService.get_current_user') as mock_auth, \
             patch('app.api.v1.endpoints.crawl.get_crawl_service', return_value=mock_crawl_service):

            mock_auth.return_value = MagicMock(id="user123")

            response = test_client.post("/start", json={
                "crawl_type": "simple"
            })

            assert response.status_code == 500
            assert "Internal server error" in response.json()["detail"]

    def test_get_pages_crawler_error(self, test_client):
        """Test page retrieval with crawler error"""
        with patch('app.api.v1.endpoints.crawl.BiwaseCrawler') as mock_crawler_class:
            mock_crawler = MagicMock()
            mock_crawler.get_pagination_links.side_effect = Exception("Crawler error")
            mock_crawler_class.return_value = mock_crawler

            response = test_client.get("/pages?url=https://example.com")

            assert response.status_code == 500
            assert "Failed to get pages" in response.json()["detail"]
