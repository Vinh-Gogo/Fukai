"""
Unit tests for QDrantService
"""
import pytest
import uuid
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from qdrant_client.http import models

from app.services.qdrant_service import QDrantService


class TestQDrantService:
    """Test cases for QDrantService"""

    @pytest.fixture
    def qdrant_service(self, mock_settings):
        """Create QDrantService instance with mocked settings."""
        with patch('app.services.qdrant_service.settings', mock_settings):
            service = QDrantService()
            yield service

    @pytest.mark.unit
    @pytest.mark.qdrant
    def test_service_initialization(self, mock_settings):
        """Test QDrantService initialization."""
        with patch('app.services.qdrant_service.settings', mock_settings):
            service = QDrantService()

            assert service.api_key == "test-qdrant-key"
            assert service.url == "http://localhost:6333"
            assert service.collection_name == "test-collection"
            assert service.embedding_dimension == 1536
            assert hasattr(service, 'client')

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_ensure_collection_exists_success(self, qdrant_service, mock_qdrant_collection_info):
        """Test successful collection creation/verification."""
        # Mock collection doesn't exist initially
        mock_collections = Mock()
        mock_collections.collections = []

        # Mock successful collection creation
        mock_operation = Mock()
        mock_operation.operation_id = "test-op-123"

        qdrant_service.client.get_collections.return_value = mock_collections
        qdrant_service.client.create_collection.return_value = mock_operation

        result = await qdrant_service.ensure_collection_exists()

        assert result is True
        qdrant_service.client.create_collection.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_ensure_collection_exists_already_exists(self, qdrant_service):
        """Test when collection already exists."""
        # Mock collection exists
        mock_collections = Mock()
        mock_collection = Mock()
        mock_collection.name = "test-collection"
        mock_collections.collections = [mock_collection]

        qdrant_service.client.get_collections.return_value = mock_collections

        result = await qdrant_service.ensure_collection_exists()

        assert result is True
        qdrant_service.client.create_collection.assert_not_called()

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_ensure_collection_exists_failure(self, qdrant_service):
        """Test collection creation failure."""
        # Mock collection doesn't exist and creation fails
        mock_collections = Mock()
        mock_collections.collections = []

        qdrant_service.client.get_collections.return_value = mock_collections
        qdrant_service.client.create_collection.side_effect = Exception("Creation failed")

        result = await qdrant_service.ensure_collection_exists()

        assert result is False

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_add_points_success(self, qdrant_service):
        """Test successful points addition."""
        points = [
            {
                "vector": [0.1] * 1536,
                "payload": {"text": "Test document", "metadata": {"source": "test"}}
            },
            {
                "vector": [0.2] * 1536,
                "payload": {"text": "Another document"}
            }
        ]

        user_id = "user123"

        # Mock successful upsert
        mock_operation = Mock()
        mock_operation.operation_id = "upsert-op-456"

        qdrant_service.client.upsert.return_value = mock_operation

        result = await qdrant_service.add_points(points, user_id)

        assert result["success"] is True
        assert result["operation_id"] == "upsert-op-456"
        assert result["points_added"] == 2

        # Verify user_id was added to payloads
        call_args = qdrant_service.client.upsert.call_args
        upserted_points = call_args[1]["points"]

        assert len(upserted_points) == 2
        assert upserted_points[0].payload["user_id"] == user_id
        assert upserted_points[1].payload["user_id"] == user_id

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_add_points_failure(self, qdrant_service):
        """Test points addition failure."""
        points = [{"vector": [0.1] * 1536, "payload": {}}]
        user_id = "user123"

        qdrant_service.client.upsert.side_effect = Exception("Upsert failed")

        result = await qdrant_service.add_points(points, user_id)

        assert result["success"] is False
        assert "Upsert failed" in result["error"]

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_search_similar_success(self, qdrant_service):
        """Test successful similarity search."""
        query_vector = [0.1] * 1536
        user_id = "user123"

        # Mock search results
        mock_hit1 = Mock()
        mock_hit1.id = "point-1"
        mock_hit1.score = 0.95
        mock_hit1.payload = {"text": "Document 1", "user_id": user_id}

        mock_hit2 = Mock()
        mock_hit2.id = "point-2"
        mock_hit2.score = 0.89
        mock_hit2.payload = {"text": "Document 2", "user_id": user_id}

        mock_search_result = Mock()
        mock_search_result.__iter__ = Mock(return_value=iter([mock_hit1, mock_hit2]))

        qdrant_service.client.search.return_value = [mock_hit1, mock_hit2]

        result = await qdrant_service.search_similar(query_vector, user_id, limit=5)

        assert result["success"] is True
        assert len(result["results"]) == 2
        assert result["total_found"] == 2

        # Check results structure
        assert result["results"][0]["id"] == "point-1"
        assert result["results"][0]["score"] == 0.95
        assert result["results"][0]["payload"]["user_id"] == user_id

        # Verify search was called with correct filter
        call_args = qdrant_service.client.search.call_args
        assert call_args[1]["query_vector"] == query_vector
        assert call_args[1]["limit"] == 5

        # Check filter
        query_filter = call_args[1]["query_filter"]
        assert len(query_filter.must) == 1
        condition = query_filter.must[0]
        assert condition.key == "user_id"
        assert condition.match.value == user_id

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_search_similar_no_results(self, qdrant_service):
        """Test search with no results."""
        query_vector = [0.1] * 1536
        user_id = "user123"

        qdrant_service.client.search.return_value = []

        result = await qdrant_service.search_similar(query_vector, user_id)

        assert result["success"] is True
        assert result["results"] == []
        assert result["total_found"] == 0

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_search_similar_failure(self, qdrant_service):
        """Test search failure."""
        query_vector = [0.1] * 1536
        user_id = "user123"

        qdrant_service.client.search.side_effect = Exception("Search failed")

        result = await qdrant_service.search_similar(query_vector, user_id)

        assert result["success"] is False
        assert "Search failed" in result["error"]
        assert result["results"] == []

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_delete_user_points_success(self, qdrant_service):
        """Test successful user points deletion."""
        user_id = "user123"

        mock_operation = Mock()
        mock_operation.operation_id = "delete-op-789"

        qdrant_service.client.delete.return_value = mock_operation

        result = await qdrant_service.delete_user_points(user_id)

        assert result["success"] is True
        assert result["operation_id"] == "delete-op-789"
        assert user_id in result["message"]

        # Verify delete was called with correct filter
        call_args = qdrant_service.client.delete.call_args
        delete_selector = call_args[1]["points_selector"]
        delete_filter = delete_selector.filter

        assert len(delete_filter.must) == 1
        condition = delete_filter.must[0]
        assert condition.key == "user_id"
        assert condition.match.value == user_id

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_delete_user_points_failure(self, qdrant_service):
        """Test user points deletion failure."""
        user_id = "user123"

        qdrant_service.client.delete.side_effect = Exception("Delete failed")

        result = await qdrant_service.delete_user_points(user_id)

        assert result["success"] is False
        assert "Delete failed" in result["error"]

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_get_collection_info_success(self, qdrant_service, mock_qdrant_collection_info):
        """Test successful collection info retrieval."""
        mock_collection = Mock()
        mock_collection.config.name = "test-collection"
        mock_collection.config.params.vectors.size = 1536
        mock_collection.config.params.vectors.distance = models.Distance.COSINE
        mock_collection.points_count = 100
        mock_collection.status = models.CollectionStatus.GREEN

        qdrant_service.client.get_collection.return_value = mock_collection

        result = await qdrant_service.get_collection_info()

        assert result["success"] is True
        assert result["collection_name"] == "test-collection"
        assert result["vector_size"] == 1536
        assert "COSINE" in str(result["distance"])
        assert result["points_count"] == 100
        assert "GREEN" in str(result["status"])

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_get_collection_info_failure(self, qdrant_service):
        """Test collection info retrieval failure."""
        qdrant_service.client.get_collection.side_effect = Exception("Collection not found")

        result = await qdrant_service.get_collection_info()

        assert result["success"] is False
        assert "Collection not found" in result["error"]

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_test_connection_success(self, qdrant_service):
        """Test successful connection test."""
        mock_collections = Mock()
        mock_collection1 = Mock()
        mock_collection1.name = "collection1"
        mock_collection2 = Mock()
        mock_collection2.name = "collection2"
        mock_collections.collections = [mock_collection1, mock_collection2]

        qdrant_service.client.get_collections.return_value = mock_collections

        result = await qdrant_service.test_connection()

        assert result["connected"] is True
        assert result["collections_count"] == 2
        assert "collection1" in result["collection_names"]
        assert "collection2" in result["collection_names"]

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_test_connection_failure(self, qdrant_service):
        """Test connection test failure."""
        qdrant_service.client.get_collections.side_effect = Exception("Connection failed")

        result = await qdrant_service.test_connection()

        assert result["connected"] is False
        assert "Connection failed" in result["error"]

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_health_check_success(self, qdrant_service):
        """Test successful health check."""
        # Mock successful connection and collection info
        mock_collections = Mock()
        mock_collections.collections = []
        qdrant_service.client.get_collections.return_value = mock_collections

        mock_collection = Mock()
        mock_collection.config.name = "test-collection"
        mock_collection.points_count = 50
        qdrant_service.client.get_collection.return_value = mock_collection

        result = await qdrant_service.health_check()

        assert result["service"] == "qdrant"
        assert result["configured"] is True
        assert result["connected"] is True
        assert result["collection_exists"] is True
        assert result["points_count"] == 50

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_health_check_partial_failure(self, qdrant_service):
        """Test health check with partial failures."""
        # Mock successful connection but collection failure
        mock_collections = Mock()
        mock_collections.collections = []
        qdrant_service.client.get_collections.return_value = mock_collections

        qdrant_service.client.get_collection.side_effect = Exception("Collection error")

        result = await qdrant_service.health_check()

        assert result["service"] == "qdrant"
        assert result["configured"] is True
        assert result["connected"] is True
        assert result["collection_exists"] is False
        assert "Collection error" in result["collection_error"]

    @pytest.mark.unit
    @pytest.mark.qdrant
    @pytest.mark.asyncio
    async def test_health_check_connection_failure(self, qdrant_service):
        """Test health check with connection failure."""
        qdrant_service.client.get_collections.side_effect = Exception("Connection failed")

        result = await qdrant_service.health_check()

        assert result["service"] == "qdrant"
        assert result["configured"] is True
        assert result["connected"] is False
        assert "Connection failed" in result["connection_error"]
