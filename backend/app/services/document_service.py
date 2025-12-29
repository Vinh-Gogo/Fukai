"""
Document processing service that coordinates PDF processing and database operations.

This service handles the complete document processing pipeline from upload to
chunk storage, including progress tracking and error handling.
"""

import uuid
import structlog
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime

from sqlalchemy.orm import Session

from app.services.pdf_processor import PDFProcessorService, PDFProcessingResult, PDFMetadata, TextChunk
from app.services.embedding_service import EmbeddingService
from app.models.documents import Document, DocumentChunk, ProcessingJob
from app.config.settings import settings


class DocumentService:
    """Service for managing document processing operations."""

    def __init__(self, db_session: Session, logger: structlog.BoundLogger):
        self.db = db_session
        self.logger = logger
        self.pdf_processor = PDFProcessorService(logger)
        self.embedding_service = EmbeddingService(logger)

    async def process_uploaded_file(
        self,
        file_path: str,
        filename: str,
        mime_type: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process an uploaded file and store the results in the database.

        Args:
            file_path: Path to the uploaded file
            filename: Original filename
            mime_type: MIME type of the file
            user_id: ID of the user who uploaded the file

        Returns:
            Dictionary with processing results and document ID
        """
        document_id = str(uuid.uuid4())

        try:
            self.logger.info("Starting document processing", document_id=document_id, filename=filename)

            # Create initial document record
            document = Document(
                id=document_id,
                filename=filename,
                original_path=file_path,
                file_size=Path(file_path).stat().st_size,
                mime_type=mime_type,
                processing_status="processing",
                processing_started_at=datetime.utcnow()
            )

            self.db.add(document)
            self.db.commit()

            # Create processing job
            job = ProcessingJob(
                id=str(uuid.uuid4()),
                document_id=document_id,
                job_type="pdf_processing",
                status="running",
                current_step="text_extraction",
                total_steps=3,  # extraction, chunking, storage
                started_at=datetime.utcnow(),
                created_by=user_id
            )

            self.db.add(job)
            self.db.commit()

            # Process the PDF
            result = self.pdf_processor.process_pdf(file_path)

            if result.success:
                # Update document with metadata
                document.title = result.metadata.title
                document.author = result.metadata.author
                document.subject = result.metadata.subject
                document.creator = result.metadata.creator
                document.producer = result.metadata.producer
                document.num_pages = result.metadata.num_pages
                document.creation_date = result.metadata.creation_date
                document.modification_date = result.metadata.modification_date
                document.total_text_length = result.total_text_length
                document.total_chunks = result.total_chunks
                document.estimated_tokens = sum(chunk.token_estimate for chunk in result.chunks)

                # Create chunk records
                chunk_dicts = []
                for i, chunk in enumerate(result.chunks):
                    chunk_record = DocumentChunk(
                        id=str(uuid.uuid4()),
                        document_id=document_id,
                        chunk_index=i,
                        chunk_id=chunk.chunk_id,
                        content=chunk.content,
                        word_count=chunk.word_count,
                        token_estimate=chunk.token_estimate,
                        page_number=chunk.page_number,
                        start_position=chunk.start_position,
                        end_position=chunk.end_position
                    )
                    self.db.add(chunk_record)

                    # Prepare chunk data for embedding
                    chunk_dicts.append({
                        'chunk_id': chunk.chunk_id,
                        'content': chunk.content,
                        'page_number': chunk.page_number,
                        'word_count': chunk.word_count,
                        'token_estimate': chunk.token_estimate,
                        'start_position': chunk.start_position,
                        'end_position': chunk.end_position
                    })

                # Generate and store embeddings
                try:
                    self.logger.info("Generating embeddings", document_id=document_id, chunks=len(chunk_dicts))

                    # Initialize embedding service if needed
                    await self.embedding_service.initialize()

                    # Generate and store embeddings
                    embedding_result = await self.embedding_service.store_chunk_embeddings(
                        document_id, chunk_dicts
                    )

                    if embedding_result['success']:
                        self.logger.info("Embeddings generated successfully",
                                       document_id=document_id, vectors=embedding_result['vectors_stored'])
                    else:
                        self.logger.warning("Embedding generation failed",
                                          document_id=document_id, error=embedding_result.get('error'))

                except Exception as embed_error:
                    self.logger.warning("Embedding generation failed",
                                      document_id=document_id, error=str(embed_error))
                    # Don't fail the entire process if embeddings fail

                # Update status
                document.processing_status = "completed"
                document.processing_completed_at = datetime.utcnow()

                job.status = "completed"
                job.progress_percentage = 100.0
                job.completed_at = datetime.utcnow()

                self.db.commit()

                self.logger.info(
                    "Document processing completed",
                    document_id=document_id,
                    chunks=result.total_chunks,
                    tokens=document.estimated_tokens
                )

                return {
                    "success": True,
                    "document_id": document_id,
                    "filename": filename,
                    "chunks_created": result.total_chunks,
                    "total_tokens": document.estimated_tokens,
                    "processing_time": result.processing_time,
                    "pages": result.metadata.num_pages
                }

            else:
                # Handle processing failure
                error_msg = result.error_message or "Unknown processing error"
                document.processing_status = "failed"
                document.processing_error = error_msg
                document.processing_completed_at = datetime.utcnow()

                job.status = "failed"
                job.error_message = error_msg
                job.completed_at = datetime.utcnow()

                self.db.commit()

                self.logger.error(
                    "Document processing failed",
                    document_id=document_id,
                    error=error_msg
                )

                return {
                    "success": False,
                    "document_id": document_id,
                    "error": error_msg,
                    "filename": filename
                }

        except Exception as e:
            # Handle unexpected errors
            error_msg = f"Unexpected error during processing: {str(e)}"

            # Update document status if it exists
            if 'document' in locals():
                document.processing_status = "failed"
                document.processing_error = error_msg
                document.processing_completed_at = datetime.utcnow()

            # Update job status if it exists
            if 'job' in locals():
                job.status = "failed"
                job.error_message = error_msg
                job.completed_at = datetime.utcnow()

            self.db.commit()

            self.logger.error(
                "Unexpected error in document processing",
                document_id=document_id,
                error=str(e)
            )

            return {
                "success": False,
                "document_id": document_id,
                "error": error_msg,
                "filename": filename
            }

    def get_document(self, document_id: str) -> Optional[Document]:
        """Retrieve a document by ID."""
        return self.db.query(Document).filter(Document.id == document_id).first()

    def get_document_chunks(self, document_id: str, limit: Optional[int] = None, offset: Optional[int] = None) -> List[DocumentChunk]:
        """Retrieve chunks for a document."""
        query = self.db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id)

        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)

        return query.order_by(DocumentChunk.chunk_index).all()

    def get_processing_jobs(self, status: Optional[str] = None, limit: int = 50) -> List[ProcessingJob]:
        """Get processing jobs with optional status filter."""
        query = self.db.query(ProcessingJob)

        if status:
            query = query.filter(ProcessingJob.status == status)

        return query.order_by(ProcessingJob.created_at.desc()).limit(limit).all()

    def update_job_progress(self, job_id: str, progress: float, current_step: Optional[str] = None) -> bool:
        """Update the progress of a processing job."""
        try:
            job = self.db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            if job:
                job.progress_percentage = progress
                if current_step:
                    job.current_step = current_step
                job.updated_at = datetime.utcnow()
                self.db.commit()
                return True
            return False
        except Exception as e:
            self.logger.error("Failed to update job progress", job_id=job_id, error=str(e))
            return False

    def delete_document(self, document_id: str) -> bool:
        """Delete a document and all its associated data."""
        try:
            # Delete chunks first (cascade should handle this, but being explicit)
            self.db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()

            # Delete processing jobs
            self.db.query(ProcessingJob).filter(ProcessingJob.document_id == document_id).delete()

            # Delete document
            result = self.db.query(Document).filter(Document.id == document_id).delete()

            self.db.commit()
            return result > 0

        except Exception as e:
            self.logger.error("Failed to delete document", document_id=document_id, error=str(e))
            self.db.rollback()
            return False

    def get_documents_by_status(self, status: str, limit: int = 100) -> List[Document]:
        """Get documents by processing status."""
        return self.db.query(Document)\
            .filter(Document.processing_status == status)\
            .order_by(Document.created_at.desc())\
            .limit(limit)\
            .all()

    def get_failed_documents(self, limit: int = 50) -> List[Document]:
        """Get documents that failed processing."""
        return self.db.query(Document)\
            .filter(Document.processing_status == "failed")\
            .order_by(Document.created_at.desc())\
            .limit(limit)\
            .all()

    def retry_failed_processing(self, document_id: str) -> Dict[str, Any]:
        """Retry processing a failed document."""
        try:
            document = self.get_document(document_id)
            if not document:
                return {"success": False, "error": "Document not found"}

            if document.processing_status != "failed":
                return {"success": False, "error": "Document is not in failed state"}

            # Reset document status
            document.processing_status = "pending"
            document.processing_error = None
            document.processing_started_at = None
            document.processing_completed_at = None

            # Create new processing job
            job = ProcessingJob(
                id=str(uuid.uuid4()),
                document_id=document_id,
                job_type="pdf_processing",
                status="pending",
                current_step="retry",
                created_by=None  # Could be passed in
            )

            self.db.add(job)
            self.db.commit()

            self.logger.info("Retry processing scheduled", document_id=document_id, job_id=job.id)

            return {
                "success": True,
                "document_id": document_id,
                "job_id": job.id,
                "message": "Retry processing scheduled"
            }

        except Exception as e:
            self.logger.error("Failed to schedule retry", document_id=document_id, error=str(e))
            return {"success": False, "error": str(e)}
