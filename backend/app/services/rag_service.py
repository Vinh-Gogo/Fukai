"""
RAG (Retrieval-Augmented Generation) service orchestration
"""
from typing import List, Dict, Any, Optional
import logging
from dataclasses import dataclass
from datetime import datetime

from .embedding_service import EmbeddingService
from .qdrant_service import QDrantService

logger = logging.getLogger(__name__)


@dataclass
class RAGResult:
    """Result of a RAG query"""
    query: str
    relevant_chunks: List[Dict[str, Any]]
    total_chunks_found: int
    processing_time: float
    timestamp: datetime


@dataclass
class DocumentChunk:
    """Document chunk with metadata"""
    document_id: str
    chunk_index: int
    chunk_text: str
    filename: str
    score: float


class RAGService:
    """Service for RAG query orchestration"""

    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QDrantService()

    async def query_documents(
        self,
        query: str,
        user_id: str,
        limit: Optional[int] = None,
        score_threshold: float = 0.0,
        include_metadata: bool = True
    ) -> RAGResult:
        """
        Query documents using RAG approach

        Args:
            query: Natural language query
            user_id: User ID for access control
            limit: Maximum number of results
            score_threshold: Minimum similarity score
            include_metadata: Whether to include document metadata

        Returns:
            RAGResult with relevant chunks and metadata
        """
        start_time = datetime.now()

        try:
            # Generate embedding for the query
            async with self.embedding_service:
                query_embedding = await self.embedding_service.generate_embedding(query)

            if not query_embedding:
                return RAGResult(
                    query=query,
                    relevant_chunks=[],
                    total_chunks_found=0,
                    processing_time=(datetime.now() - start_time).total_seconds(),
                    timestamp=start_time
                )

            # Search for similar vectors in QDrant
            search_result = await self.qdrant_service.search_similar(
                query_vector=query_embedding,
                user_id=user_id,
                limit=limit,
                score_threshold=score_threshold
            )

            if not search_result["success"]:
                logger.error(f"QDrant search failed: {search_result.get('error', 'Unknown error')}")
                return RAGResult(
                    query=query,
                    relevant_chunks=[],
                    total_chunks_found=0,
                    processing_time=(datetime.now() - start_time).total_seconds(),
                    timestamp=start_time
                )

            # Convert search results to RAG result format
            relevant_chunks = []
            for result in search_result["results"]:
                payload = result["payload"]

                chunk_data = {
                    "document_id": payload.get("document_id"),
                    "chunk_index": payload.get("chunk_index"),
                    "chunk_text": payload.get("chunk_text", ""),
                    "filename": payload.get("filename", ""),
                    "score": result["score"]
                }

                if include_metadata:
                    chunk_data["metadata"] = {
                        "qdrant_id": result["id"],
                        "user_id": payload.get("user_id"),
                        "search_score": result["score"]
                    }

                relevant_chunks.append(chunk_data)

            processing_time = (datetime.now() - start_time).total_seconds()

            return RAGResult(
                query=query,
                relevant_chunks=relevant_chunks,
                total_chunks_found=len(relevant_chunks),
                processing_time=processing_time,
                timestamp=start_time
            )

        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            logger.error(f"RAG query failed: {e}")

            return RAGResult(
                query=query,
                relevant_chunks=[],
                total_chunks_found=0,
                processing_time=processing_time,
                timestamp=start_time
            )

    async def get_user_documents_info(self, user_id: str) -> Dict[str, Any]:
        """
        Get information about user's documents in the vector store

        Args:
            user_id: User ID

        Returns:
            Dict with document statistics
        """
        try:
            # This would require a more complex query to QDrant
            # For now, return basic collection info
            collection_info = await self.qdrant_service.get_collection_info()

            if not collection_info["success"]:
                return {
                    "success": False,
                    "error": collection_info.get("error", "Failed to get collection info")
                }

            # Note: This gives total collection info, not user-specific
            # To get user-specific counts, we'd need to query all points with user filter
            return {
                "success": True,
                "total_points_in_collection": collection_info.get("points_count", 0),
                "collection_name": collection_info.get("collection_name", ""),
                "vector_size": collection_info.get("vector_size", 0),
                "note": "User-specific document counts require additional query implementation"
            }

        except Exception as e:
            logger.error(f"Failed to get user documents info: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def delete_user_documents(self, user_id: str) -> Dict[str, Any]:
        """
        Delete all documents for a user from the vector store

        Args:
            user_id: User ID

        Returns:
            Dict with deletion results
        """
        try:
            result = await self.qdrant_service.delete_user_points(user_id)

            return {
                "success": result["success"],
                "message": result.get("message", ""),
                "error": result.get("error", "") if not result["success"] else ""
            }

        except Exception as e:
            logger.error(f"Failed to delete user documents: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def health_check(self) -> Dict[str, Any]:
        """
        Comprehensive health check for RAG service

        Returns:
            Dict with health status
        """
        health_info = {
            "service": "rag",
            "timestamp": datetime.now().isoformat()
        }

        # Check embedding service
        try:
            async with self.embedding_service:
                embed_health = await self.embedding_service.test_connection()
            health_info["embedding_service"] = {
                "connected": embed_health.get("connected", False),
                "response_time": embed_health.get("response_time", 0),
                "model": embed_health.get("model", ""),
                "dimension": embed_health.get("embedding_dimension", 0)
            }
        except Exception as e:
            health_info["embedding_service"] = {
                "connected": False,
                "error": str(e)
            }

        # Check QDrant service
        try:
            qdrant_health = await self.qdrant_service.health_check()
            health_info["qdrant_service"] = qdrant_health
        except Exception as e:
            health_info["qdrant_service"] = {
                "connected": False,
                "error": str(e)
            }

        # Overall health
        embedding_service_info = health_info.get("embedding_service", {})
        qdrant_service_info = health_info.get("qdrant_service", {})

        embedding_ok = embedding_service_info.get("connected", False) if isinstance(embedding_service_info, dict) else False
        qdrant_ok = qdrant_service_info.get("connected", False) if isinstance(qdrant_service_info, dict) else False

        health_info["overall_healthy"] = embedding_ok and qdrant_ok

        return health_info

    def format_rag_response(self, rag_result: RAGResult, max_chunks: int = 5) -> Dict[str, Any]:
        """
        Format RAG result for API response

        Args:
            rag_result: RAGResult object
            max_chunks: Maximum number of chunks to return

        Returns:
            Formatted response dict
        """
        # Sort chunks by score (descending) and limit
        sorted_chunks = sorted(
            rag_result.relevant_chunks,
            key=lambda x: x["score"],
            reverse=True
        )[:max_chunks]

        return {
            "query": rag_result.query,
            "results": sorted_chunks,
            "total_found": rag_result.total_chunks_found,
            "returned_count": len(sorted_chunks),
            "processing_time": rag_result.processing_time,
            "timestamp": rag_result.timestamp.isoformat()
        }

    async def get_service_info(self) -> Dict[str, Any]:
        """Get information about RAG service configuration"""
        chunk_defaults = getattr(self.embedding_service, '_chunk_text', None)
        if chunk_defaults and hasattr(chunk_defaults, '__defaults__') and chunk_defaults.__defaults__:
            chunk_size = chunk_defaults.__defaults__[0]
            chunk_overlap = chunk_defaults.__defaults__[1]
        else:
            chunk_size = "unknown"
            chunk_overlap = "unknown"

        return {
            "embedding_model": self.embedding_service.model,
            "embedding_dimension": self.embedding_service.dimension,
            "qdrant_collection": self.qdrant_service.collection_name,
            "chunk_size": chunk_size,
            "chunk_overlap": chunk_overlap,
            "max_retrieved_docs": getattr(self.qdrant_service.client, '_timeout', "unknown") if hasattr(self.qdrant_service, 'client') else "unknown"
        }
