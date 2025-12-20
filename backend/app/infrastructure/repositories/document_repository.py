"""
Document repository for database operations
"""
from typing import Optional, List
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from .base import BaseRepository
from ..models.document import Document, ProcessingStatus


class DocumentRepository(BaseRepository[Document]):
    """Repository for Document model operations"""

    @property
    def model_class(self):
        return Document

    async def get_by_user_id(self, user_id: str, limit: Optional[int] = None, offset: Optional[int] = 0) -> List[Document]:
        """
        Get documents for a specific user

        Args:
            user_id: User ID
            limit: Maximum number of documents
            offset: Number of documents to skip

        Returns:
            List of user's documents
        """
        session = await self._get_session()
        query = select(Document).where(Document.user_id == user_id).order_by(desc(Document.created_at))

        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)

        result = await session.execute(query)
        return list(result.scalars().all())

    async def get_by_user_and_filename(self, user_id: str, filename: str) -> Optional[Document]:
        """
        Get document by user ID and filename

        Args:
            user_id: User ID
            filename: Document filename

        Returns:
            Document if found, None otherwise
        """
        session = await self._get_session()
        result = await session.execute(
            select(Document).where(
                and_(Document.user_id == user_id, Document.filename == filename)
            )
        )
        return result.scalar_one_or_none()

    async def get_by_status(self, status: ProcessingStatus, user_id: Optional[str] = None) -> List[Document]:
        """
        Get documents by processing status

        Args:
            status: Processing status
            user_id: Optional user ID filter

        Returns:
            List of documents with the specified status
        """
        session = await self._get_session()
        query = select(Document).where(Document.status == status)

        if user_id:
            query = query.where(Document.user_id == user_id)

        query = query.order_by(desc(Document.created_at))
        result = await session.execute(query)
        return list(result.scalars().all())

    async def get_processing_documents(self, user_id: Optional[str] = None) -> List[Document]:
        """
        Get documents currently being processed

        Args:
            user_id: Optional user ID filter

        Returns:
            List of documents in processing status
        """
        return await self.get_by_status(ProcessingStatus.PROCESSING, user_id)

    async def get_failed_documents(self, user_id: Optional[str] = None) -> List[Document]:
        """
        Get documents that failed processing

        Args:
            user_id: Optional user ID filter

        Returns:
            List of failed documents
        """
        return await self.get_by_status(ProcessingStatus.FAILED, user_id)

    async def get_completed_documents(self, user_id: Optional[str] = None) -> List[Document]:
        """
        Get documents that completed processing

        Args:
            user_id: Optional user ID filter

        Returns:
            List of completed documents
        """
        return await self.get_by_status(ProcessingStatus.COMPLETED, user_id)

    async def update_processing_status(self, document_id: str, status: ProcessingStatus,
                                     error: Optional[str] = None) -> Optional[Document]:
        """
        Update document processing status

        Args:
            document_id: Document ID
            status: New processing status
            error: Error message (for failed status)

        Returns:
            Updated document if found, None otherwise
        """
        update_data = {"status": status}
        if error and status == ProcessingStatus.FAILED:
            update_data["processing_error"] = error

        return await self.update(document_id, **update_data)

    async def mark_processing_started(self, document_id: str) -> Optional[Document]:
        """
        Mark document as processing started

        Args:
            document_id: Document ID

        Returns:
            Updated document if found, None otherwise
        """
        return await self.update_processing_status(document_id, ProcessingStatus.PROCESSING)

    async def mark_processing_completed(self, document_id: str, markdown_content: str,
                                      embedding_count: int = 0) -> Optional[Document]:
        """
        Mark document processing as completed

        Args:
            document_id: Document ID
            markdown_content: Processed markdown content
            embedding_count: Number of embeddings created

        Returns:
            Updated document if found, None otherwise
        """
        return await self.update(
            document_id,
            status=ProcessingStatus.COMPLETED,
            markdown_content=markdown_content,
            content_length=len(markdown_content) if markdown_content else 0,
            embedding_count=embedding_count
        )

    async def mark_processing_failed(self, document_id: str, error: str) -> Optional[Document]:
        """
        Mark document processing as failed

        Args:
            document_id: Document ID
            error: Error message

        Returns:
            Updated document if found, None otherwise
        """
        return await self.update_processing_status(document_id, ProcessingStatus.FAILED, error)

    async def search_by_filename(self, user_id: str, filename_pattern: str, limit: Optional[int] = None) -> List[Document]:
        """
        Search documents by filename pattern

        Args:
            user_id: User ID
            filename_pattern: Filename search pattern
            limit: Maximum number of results

        Returns:
            List of matching documents
        """
        session = await self._get_session()
        query = select(Document).where(
            and_(
                Document.user_id == user_id,
                Document.filename.ilike(f"%{filename_pattern}%")
            )
        ).order_by(desc(Document.created_at))

        if limit:
            query = query.limit(limit)

        result = await session.execute(query)
        return list(result.scalars().all())

    async def get_user_statistics(self, user_id: str) -> dict:
        """
        Get document statistics for a user

        Args:
            user_id: User ID

        Returns:
            Dictionary with document statistics
        """
        session = await self._get_session()

        # Count by status
        status_counts = {}
        for status in ProcessingStatus:
            result = await session.execute(
                select(Document).where(
                    and_(Document.user_id == user_id, Document.status == status)
                )
            )
            status_counts[status.value] = len(result.scalars().all())

        # Total file size
        result = await session.execute(
            select(Document.file_size).where(
                and_(Document.user_id == user_id, Document.file_size.isnot(None))
            )
        )
        total_size = sum(size for size in result.scalars() if size)

        # Total embedding count
        result = await session.execute(
            select(Document.embedding_count).where(Document.user_id == user_id)
        )
        total_embeddings = sum(count for count in result.scalars() if count)

        return {
            "total_documents": sum(status_counts.values()),
            "status_counts": status_counts,
            "total_file_size": total_size,
            "total_embeddings": total_embeddings
        }
