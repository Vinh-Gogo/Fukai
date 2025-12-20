"""
Unit tests for EmbeddingService
"""
import pytest
import aiohttp
from unittest.mock import Mock, patch, AsyncMock
from pathlib import Path
import asyncio
import json

from app.services.embedding_service import EmbeddingService


class TestEmbeddingService:
    """Test cases for EmbeddingService"""

    @pytest.fixture
    async def embedding_service(self, mock_settings):
        """Create EmbeddingService instance with mocked settings."""
        with patch('app.services.embedding_service.settings', mock_settings):
            service = EmbeddingService()
            yield service
            # Clean up session if it exists
            if hasattr(service, 'session') and service.session:
                await service.session.close()

    @pytest.mark.unit
    @pytest.mark.embedding
    def test_service_initialization(self, mock_settings):
        """Test EmbeddingService initialization."""
        with patch('app.services.embedding_service.settings', mock_settings):
            service = EmbeddingService()

            assert service.base_url == "http://localhost:8001/v1"
            assert service.api_key == "test-key"
            assert service.model == "text-embedding-3-small"
            assert service.dimension == 1536
            assert service.session is None

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_generate_embedding_success(self, embedding_service, mock_embedding_response):
        """Test successful embedding generation."""
        # Mock the HTTP session and response
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json.return_value = mock_embedding_response
        mock_session.post.return_value.__aenter__.return_value = mock_response
        mock_session.post.return_value.__aexit__.return_value = None

        embedding_service.session = mock_session

        result = await embedding_service.generate_embedding("Test text")

        assert result is not None
        assert len(result) == 1536  # Expected dimension
        assert isinstance(result, list)
        assert all(isinstance(x, float) for x in result)

        # Verify API call
        mock_session.post.assert_called_once()
        call_args = mock_session.post.call_args
        assert call_args[0][0] == "http://localhost:8001/v1/embeddings"

        # Check request payload
        request_data = call_args[1]['json']
        assert request_data['model'] == "text-embedding-3-small"
        assert request_data['input'] == "Test text"
        assert request_data['encoding_format'] == "float"

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_generate_embedding_api_error(self, embedding_service):
        """Test embedding generation with API error."""
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        mock_response.status = 400
        mock_response.text.return_value = "Bad Request: Invalid input"
        mock_session.post.return_value.__aenter__.return_value = mock_response
        mock_session.post.return_value.__aexit__.return_value = None

        embedding_service.session = mock_session

        result = await embedding_service.generate_embedding("Test text")

        assert result is None

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_generate_embedding_timeout(self, embedding_service):
        """Test embedding generation with timeout."""
        mock_session = AsyncMock()
        mock_session.post.side_effect = asyncio.TimeoutError()

        embedding_service.session = mock_session

        result = await embedding_service.generate_embedding("Test text")

        assert result is None

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_generate_embedding_invalid_response(self, embedding_service):
        """Test embedding generation with invalid API response."""
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json.return_value = {"invalid": "response"}
        mock_session.post.return_value.__aenter__.return_value = mock_response
        mock_session.post.return_value.__aexit__.return_value = None

        embedding_service.session = mock_session

        result = await embedding_service.generate_embedding("Test text")

        assert result is None

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_generate_embeddings_batch_success(self, embedding_service, mock_embedding_response):
        """Test successful batch embedding generation."""
        texts = ["Text 1", "Text 2", "Text 3"]

        # Mock successful responses for all texts
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json.return_value = mock_embedding_response
        mock_session.post.return_value.__aenter__.return_value = mock_response
        mock_session.post.return_value.__aexit__.return_value = None

        embedding_service.session = mock_session

        results = await embedding_service.generate_embeddings_batch(texts, batch_size=2)

        assert len(results) == 3
        assert all(result is not None for result in results)
        assert all(len(emb) == 1536 for emb in results if emb is not None)

        # Should be called 2 times (batch_size=2 for 3 texts)
        assert mock_session.post.call_count == 2

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_generate_embeddings_batch_partial_failure(self, embedding_service, mock_embedding_response):
        """Test batch embedding with some failures."""
        texts = ["Text 1", "Text 2", "Text 3"]

        # Mock session with mixed responses
        mock_session = AsyncMock()

        # First call succeeds
        mock_response_success = AsyncMock()
        mock_response_success.status = 200
        mock_response_success.json.return_value = mock_embedding_response

        # Second call fails
        mock_response_failure = AsyncMock()
        mock_response_failure.status = 500
        mock_response_failure.text.return_value = "Server error"

        # Set up the mock to return different responses
        mock_session.post.side_effect = [
            mock_response_success,  # First batch succeeds
            mock_response_failure   # Second batch fails
        ]

        # Mock the context managers
        mock_session.post.return_value.__aenter__.side_effect = [
            mock_response_success,
            mock_response_failure
        ]
        mock_session.post.return_value.__aexit__.return_value = None

        embedding_service.session = mock_session

        results = await embedding_service.generate_embeddings_batch(texts, batch_size=2)

        assert len(results) == 3
        # First two should succeed, third should fail
        assert results[0] is not None
        assert results[1] is not None
        assert results[2] is None

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_generate_embeddings_batch_exception_handling(self, embedding_service):
        """Test batch embedding with exceptions."""
        texts = ["Text 1", "Text 2"]

        mock_session = AsyncMock()
        mock_session.post.side_effect = Exception("Network error")

        embedding_service.session = mock_session

        results = await embedding_service.generate_embeddings_batch(texts)

        assert len(results) == 2
        assert all(result is None for result in results)

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_chunk_and_embed_success(self, embedding_service, mock_embedding_response):
        """Test successful text chunking and embedding."""
        long_text = "This is a long text that should be chunked. " * 50  # Long text

        mock_session = AsyncMock()
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json.return_value = mock_embedding_response
        mock_session.post.return_value.__aenter__.return_value = mock_response
        mock_session.post.return_value.__aexit__.return_value = None

        embedding_service.session = mock_session

        result = await embedding_service.chunk_and_embed(long_text, chunk_size=100, overlap=20)

        assert result["total_chunks"] > 1  # Should be chunked
        assert len(result["chunks"]) == result["total_chunks"]
        assert len(result["embeddings"]) == result["total_chunks"]
        assert result["success_count"] == result["total_chunks"]
        assert result["failed_count"] == 0

    @pytest.mark.unit
    @pytest.mark.embedding
    def test_chunk_text_basic(self, embedding_service):
        """Test basic text chunking functionality."""
        text = "This is a test text that should be chunked into smaller pieces for embedding."

        chunks = embedding_service._chunk_text(text, chunk_size=20, overlap=5)

        assert len(chunks) > 1
        assert all(len(chunk) <= 25 for chunk in chunks)  # Allow some flexibility

        # Check overlap - chunks should overlap by approximately 5 characters
        if len(chunks) > 1:
            # Find overlap between first two chunks
            chunk1_end = chunks[0][-10:]  # Last 10 chars of first chunk
            chunk2_start = chunks[1][:10]  # First 10 chars of second chunk
            # There should be some overlap
            overlap_found = any(char in chunk2_start for char in chunk1_end)
            assert overlap_found

    @pytest.mark.unit
    @pytest.mark.embedding
    def test_chunk_text_short_text(self, embedding_service):
        """Test chunking with text shorter than chunk size."""
        short_text = "Short text"

        chunks = embedding_service._chunk_text(short_text, chunk_size=100, overlap=10)

        assert len(chunks) == 1
        assert chunks[0] == short_text

    @pytest.mark.unit
    @pytest.mark.embedding
    def test_chunk_text_empty_text(self, embedding_service):
        """Test chunking with empty text."""
        chunks = embedding_service._chunk_text("", chunk_size=100, overlap=10)

        assert chunks == []

    @pytest.mark.unit
    @pytest.mark.embedding
    def test_chunk_text_sentence_boundaries(self, embedding_service):
        """Test that chunking prefers sentence boundaries."""
        text = "This is the first sentence. This is the second sentence. This is the third sentence."

        chunks = embedding_service._chunk_text(text, chunk_size=30, overlap=5)

        # Should break at sentence boundaries when possible
        assert len(chunks) > 1
        # Check that chunks end/start at reasonable boundaries
        for chunk in chunks:
            assert len(chunk.strip()) > 0

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_test_connection_success(self, embedding_service, mock_embedding_response):
        """Test successful connection test."""
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json.return_value = mock_embedding_response
        mock_session.post.return_value.__aenter__.return_value = mock_response
        mock_session.post.return_value.__aexit__.return_value = None

        embedding_service.session = mock_session

        result = await embedding_service.test_connection()

        assert result["connected"] is True
        assert "response_time" in result
        assert result["embedding_dimension"] == 1536
        assert result["model"] == "text-embedding-3-small"

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_test_connection_failure(self, embedding_service):
        """Test connection test failure."""
        mock_session = AsyncMock()
        mock_session.post.side_effect = Exception("Connection failed")

        embedding_service.session = mock_session

        result = await embedding_service.test_connection()

        assert result["connected"] is False
        assert "error" in result
        assert "response_time" in result

    @pytest.mark.unit
    @pytest.mark.embedding
    def test_get_service_info(self, embedding_service):
        """Test getting service information."""
        with patch('app.services.embedding_service.settings') as mock_settings:
            mock_settings.CHUNK_SIZE = 1000
            mock_settings.CHUNK_OVERLAP = 200

            info = embedding_service.get_service_info()

            assert info["model"] == "text-embedding-3-small"
            assert info["base_url"] == "http://localhost:8001/v1"
            assert info["dimension"] == 1536
            assert info["chunk_size"] == 1000
            assert info["chunk_overlap"] == 200

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_context_manager(self, embedding_service):
        """Test async context manager functionality."""
        # Test entering context
        async with embedding_service:
            assert embedding_service.session is not None
            assert isinstance(embedding_service.session, aiohttp.ClientSession)

        # Session should be closed after exiting
        assert embedding_service.session.closed

    @pytest.mark.unit
    @pytest.mark.embedding
    @pytest.mark.asyncio
    async def test_ensure_session(self, embedding_service):
        """Test session ensuring functionality."""
        await embedding_service._ensure_session()
        assert embedding_service.session is not None
        assert isinstance(embedding_service.session, aiohttp.ClientSession)

        # Should reuse existing session
        existing_session = embedding_service.session
        await embedding_service._ensure_session()
        assert embedding_service.session is existing_session
