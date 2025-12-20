"""
Document model for processed PDFs and RAG content
"""
from typing import Optional
import uuid
from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from .base import BaseModel


class ProcessingStatus(str, enum.Enum):
    """Document processing status"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(BaseModel):
    """Document model for PDF processing and RAG"""

    __tablename__ = "documents"

    # Foreign Key to User (for access control)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    # File metadata
    filename = Column(String, nullable=False)
    original_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)  # in bytes

    # Processing metadata
    status = Column(Enum(ProcessingStatus), default=ProcessingStatus.UPLOADED, nullable=False)
    processing_error = Column(Text, nullable=True)

    # Processed content
    markdown_content = Column(Text, nullable=True)
    content_length = Column(Integer, nullable=True)  # character count

    # Vector database metadata
    qdrant_collection = Column(String, nullable=True)
    embedding_count = Column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="documents")

    @classmethod
    def create(cls, user_id: str, filename: str, original_path: str, file_size: Optional[int] = None) -> "Document":
        """Create a new document with generated ID"""
        return cls(
            id=str(uuid.uuid4()),
            user_id=user_id,
            filename=filename,
            original_path=original_path,
            file_size=file_size,
            status=ProcessingStatus.UPLOADED
        )

    def mark_processing_started(self):
        """Mark document as being processed"""
        self.status = ProcessingStatus.PROCESSING

    def mark_processing_completed(self, markdown_content: str, embedding_count: int = 0):
        """Mark document processing as completed"""
        self.status = ProcessingStatus.COMPLETED
        self.markdown_content = markdown_content
        self.content_length = len(markdown_content) if markdown_content else 0
        self.embedding_count = embedding_count

    def mark_processing_failed(self, error: str):
        """Mark document processing as failed"""
        self.status = ProcessingStatus.FAILED
        self.processing_error = error

    def __repr__(self):
        return f"<Document(id={self.id}, filename={self.filename}, status={self.status})>"
