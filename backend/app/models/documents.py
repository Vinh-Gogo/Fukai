"""
Database models for document processing and storage.

This module defines SQLAlchemy models for storing processed documents,
their metadata, and text chunks for RAG applications.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
from typing import List

Base = declarative_base()


class Document(Base):
    """Model for storing processed documents."""
    __tablename__ = "documents"

    id = Column(String, primary_key=True)  # UUID or unique identifier
    filename = Column(String, nullable=False)
    original_path = Column(String, nullable=False)
    processed_path = Column(String, nullable=True)  # Path after processing
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)

    # Processing status
    processing_status = Column(String, default="pending")  # pending, processing, completed, failed
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)
    processing_error = Column(Text, nullable=True)

    # Document metadata
    title = Column(String, nullable=True)
    author = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    creator = Column(String, nullable=True)
    producer = Column(String, nullable=True)
    num_pages = Column(Integer, nullable=True)
    creation_date = Column(DateTime, nullable=True)
    modification_date = Column(DateTime, nullable=True)

    # Extracted content stats
    total_text_length = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    estimated_tokens = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

    # Indexes for performance
    __table_args__ = (
        Index('idx_documents_status', 'processing_status'),
        Index('idx_documents_created', 'created_at'),
        Index('idx_documents_filename', 'filename'),
    )

    def __repr__(self):
        return f"<Document(id='{self.id}', filename='{self.filename}', status='{self.processing_status}')>"


class DocumentChunk(Base):
    """Model for storing document text chunks."""
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True)  # UUID or unique identifier
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)  # Position in document
    chunk_id = Column(String, nullable=False)  # Internal chunk identifier

    # Content
    content = Column(Text, nullable=False)
    word_count = Column(Integer, nullable=False)
    token_estimate = Column(Integer, nullable=False)

    # Position in original document
    page_number = Column(Integer, nullable=False)
    start_position = Column(Integer, nullable=False)
    end_position = Column(Integer, nullable=False)

    # Embedding and search data (for future RAG implementation)
    embedding_status = Column(String, default="pending")  # pending, processing, completed, failed
    embedding_vector = Column(Text, nullable=True)  # JSON serialized vector
    embedding_model = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="chunks")

    # Indexes for performance
    __table_args__ = (
        Index('idx_chunks_document', 'document_id'),
        Index('idx_chunks_page', 'page_number'),
        Index('idx_chunks_embedding', 'embedding_status'),
        Index('idx_chunks_position', 'page_number', 'start_position'),
    )

    def __repr__(self):
        return f"<DocumentChunk(id='{self.id}', document_id='{self.document_id}', page={self.page_number}, words={self.word_count})>"


class ProcessingJob(Base):
    """Model for tracking document processing jobs."""
    __tablename__ = "processing_jobs"

    id = Column(String, primary_key=True)  # UUID
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)

    # Job details
    job_type = Column(String, nullable=False)  # "pdf_processing", "text_extraction", "chunking", "embedding"
    status = Column(String, default="pending")  # pending, running, completed, failed, cancelled

    # Progress tracking
    progress_percentage = Column(Float, default=0.0)
    current_step = Column(String, nullable=True)
    total_steps = Column(Integer, default=1)

    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)

    # Timing
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    estimated_completion = Column(DateTime, nullable=True)

    # Metadata
    priority = Column(Integer, default=0)  # Higher numbers = higher priority
    created_by = Column(String, nullable=True)  # User who initiated the job

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    document = relationship("Document")

    # Indexes
    __table_args__ = (
        Index('idx_jobs_status', 'status'),
        Index('idx_jobs_type', 'job_type'),
        Index('idx_jobs_document', 'document_id'),
        Index('idx_jobs_priority', 'priority', 'created_at'),
        Index('idx_jobs_created', 'created_at'),
    )

    def __repr__(self):
        return f"<ProcessingJob(id='{self.id}', type='{self.job_type}', status='{self.status}', progress={self.progress_percentage}%)>"


class DocumentCollection(Base):
    """Model for organizing documents into collections."""
    __tablename__ = "document_collections"

    id = Column(String, primary_key=True)  # UUID
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Collection settings
    is_public = Column(Boolean, default=False)
    owner_id = Column(String, nullable=True)

    # Statistics
    document_count = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_collections_owner', 'owner_id'),
        Index('idx_collections_public', 'is_public'),
        Index('idx_collections_name', 'name'),
    )

    def __repr__(self):
        return f"<DocumentCollection(id='{self.id}', name='{self.name}', docs={self.document_count})>"


class CollectionDocument(Base):
    """Many-to-many relationship between collections and documents."""
    __tablename__ = "collection_documents"

    id = Column(String, primary_key=True)  # UUID
    collection_id = Column(String, ForeignKey("document_collections.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)

    # Position in collection (for ordering)
    position = Column(Integer, default=0)

    # Timestamps
    added_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    collection = relationship("DocumentCollection")
    document = relationship("Document")

    # Indexes
    __table_args__ = (
        Index('idx_collection_docs', 'collection_id', 'document_id'),
        Index('idx_collection_position', 'collection_id', 'position'),
    )

    def __repr__(self):
        return f"<CollectionDocument(collection='{self.collection_id}', document='{self.document_id}')>"
