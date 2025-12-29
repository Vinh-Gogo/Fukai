"""
Document management endpoints for the Search RAG backend.

This module provides endpoints for uploading, managing, and retrieving documents.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
import os
import uuid
import json
from pathlib import Path

from app.config.settings import settings
from app.api.deps import get_logger, get_db_session
from app.core.exceptions import ValidationError
from app.services.document_service import DocumentService


router = APIRouter()


def get_document_service(db=Depends(get_db_session), logger=Depends(get_logger)) -> DocumentService:
    """Dependency to get a DocumentService instance."""
    return DocumentService(db, logger)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_service: DocumentService = Depends(get_document_service),
    logger=Depends(get_logger),
):
    """
    Upload a document for processing.

    This endpoint accepts document uploads and processes them immediately.
    Supported formats: PDF, TXT, MD, DOCX

    Returns:
        Processing results including document ID and metadata
    """
    logger.info("Document upload requested", filename=file.filename)

    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ['.pdf']:  # For now, only support PDF
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_extension}. Currently only PDF files are supported."
        )

    # Validate file size
    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {len(file_content)} bytes. Maximum size: {settings.MAX_FILE_SIZE} bytes"
        )

    try:
        # Save file temporarily for processing
        temp_filename = f"temp_{uuid.uuid4()}{file_extension}"
        temp_path = Path(settings.UPLOAD_DIR) / temp_filename
        temp_path.parent.mkdir(parents=True, exist_ok=True)

        with open(temp_path, "wb") as f:
            f.write(file_content)

        # Process the uploaded file
        result = await document_service.process_uploaded_file(
            file_path=str(temp_path),
            filename=file.filename,
            mime_type=file.content_type or "application/pdf"
        )

        # Clean up temp file
        try:
            temp_path.unlink()
        except Exception:
            logger.warning("Failed to clean up temp file", path=str(temp_path))

        if result["success"]:
            logger.info(
                "Document processed successfully",
                document_id=result["document_id"],
                filename=file.filename,
                chunks=result.get("chunks_created", 0)
            )

            return {
                "success": True,
                "document_id": result["document_id"],
                "filename": result["filename"],
                "chunks_created": result.get("chunks_created", 0),
                "total_tokens": result.get("total_tokens", 0),
                "processing_time": result.get("processing_time", 0),
                "pages": result.get("pages", 0),
                "message": "Document processed successfully"
            }
        else:
            logger.error(
                "Document processing failed",
                filename=file.filename,
                error=result.get("error", "Unknown error")
            )

            raise HTTPException(
                status_code=500,
                detail=f"Document processing failed: {result.get('error', 'Unknown error')}"
            )

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error during document upload", error=str(e), filename=file.filename)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/")
async def list_documents(
    status: Optional[str] = Query(None, description="Filter by processing status"),
    limit: int = Query(50, description="Maximum number of documents to return"),
    offset: int = Query(0, description="Number of documents to skip"),
    document_service: DocumentService = Depends(get_document_service),
    logger=Depends(get_logger),
):
    """
    List documents.

    Returns a list of documents with optional filtering and pagination.
    """
    logger.info("Document list requested", status=status, limit=limit, offset=offset)

    try:
        from app.models.documents import Document

        # Build query
        query = document_service.db.query(Document)

        if status:
            query = query.filter(Document.processing_status == status)

        # Get total count
        total = query.count()

        # Get paginated results
        documents = query.order_by(Document.created_at.desc())\
            .offset(offset)\
            .limit(limit)\
            .all()

        # Convert to dict format
        document_list = []
        for doc in documents:
            document_list.append({
                "id": doc.id,
                "filename": doc.filename,
                "file_size": doc.file_size,
                "mime_type": doc.mime_type,
                "processing_status": doc.processing_status,
                "num_pages": doc.num_pages,
                "total_chunks": doc.total_chunks,
                "estimated_tokens": doc.estimated_tokens,
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
                "processing_started_at": doc.processing_started_at.isoformat() if doc.processing_started_at else None,
                "processing_completed_at": doc.processing_completed_at.isoformat() if doc.processing_completed_at else None,
            })

        logger.info("Documents retrieved", total=total, returned=len(document_list))

        return {
            "documents": document_list,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    except Exception as e:
        logger.error("Failed to list documents", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve documents: {str(e)}")


@router.get("/{document_id}")
async def get_document(
    document_id: str,
    include_chunks: bool = Query(False, description="Include document chunks in response"),
    chunk_limit: int = Query(100, description="Maximum number of chunks to return"),
    document_service: DocumentService = Depends(get_document_service),
    logger=Depends(get_logger),
):
    """
    Get document details.

    Returns detailed information about a specific document, optionally including chunks.
    """
    logger.info("Document details requested", document_id=document_id, include_chunks=include_chunks)

    try:
        document = document_service.get_document(document_id)

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Build response
        response = {
            "id": document.id,
            "filename": document.filename,
            "original_path": document.original_path,
            "processed_path": document.processed_path,
            "file_size": document.file_size,
            "mime_type": document.mime_type,
            "processing_status": document.processing_status,
            "processing_error": document.processing_error,
            "title": document.title,
            "author": document.author,
            "subject": document.subject,
            "creator": document.creator,
            "producer": document.producer,
            "num_pages": document.num_pages,
            "creation_date": document.creation_date.isoformat() if document.creation_date else None,
            "modification_date": document.modification_date.isoformat() if document.modification_date else None,
            "total_text_length": document.total_text_length,
            "total_chunks": document.total_chunks,
            "estimated_tokens": document.estimated_tokens,
            "created_at": document.created_at.isoformat() if document.created_at else None,
            "updated_at": document.updated_at.isoformat() if document.updated_at else None,
            "processing_started_at": document.processing_started_at.isoformat() if document.processing_started_at else None,
            "processing_completed_at": document.processing_completed_at.isoformat() if document.processing_completed_at else None,
        }

        # Include chunks if requested
        if include_chunks:
            chunks = document_service.get_document_chunks(document_id, limit=chunk_limit)
            response["chunks"] = [
                {
                    "id": chunk.id,
                    "chunk_index": chunk.chunk_index,
                    "chunk_id": chunk.chunk_id,
                    "content": chunk.content,
                    "word_count": chunk.word_count,
                    "token_estimate": chunk.token_estimate,
                    "page_number": chunk.page_number,
                    "start_position": chunk.start_position,
                    "end_position": chunk.end_position,
                    "created_at": chunk.created_at.isoformat() if chunk.created_at else None,
                }
                for chunk in chunks
            ]

        logger.info("Document retrieved", document_id=document_id, chunks=len(response.get("chunks", [])))

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get document", document_id=document_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve document: {str(e)}")


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    document_service: DocumentService = Depends(get_document_service),
    logger=Depends(get_logger),
):
    """
    Delete a document.

    Removes a document and all its associated data.
    """
    logger.info("Document deletion requested", document_id=document_id)

    try:
        # Check if document exists
        document = document_service.get_document(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Delete the document
        success = document_service.delete_document(document_id)

        if success:
            logger.info("Document deleted successfully", document_id=document_id)
            return {
                "success": True,
                "message": "Document deleted successfully",
                "document_id": document_id
            }
        else:
            logger.error("Failed to delete document", document_id=document_id)
            raise HTTPException(status_code=500, detail="Failed to delete document")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error during document deletion", document_id=document_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Delete operation failed: {str(e)}")


@router.post("/{document_id}/retry")
async def retry_document_processing(
    document_id: str,
    document_service: DocumentService = Depends(get_document_service),
    logger=Depends(get_logger),
):
    """
    Retry processing a failed document.

    Resets the document status and schedules it for reprocessing.
    """
    logger.info("Document retry requested", document_id=document_id)

    try:
        result = document_service.retry_failed_processing(document_id)

        if result["success"]:
            logger.info("Document retry scheduled", document_id=document_id, job_id=result.get("job_id"))
            return result
        else:
            logger.warning("Document retry failed", document_id=document_id, error=result.get("error"))
            raise HTTPException(status_code=400, detail=result.get("error", "Retry failed"))

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error during document retry", document_id=document_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Retry operation failed: {str(e)}")
