"""
Shared fixtures and configuration for all tests
"""
import asyncio
import os
import tempfile
from pathlib import Path
from unittest.mock import Mock, AsyncMock

import pytest
from dotenv import load_dotenv

# Load test environment variables first
load_dotenv(Path(__file__).parent.parent / ".env.test", override=True)

from app.core.config import Settings


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def temp_dir():
    """Create a temporary directory for test files."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield Path(temp_dir)


@pytest.fixture
def mock_settings():
    """Mock settings for testing."""
    settings = Mock(spec=Settings)

    # Core settings
    settings.UPLOAD_DIR = "/tmp/test_uploads"
    settings.PDF_PROCESSING_DIR = "/tmp/test_processing"
    settings.MARKDOWN_OUTPUT_DIR = "/tmp/test_markdown"
    settings.MAX_CONCURRENT_PDF_JOBS = 2
    settings.PDF_PROCESSING_TIMEOUT = 30

    # Embedding settings
    settings.OPENAI_BASE_URL_EMBED = "http://localhost:8001/v1"
    settings.OPENAI_API_KEY_EMBED = "test-key"
    settings.OPENAI_API_MODEL_NAME_EMBED = "text-embedding-3-small"
    settings.EMBEDDING_DIMENSION = 1536
    settings.CHUNK_SIZE = 1000
    settings.CHUNK_OVERLAP = 200

    # QDrant settings
    settings.QDRANT_URL = "http://localhost:6333"
    settings.QDRANT_API_KEY = "test-qdrant-key"
    settings.QDRANT_COLLECTION_NAME = "test-collection"
    settings.MAX_RETRIEVED_DOCS = 10

    # Crawler settings
    settings.BIWASE_BASE_URL = "https://biwase.com.vn/tin-tuc/ban-tin-biwase"

    return settings


@pytest.fixture
def sample_pdf_content():
    """Sample PDF content for testing."""
    return b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000200 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n284\n%%EOF"


@pytest.fixture
def sample_markdown_content():
    """Sample markdown content for testing."""
    return """# Sample Document

This is a test document with some content.

## Section 1

Some text here.

## Section 2

More text content.
"""


@pytest.fixture
def mock_embedding_response():
    """Mock embedding API response."""
    return {
        "data": [
            {
                "embedding": [0.1] * 1536,  # Mock 1536-dimensional embedding
                "index": 0
            }
        ],
        "usage": {
            "prompt_tokens": 10,
            "total_tokens": 10
        }
    }


@pytest.fixture
def mock_qdrant_collection_info():
    """Mock QDrant collection info."""
    return {
        "success": True,
        "collection_name": "test-collection",
        "vector_size": 1536,
        "distance": "Cosine",
        "points_count": 100,
        "status": "green"
    }


@pytest.fixture
def mock_crawl_result():
    """Mock crawler result."""
    return {
        "success": True,
        "pages_found": 3,
        "pdfs_found": 5,
        "pdf_urls": [
            "https://example.com/pdf1.pdf",
            "https://example.com/pdf2.pdf",
            "https://example.com/pdf3.pdf"
        ],
        "downloaded": 3,
        "output_dir": "/tmp/test_downloads",
        "message": "Successfully crawled and downloaded 3 PDFs"
    }
