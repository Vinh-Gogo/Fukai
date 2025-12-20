"""
QDrant vector database service for cloud operations
"""
from typing import List, Dict, Any, Optional, Union
import logging
import uuid
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse

from ..core.config import settings

logger = logging.getLogger(__name__)


class QDrantService:
    """Service for QDrant cloud vector database operations"""

    def __init__(self):
        self.api_key = settings.QDRANT_API_KEY
        self.url = settings.QDRANT_URL
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self.embedding_dimension = settings.EMBEDDING_DIMENSION

        # Initialize client
        self.client = QdrantClient(
            url=self.url,
            api_key=self.api_key,
            timeout=30
        )

    async def ensure_collection_exists(self) -> bool:
        """
        Ensure the collection exists, create it if it doesn't

        Returns:
            True if collection exists or was created successfully
        """
        try:
            # Check if collection exists
            collections = self.client.get_collections()
            collection_names = [c.name for c in collections.collections]

            if self.collection_name in collection_names:
                logger.info(f"Collection '{self.collection_name}' already exists")
                return True

            # Create collection
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=self.embedding_dimension,
                    distance=models.Distance.COSINE
                )
            )

            logger.info(f"Created collection '{self.collection_name}'")
            return True

        except Exception as e:
            logger.error(f"Failed to create/verify collection: {e}")
            return False

    async def add_points(self, points: List[Dict[str, Any]], user_id: str) -> Dict[str, Any]:
        """
        Add vectors to the collection

        Args:
            points: List of point dictionaries with 'vector', 'payload', etc.
            user_id: User ID for access control

        Returns:
            Dict with operation results
        """
        try:
            # Ensure collection exists
            if not await self.ensure_collection_exists():
                return {"success": False, "error": "Failed to ensure collection exists"}

            # Add user_id to all points for access control
            for point in points:
                if 'payload' not in point:
                    point['payload'] = {}
                point['payload']['user_id'] = user_id

            # Convert to QDrant format
            qdrant_points = []
            for point in points:
                qdrant_point = models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=point['vector'],
                    payload=point.get('payload', {})
                )
                qdrant_points.append(qdrant_point)

            # Upsert points
            result = self.client.upsert(
                collection_name=self.collection_name,
                points=qdrant_points
            )

            return {
                "success": True,
                "operation_id": result.operation_id,
                "points_added": len(qdrant_points)
            }

        except Exception as e:
            logger.error(f"Failed to add points: {e}")
            return {"success": False, "error": str(e)}

    async def search_similar(self, query_vector: List[float], user_id: str,
                           limit: Optional[int] = None, score_threshold: float = 0.0) -> Dict[str, Any]:
        """
        Search for similar vectors

        Args:
            query_vector: Query embedding vector
            user_id: User ID to filter results (access control)
            limit: Maximum number of results
            score_threshold: Minimum similarity score

        Returns:
            Dict with search results
        """
        try:
            limit = limit or settings.MAX_RETRIEVED_DOCS

            # Search with user filter
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                query_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="user_id",
                            match=models.MatchValue(value=user_id)
                        )
                    ]
                ),
                limit=limit,
                score_threshold=score_threshold
            )

            # Convert results to dict format
            results = []
            for hit in search_result:
                results.append({
                    "id": str(hit.id),
                    "score": hit.score,
                    "payload": hit.payload
                })

            return {
                "success": True,
                "results": results,
                "total_found": len(results)
            }

        except Exception as e:
            logger.error(f"Failed to search vectors: {e}")
            return {"success": False, "error": str(e), "results": []}

    async def delete_user_points(self, user_id: str) -> Dict[str, Any]:
        """
        Delete all points for a specific user

        Args:
            user_id: User ID whose points to delete

        Returns:
            Dict with deletion results
        """
        try:
            # Delete points with user filter
            result = self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="user_id",
                                match=models.MatchValue(value=user_id)
                            )
                        ]
                    )
                )
            )

            return {
                "success": True,
                "operation_id": result.operation_id,
                "message": f"Deleted points for user {user_id}"
            }

        except Exception as e:
            logger.error(f"Failed to delete user points: {e}")
            return {"success": False, "error": str(e)}

    async def get_collection_info(self) -> Dict[str, Any]:
        """
        Get information about the collection

        Returns:
            Dict with collection information
        """
        try:
            collection_info = self.client.get_collection(self.collection_name)

            return {
                "success": True,
                "collection_name": collection_info.config.name,
                "vector_size": collection_info.config.params.vectors.size,
                "distance": str(collection_info.config.params.vectors.distance),
                "points_count": collection_info.points_count,
                "status": str(collection_info.status)
            }

        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            return {"success": False, "error": str(e)}

    async def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to QDrant cloud

        Returns:
            Dict with connection status
        """
        try:
            # Try to get collections list
            collections = self.client.get_collections()

            return {
                "connected": True,
                "collections_count": len(collections.collections),
                "collection_names": [c.name for c in collections.collections]
            }

        except Exception as e:
            logger.error(f"QDrant connection test failed: {e}")
            return {
                "connected": False,
                "error": str(e)
            }

    async def health_check(self) -> Dict[str, Any]:
        """
        Comprehensive health check for QDrant service

        Returns:
            Dict with health status
        """
        health_info = {
            "service": "qdrant",
            "configured": bool(self.api_key and self.url),
        }

        # Test connection
        connection_test = await self.test_connection()
        health_info.update({
            "connected": connection_test["connected"],
            "connection_error": connection_test.get("error")
        })

        if connection_test["connected"]:
            # Test collection
            collection_info = await self.get_collection_info()
            health_info.update({
                "collection_exists": collection_info["success"],
                "collection_error": collection_info.get("error"),
                "points_count": collection_info.get("points_count", 0)
            })

        return health_info
