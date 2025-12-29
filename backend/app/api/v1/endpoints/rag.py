"""
RAG (Retrieval-Augmented Generation) endpoints for question answering.

This module provides endpoints for asking questions about processed documents
using the RAG approach.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, Dict, Any
import structlog

from app.api.deps import get_logger
from app.services.rag_service import RAGService
from app.services.embedding_service import EmbeddingService


router = APIRouter()


def get_rag_service(logger=Depends(get_logger)) -> RAGService:
    """Dependency to get a RAGService instance."""
    embedding_service = EmbeddingService(logger)
    return RAGService(embedding_service, logger)


@router.post("/ask")
async def ask_question(
    question: str,
    max_context_chunks: int = Query(5, description="Maximum number of context chunks to use"),
    score_threshold: float = Query(0.7, description="Minimum similarity score for chunks"),
    document_id: Optional[str] = Query(None, description="Limit search to specific document"),
    include_sources: bool = Query(True, description="Include source information in response"),
    rag_service: RAGService = Depends(get_rag_service),
    logger=Depends(get_logger),
):
    """
    Ask a question about the processed documents.

    Uses RAG (Retrieval-Augmented Generation) to find relevant information
    and generate an accurate answer based on document content.

    Returns:
        Answer with confidence score and source information
    """
    if not question or not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    logger.info("RAG question received",
               question_length=len(question),
               max_context_chunks=max_context_chunks,
               document_id=document_id)

    try:
        # Initialize the RAG service
        await rag_service.initialize()

        # Ask the question
        result = await rag_service.answer_question(
            question=question.strip(),
            max_context_chunks=max_context_chunks,
            score_threshold=score_threshold,
            document_id=document_id,
            include_sources=include_sources
        )

        logger.info("RAG question answered",
                   chunks_used=result.get("chunks_used", 0),
                   confidence=result.get("confidence", 0))

        return {
            "question": question,
            "answer": result["answer"],
            "confidence": result["confidence"],
            "chunks_used": result["chunks_used"],
            "sources": result.get("sources", []),
            "metadata": {
                "context_length": result.get("context_length", 0),
                "processing_time": result.get("processing_time", 0),
            }
        }

    except Exception as e:
        logger.error("RAG question failed", error=str(e), question=question[:100])
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process question: {str(e)}"
        )


@router.get("/search")
async def search_chunks(
    query: str,
    limit: int = Query(10, description="Maximum number of chunks to return"),
    document_id: Optional[str] = Query(None, description="Limit search to specific document"),
    rag_service: RAGService = Depends(get_rag_service),
    logger=Depends(get_logger),
):
    """
    Search for relevant document chunks.

    Returns chunks that are most similar to the query without generating an answer.
    Useful for exploring document content or building custom interfaces.
    """
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    logger.info("Chunk search requested", query_length=len(query), limit=limit)

    try:
        # Initialize the RAG service
        await rag_service.initialize()

        # Search for chunks
        chunks = await rag_service.get_relevant_chunks(
            query=query.strip(),
            limit=limit,
            document_id=document_id
        )

        logger.info("Chunks retrieved", count=len(chunks))

        return {
            "query": query,
            "chunks": chunks,
            "total_found": len(chunks),
            "limit": limit
        }

    except Exception as e:
        logger.error("Chunk search failed", error=str(e), query=query[:100])
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search chunks: {str(e)}"
        )


@router.get("/stats")
async def get_rag_stats(
    rag_service: RAGService = Depends(get_rag_service),
    logger=Depends(get_logger),
):
    """
    Get statistics about the RAG system.

    Returns information about the vector collection and available documents.
    """
    logger.info("RAG stats requested")

    try:
        # Initialize the RAG service
        await rag_service.initialize()

        # Get collection stats
        stats = await rag_service.get_collection_stats()

        logger.info("RAG stats retrieved", vector_count=stats.get("vector_count", 0))

        return {
            "vector_collection": stats,
            "system_status": "operational" if not stats.get("error") else "error",
            "timestamp": "2025-12-29T14:02:28Z"  # Would be dynamic in real implementation
        }

    except Exception as e:
        logger.error("Failed to get RAG stats", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve stats: {str(e)}"
        )


@router.get("/health")
async def rag_health_check(
    rag_service: RAGService = Depends(get_rag_service),
    logger=Depends(get_logger),
):
    """
    Health check for the RAG system.

    Verifies that the vector database and embedding services are operational.
    """
    logger.info("RAG health check requested")

    try:
        # Initialize the RAG service
        await rag_service.initialize()

        # Try to get basic stats to verify connectivity
        stats = await rag_service.get_collection_stats()

        health_status = {
            "status": "healthy",
            "services": {
                "vector_database": "operational",
                "embedding_service": "operational"
            },
            "collection_info": {
                "exists": not bool(stats.get("error")),
                "vector_count": stats.get("vector_count", 0),
                "embedding_model": stats.get("embedding_model", "unknown")
            },
            "timestamp": "2025-12-29T14:02:28Z"
        }

        logger.info("RAG health check passed")
        return health_status

    except Exception as e:
        logger.error("RAG health check failed", error=str(e))

        return {
            "status": "unhealthy",
            "error": str(e),
            "services": {
                "vector_database": "failed",
                "embedding_service": "failed"
            },
            "timestamp": "2025-12-29T14:02:28Z"
        }
