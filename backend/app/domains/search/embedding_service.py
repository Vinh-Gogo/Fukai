"""
Embedding service for generating text embeddings using OpenAI-compatible API
"""
import asyncio
from typing import List, Dict, Any, Optional
import logging
import aiohttp
import json
import time

from ...core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings via OpenAI-compatible API"""

    def __init__(self):
        self.base_url = settings.OPENAI_BASE_URL_EMBED.rstrip('/')
        self.api_key = settings.OPENAI_API_KEY_EMBED
        self.model = settings.OPENAI_API_MODEL_NAME_EMBED
        self.dimension = settings.EMBEDDING_DIMENSION

        # HTTP client for API calls
        self.session: Optional[aiohttp.ClientSession] = None
        self._session_lock = asyncio.Lock()

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    async def _ensure_session(self):
        """Ensure HTTP session is available"""
        if self.session is None:
            self.session = aiohttp.ClientSession()

    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding for a single text

        Args:
            text: Input text to embed

        Returns:
            List of float values representing the embedding, or None if failed
        """
        await self._ensure_session()
        assert self.session is not None, "HTTP session not initialized"

        try:
            payload = {
                "model": self.model,
                "input": text,
                "encoding_format": "float"
            }

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            async with self.session.post(
                f"{self.base_url}/embeddings",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Embedding API error {response.status}: {error_text}")
                    return None

                data = await response.json()

                if "data" not in data or not data["data"]:
                    logger.error(f"Invalid embedding response: {data}")
                    return None

                embedding = data["data"][0]["embedding"]
                return embedding

        except asyncio.TimeoutError:
            logger.error(f"Timeout generating embedding for text (length: {len(text)})")
            return None
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None

    async def generate_embeddings_batch(self, texts: List[str], batch_size: int = 10) -> List[Optional[List[float]]]:
        """
        Generate embeddings for multiple texts in batches

        Args:
            texts: List of input texts
            batch_size: Number of texts to process in each batch

        Returns:
            List of embeddings (same order as input), None for failed texts
        """
        results = []

        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            logger.info(f"Processing embedding batch {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size}")

            # Process batch concurrently
            tasks = [self.generate_embedding(text) for text in batch_texts]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            # Handle results and exceptions
            for j, result in enumerate(batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Embedding failed for text {i+j}: {result}")
                    results.append(None)
                else:
                    results.append(result)

            # Small delay between batches to avoid overwhelming the service
            if i + batch_size < len(texts):
                await asyncio.sleep(0.1)

        return results

    async def chunk_and_embed(self, text: str, chunk_size: Optional[int] = None,
                            overlap: Optional[int] = None) -> Dict[str, Any]:
        """
        Chunk text and generate embeddings for each chunk

        Args:
            text: Full text to process
            chunk_size: Size of each chunk (uses config default if None)
            overlap: Overlap between chunks (uses config default if None)

        Returns:
            Dict with chunks, embeddings, and metadata
        """
        chunk_size = chunk_size or settings.CHUNK_SIZE
        overlap = overlap or settings.CHUNK_OVERLAP

        # Split text into chunks with overlap
        chunks = self._chunk_text(text, chunk_size, overlap)

        if not chunks:
            return {
                "chunks": [],
                "embeddings": [],
                "total_chunks": 0,
                "success_count": 0,
                "failed_count": 0
            }

        # Generate embeddings for all chunks
        embeddings = await self.generate_embeddings_batch(chunks)

        # Count successes and failures
        success_count = sum(1 for emb in embeddings if emb is not None)
        failed_count = len(embeddings) - success_count

        return {
            "chunks": chunks,
            "embeddings": embeddings,
            "total_chunks": len(chunks),
            "success_count": success_count,
            "failed_count": failed_count
        }

    def _chunk_text(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """
        Split text into overlapping chunks

        Args:
            text: Text to chunk
            chunk_size: Maximum size of each chunk
            overlap: Number of characters to overlap

        Returns:
            List of text chunks
        """
        if not text:
            return []

        chunks = []
        start = 0

        while start < len(text):
            # Find end of chunk
            end = start + chunk_size

            # If we're not at the end, try to break at a reasonable point
            if end < len(text):
                # Look for sentence endings within the last 100 characters
                search_start = max(start, end - 100)
                sentence_end = text.rfind('.', search_start, end)
                if sentence_end == -1:
                    sentence_end = text.rfind(' ', search_start, end)
                if sentence_end != -1:
                    end = sentence_end + 1

            # Extract chunk
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            # Move start position with overlap
            start = end - overlap

            # Prevent infinite loops
            if start >= len(text) or not chunk:
                break

        return chunks

    async def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to embedding service

        Returns:
            Dict with connection status and metadata
        """
        start_time = time.time()

        try:
            # Test with a simple text
            test_text = "Hello, this is a test."
            embedding = await self.generate_embedding(test_text)

            response_time = time.time() - start_time

            if embedding:
                return {
                    "connected": True,
                    "response_time": response_time,
                    "embedding_dimension": len(embedding),
                    "model": self.model,
                    "expected_dimension": self.dimension
                }
            else:
                return {
                    "connected": False,
                    "error": "Failed to generate test embedding",
                    "response_time": response_time
                }

        except Exception as e:
            response_time = time.time() - start_time
            return {
                "connected": False,
                "error": str(e),
                "response_time": response_time
            }

    async def get_service_info(self) -> Dict[str, Any]:
        """Get information about the embedding service configuration"""
        return {
            "model": self.model,
            "base_url": self.base_url,
            "dimension": self.dimension,
            "chunk_size": settings.CHUNK_SIZE,
            "chunk_overlap": settings.CHUNK_OVERLAP
        }
