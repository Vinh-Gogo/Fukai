"""
Embedding service for generating and managing document embeddings.

This service handles the generation of vector embeddings for document chunks
and their storage in the vector database for RAG applications.
"""

import json
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import structlog

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
import numpy as np

from app.config.settings import settings


class EmbeddingService:
    """Service for generating and managing document embeddings."""

    def __init__(self, logger: structlog.BoundLogger):
        self.logger = logger
        self.model = None
        self.qdrant_client = None
        self.collection_name = "document_chunks"
        self.embedding_model_name = settings.DEFAULT_EMBEDDING_MODEL
        self.embedding_dimension = 1536  # OpenAI ada-002 dimension

    async def initialize(self):
        """Initialize the embedding model and vector database connection."""
        try:
            self.logger.info("Initializing embedding service")

            # Initialize embedding model
            if self.embedding_model_name == "text-embedding-ada-002":
                # Use OpenAI embeddings
                import openai
                openai.api_key = settings.OPENAI_API_KEY
                self.embedding_model_name = "text-embedding-ada-002"
                self.embedding_dimension = 1536
            else:
                # Use local sentence transformer model
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                self.embedding_dimension = 384

            # Initialize Qdrant client
            self.qdrant_client = QdrantClient(
                url=settings.QDRANT_URL or "http://localhost:6333"
            )

            # Ensure collection exists
            await self._ensure_collection()

            self.logger.info("Embedding service initialized successfully")
            return True

        except Exception as e:
            self.logger.error("Failed to initialize embedding service", error=str(e))
            return False

    async def _ensure_collection(self):
        """Ensure the vector collection exists."""
        try:
            # Check if collection exists
            collections = self.qdrant_client.get_collections()
            collection_names = [c.name for c in collections.collections]

            if self.collection_name not in collection_names:
                self.logger.info("Creating vector collection", collection=self.collection_name)

                self.qdrant_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dimension,
                        distance=Distance.COSINE
                    )
                )

                self.logger.info("Vector collection created", collection=self.collection_name)
            else:
                self.logger.info("Vector collection already exists", collection=self.collection_name)

        except Exception as e:
            self.logger.error("Failed to ensure collection exists", error=str(e))
            raise

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.

        Args:
            texts: List of text strings to embed

        Returns:
            List of embedding vectors
        """
        try:
            if self.embedding_model_name == "text-embedding-ada-002":
                # Use OpenAI embeddings
                import openai

                embeddings = []
                batch_size = 100  # OpenAI limit

                for i in range(0, len(texts), batch_size):
                    batch = texts[i:i + batch_size]

                    response = await openai.Embedding.acreate(
                        input=batch,
                        model=self.embedding_model_name
                    )

                    batch_embeddings = [data.embedding for data in response.data]
                    embeddings.extend(batch_embeddings)

                    # Rate limiting
                    await asyncio.sleep(0.1)

                return embeddings

            else:
                # Use local model
                if not self.model:
                    raise ValueError("Embedding model not initialized")

                # Generate embeddings in batches
                embeddings = []
                batch_size = 32

                for i in range(0, len(texts), batch_size):
                    batch = texts[i:i + batch_size]
                    batch_embeddings = self.model.encode(batch, convert_to_numpy=True)
                    embeddings.extend(batch_embeddings.tolist())

                return embeddings

        except Exception as e:
            self.logger.error("Failed to generate embeddings", error=str(e), text_count=len(texts))
            raise

    async def store_chunk_embeddings(
        self,
        document_id: str,
        chunks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate and store embeddings for document chunks.

        Args:
            document_id: ID of the document
            chunks: List of chunk dictionaries with content and metadata

        Returns:
            Dictionary with embedding results
        """
        try:
            self.logger.info("Starting chunk embedding generation",
                           document_id=document_id, chunk_count=len(chunks))

            # Extract texts from chunks
            texts = [chunk['content'] for chunk in chunks]

            # Generate embeddings
            embeddings = await self.generate_embeddings(texts)

            # Prepare points for Qdrant
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point_id = f"{document_id}_{i}"

                # Create payload with chunk metadata
                payload = {
                    "document_id": document_id,
                    "chunk_index": i,
                    "chunk_id": chunk.get('chunk_id', f"chunk_{i}"),
                    "content": chunk['content'],
                    "page_number": chunk.get('page_number', 0),
                    "word_count": chunk.get('word_count', 0),
                    "token_estimate": chunk.get('token_estimate', 0),
                    "start_position": chunk.get('start_position', 0),
                    "end_position": chunk.get('end_position', 0),
                    "created_at": datetime.utcnow().isoformat(),
                }

                point = PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload
                )
                points.append(point)

            # Store in Qdrant
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=points
            )

            self.logger.info("Chunk embeddings stored successfully",
                           document_id=document_id, vectors_stored=len(points))

            return {
                "success": True,
                "document_id": document_id,
                "vectors_stored": len(points),
                "embedding_model": self.embedding_model_name,
                "collection": self.collection_name
            }

        except Exception as e:
            self.logger.error("Failed to store chunk embeddings",
                            document_id=document_id, error=str(e))
            return {
                "success": False,
                "document_id": document_id,
                "error": str(e)
            }

    async def search_similar_chunks(
        self,
        query: str,
        limit: int = 10,
        document_id: Optional[str] = None,
        score_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search for similar document chunks.

        Args:
            query: Search query text
            limit: Maximum number of results
            document_id: Optional document ID filter
            score_threshold: Minimum similarity score

        Returns:
            List of similar chunks with metadata
        """
        try:
            # Generate embedding for query
            query_embedding = await self.generate_embeddings([query])
            query_vector = query_embedding[0]

            # Prepare search filter if document_id specified
            search_filter = None
            if document_id:
                from qdrant_client.http.models import Filter, FieldCondition, MatchValue
                search_filter = Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=document_id)
                        )
                    ]
                )

            # Search in Qdrant
            search_results = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit,
                query_filter=search_filter,
                score_threshold=score_threshold
            )

            # Format results
            results = []
            for hit in search_results:
                result = {
                    "chunk_id": hit.payload.get("chunk_id"),
                    "document_id": hit.payload.get("document_id"),
                    "content": hit.payload.get("content"),
                    "page_number": hit.payload.get("page_number"),
                    "score": hit.score,
                    "metadata": {
                        "word_count": hit.payload.get("word_count"),
                        "token_estimate": hit.payload.get("token_estimate"),
                        "page_number": hit.payload.get("page_number"),
                        "start_position": hit.payload.get("start_position"),
                        "end_position": hit.payload.get("end_position"),
                    }
                }
                results.append(result)

            self.logger.info("Similarity search completed",
                           query_length=len(query), results_count=len(results))

            return results

        except Exception as e:
            self.logger.error("Failed to search similar chunks", error=str(e))
            return []

    async def delete_document_embeddings(self, document_id: str) -> bool:
        """
        Delete all embeddings for a document.

        Args:
            document_id: ID of the document to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            from qdrant_client.http.models import Filter, FieldCondition, MatchValue

            # Create filter for document
            delete_filter = Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            )

            # Delete points
            self.qdrant_client.delete(
                collection_name=self.collection_name,
                points_selector=delete_filter
            )

            self.logger.info("Document embeddings deleted", document_id=document_id)
            return True

        except Exception as e:
            self.logger.error("Failed to delete document embeddings",
                            document_id=document_id, error=str(e))
            return False

    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector collection."""
        try:
            collection_info = self.qdrant_client.get_collection(self.collection_name)

            return {
                "collection_name": self.collection_name,
                "vector_count": collection_info.points_count,
                "embedding_model": self.embedding_model_name,
                "embedding_dimension": self.embedding_dimension,
            }

        except Exception as e:
            self.logger.error("Failed to get collection stats", error=str(e))
            return {"error": str(e)}
