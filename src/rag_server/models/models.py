from __future__ import annotations

from datetime import datetime
from typing import List

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class WebURL(Base):
    __tablename__ = "web_url"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    url: Mapped[str] = mapped_column(String(2048), unique=True, nullable=False)
    list_page: Mapped[list] = mapped_column(JSON, default=list)
    list_pdf_url: Mapped[list] = mapped_column(JSON, default=list)
    count_list_pdf_url: Mapped[int] = mapped_column(Integer, default=0)

    pdfs: Mapped[List["PDF"]] = relationship("PDF", back_populates="web_url", cascade="all, delete-orphan")


class PDF(Base):
    __tablename__ = "pdf"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pdf_url: Mapped[str] = mapped_column(String(2048), unique=True, nullable=False)
    web_url_id: Mapped[int] = mapped_column(ForeignKey("web_url.id"), nullable=True)
    time_crawl: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    web_url: Mapped[WebURL] = relationship("WebURL", back_populates="pdfs")
    crawl_sessions: Mapped[List["CrawlSession"]] = relationship("CrawlSession", back_populates="pdf", cascade="all, delete-orphan")
    process_sessions: Mapped[List["ProcessSession"]] = relationship("ProcessSession", back_populates="pdf", cascade="all, delete-orphan")


class CrawlSession(Base):
    __tablename__ = "crawl_session"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pdf_id: Mapped[int] = mapped_column(ForeignKey("pdf.id"), nullable=False)
    is_download: Mapped[bool] = mapped_column(Boolean, default=False)
    download_path: Mapped[str] = mapped_column(String(4096), nullable=True)

    pdf: Mapped[PDF] = relationship("PDF", back_populates="crawl_sessions")


class ProcessSession(Base):
    __tablename__ = "process_session"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pdf_id: Mapped[int] = mapped_column(ForeignKey("pdf.id"), nullable=False)
    is_process: Mapped[bool] = mapped_column(Boolean, default=False)
    markdown_path: Mapped[str] = mapped_column(String(4096), nullable=True)

    pdf: Mapped[PDF] = relationship("PDF", back_populates="process_sessions")

class CrawlerExecution(Base):
    __tablename__ = "crawler_execution"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    api_endpoint: Mapped[str] = mapped_column(String(256), nullable=False)  # e.g., "scan", "download", "status"
    execution_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    success: Mapped[bool] = mapped_column(Boolean, default=False)
    error_message: Mapped[str] = mapped_column(String(4096), nullable=True)
    parameters: Mapped[dict] = mapped_column(JSON, nullable=True)  # Store input parameters
    result_summary: Mapped[dict] = mapped_column(JSON, nullable=True)  # Store summary of results
    execution_duration: Mapped[float] = mapped_column(Integer, nullable=True)  # Duration in seconds

class Activity(Base):
    __tablename__ = "activity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    activity_type: Mapped[str] = mapped_column(String(256), nullable=False)  # e.g., "web_url_created", "pdf_downloaded"
    entity_type: Mapped[str] = mapped_column(String(256), nullable=False)  # e.g., "WebURL", "PDF", "CrawlerExecution"
    entity_id: Mapped[int] = mapped_column(Integer, nullable=True)  # ID of the affected entity
    action: Mapped[str] = mapped_column(String(256), nullable=False)  # e.g., "created", "updated", "deleted"
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user_id: Mapped[str] = mapped_column(String(256), nullable=True)  # Could be API key or user identifier
    details: Mapped[dict] = mapped_column(JSON, nullable=True)  # Additional context about the activity
    ip_address: Mapped[str] = mapped_column(String(256), nullable=True)  # Client IP if available
    user_agent: Mapped[str] = mapped_column(String(4096), nullable=True)  # Client user agent
