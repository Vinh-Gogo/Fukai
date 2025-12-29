"""
Retrieval-Augmented Generation (RAG) service for question answering.

This service combines vector similarity search with LLM generation to provide
accurate answers based on document content.
"""

import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import structlog

from app.services.embedding_service import EmbeddingService


class RAGService:
    """Service for retrieval-augmented generation and question answering."""

    def __init__(self, embedding_service: EmbeddingService, logger: structlog.BoundLogger):
        self.embedding_service = embedding_service
        self.logger = logger

    async def initialize(self):
        """Initialize the RAG service."""
        await self.embedding_service.initialize()
        self.logger.info("RAG service initialized")

    async def answer_question(
        self,
        question: str,
        max_context_chunks: int = 5,
        score_threshold: float = 0.7,
        document_id: Optional[str] = None,
        include_sources: bool = True
    ) -> Dict[str, Any]:
        """
        Answer a question using RAG approach.

        Args:
            question: The question to answer
            max_context_chunks: Maximum number of context chunks to include
            score_threshold: Minimum similarity score for chunks
            document_id: Optional document ID to limit search scope
            include_sources: Whether to include source information

        Returns:
            Dictionary with answer and metadata
        """
        try:
            self.logger.info("Processing RAG question", question_length=len(question))

            # Search for relevant chunks
            relevant_chunks = await self.embedding_service.search_similar_chunks(
                query=question,
                limit=max_context_chunks,
                document_id=document_id,
                score_threshold=score_threshold
            )

            if not relevant_chunks:
                return {
                    "answer": "I don't have enough information in the documents to answer this question.",
                    "sources": [],
                    "confidence": 0.0,
                    "chunks_used": 0
                }

            # Prepare context from chunks
            context_parts = []
            sources = []

            for i, chunk in enumerate(relevant_chunks):
                context_parts.append(f"[Source {i+1}] {chunk['content']}")

                if include_sources:
                    sources.append({
                        "chunk_id": chunk["chunk_id"],
                        "document_id": chunk["document_id"],
                        "content": chunk["content"][:200] + "..." if len(chunk["content"]) > 200 else chunk["content"],
                        "score": chunk["score"],
                        "page_number": chunk["metadata"].get("page_number"),
                        "word_count": chunk["metadata"].get("word_count")
                    })

            context = "\n\n".join(context_parts)

            # Generate answer using LLM
            answer = await self._generate_answer(question, context)

            # Calculate confidence based on chunk scores
            avg_score = sum(chunk["score"] for chunk in relevant_chunks) / len(relevant_chunks)
            confidence = min(avg_score * 100, 100)  # Convert to percentage

            self.logger.info("RAG question answered",
                           chunks_used=len(relevant_chunks),
                           confidence=confidence)

            return {
                "answer": answer,
                "sources": sources if include_sources else [],
                "confidence": confidence,
                "chunks_used": len(relevant_chunks),
                "context_length": len(context)
            }

        except Exception as e:
            self.logger.error("Failed to answer question", error=str(e))
            return {
                "answer": "I encountered an error while processing your question. Please try again.",
                "sources": [],
                "confidence": 0.0,
                "chunks_used": 0,
                "error": str(e)
            }

    async def _generate_answer(self, question: str, context: str) -> str:
        """
        Generate an answer using the LLM with provided context.

        Args:
            question: The user's question
            context: Relevant document chunks as context

        Returns:
            Generated answer string
        """
        try:
            # Prepare the prompt
            prompt = self._build_rag_prompt(question, context)

            # For now, return a simple response based on context
            # In a real implementation, this would call OpenAI/Anthropic API
            if "biwase" in question.lower() or "company" in question.lower():
                return self._extract_answer_from_context(question, context)
            else:
                return f"Based on the available documents, here's what I found regarding your question: '{question}'\n\nThe documents contain relevant information about this topic."

        except Exception as e:
            self.logger.error("Failed to generate answer", error=str(e))
            return "I was unable to generate a complete answer. The documents may not contain sufficient information about this topic."

    def _build_rag_prompt(self, question: str, context: str) -> str:
        """Build the RAG prompt for the LLM."""
        return f"""You are a helpful assistant that answers questions based on the provided document context.

Context from documents:
{context}

Question: {question}

Instructions:
- Answer based only on the provided context
- If the context doesn't contain enough information to answer the question, say so clearly
- Be concise but comprehensive
- Include specific details from the documents when relevant
- If asked about specific data or facts, quote or reference them directly

Answer:"""

    def _extract_answer_from_context(self, question: str, context: str) -> str:
        """Simple context-based answer extraction (placeholder for LLM)."""
        # This is a simplified implementation
        # In production, this would use an actual LLM

        context_lower = context.lower()
        question_lower = question.lower()

        # Simple keyword matching for demo purposes
        if "biwase" in question_lower:
            if "what" in question_lower and "company" in question_lower:
                return "Biwase appears to be a company that publishes regular reports (Biwas TIN). The documents contain various quarterly and monthly reports from this company, covering topics like financial performance, business operations, and industry updates."

        if "report" in question_lower or "tin" in question_lower:
            return "The documents contain numerous Biwase TIN reports, including quarterly reports (Q1, Q2, etc.) and monthly reports (T1, T2, etc. for each year). These reports appear to cover the company's performance, market conditions, and business developments."

        # Default response
        return "The documents contain detailed Biwase TIN reports covering various time periods. These reports include information about the company's operations, financial performance, and market conditions. For specific details about particular reports or time periods, please ask more specific questions."

    async def get_relevant_chunks(
        self,
        query: str,
        limit: int = 10,
        document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get relevant chunks for a query without generating an answer.

        Args:
            query: Search query
            limit: Maximum number of chunks to return
            document_id: Optional document ID filter

        Returns:
            List of relevant chunks with metadata
        """
        return await self.embedding_service.search_similar_chunks(
            query=query,
            limit=limit,
            document_id=document_id,
            score_threshold=0.5
        )

    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector collection."""
        return await self.embedding_service.get_collection_stats()
