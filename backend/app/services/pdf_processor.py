"""
PDF processing service for text extraction and document chunking.

This module provides functionality to extract text from PDF files and split
the content into manageable chunks for RAG applications.
"""

import fitz  # PyMuPDF
import structlog
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass
import re
from datetime import datetime


@dataclass
class PDFMetadata:
    """Metadata extracted from a PDF document."""
    filename: str
    file_path: str
    num_pages: int
    title: Optional[str]
    author: Optional[str]
    subject: Optional[str]
    creator: Optional[str]
    producer: Optional[str]
    creation_date: Optional[datetime]
    modification_date: Optional[datetime]
    file_size: int
    processing_timestamp: datetime


@dataclass
class TextChunk:
    """A chunk of text with metadata."""
    content: str
    chunk_id: str
    page_number: int
    start_position: int
    end_position: int
    word_count: int
    token_estimate: int


@dataclass
class PDFProcessingResult:
    """Result of PDF processing operation."""
    success: bool
    metadata: PDFMetadata
    chunks: List[TextChunk]
    total_text_length: int
    total_chunks: int
    processing_time: float
    error_message: Optional[str] = None


class PDFProcessorService:
    """Service for processing PDF documents."""

    def __init__(self, logger: structlog.BoundLogger):
        self.logger = logger
        self.chunk_size = 1000  # characters
        self.chunk_overlap = 200  # characters

    def extract_text_from_pdf(self, file_path: str) -> Tuple[str, Dict[str, Any]]:
        """
        Extract text from PDF file.

        Args:
            file_path: Path to the PDF file

        Returns:
            Tuple of (extracted_text, metadata_dict)
        """
        try:
            doc = fitz.open(file_path)
            text = ""
            metadata = {}

            # Extract metadata
            info = doc.metadata
            metadata = {
                'title': info.get('title'),
                'author': info.get('author'),
                'subject': info.get('subject'),
                'creator': info.get('creator'),
                'producer': info.get('producer'),
                'creation_date': info.get('creationDate'),
                'modification_date': info.get('modDate'),
                'num_pages': len(doc),
            }

            # Extract text from all pages
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text()
                text += f"\n--- Page {page_num + 1} ---\n{page_text}"

            doc.close()
            return text, metadata

        except Exception as e:
            self.logger.error("Failed to extract text from PDF", file_path=file_path, error=str(e))
            raise

    def chunk_text(
        self,
        text: str,
        chunk_size: Optional[int] = None,
        overlap: Optional[int] = None
    ) -> List[TextChunk]:
        """
        Split text into overlapping chunks.

        Args:
            text: Full text to chunk
            chunk_size: Size of each chunk in characters
            overlap: Number of characters to overlap between chunks

        Returns:
            List of TextChunk objects
        """
        chunk_size = chunk_size or self.chunk_size
        overlap = overlap or self.chunk_overlap

        chunks = []
        start = 0
        chunk_id = 0

        # Split text by pages first
        pages = text.split('\n--- Page ')
        page_texts = []

        for i, page_content in enumerate(pages):
            if i == 0:  # First part doesn't have page marker
                if page_content.strip():
                    page_texts.append((1, page_content.strip()))
            else:
                # Extract page number and content
                lines = page_content.split('\n', 1)
                if len(lines) >= 2:
                    page_num_str = lines[0].replace(' ---', '').strip()
                    try:
                        page_num = int(page_num_str)
                        content = lines[1].strip()
                        if content:
                            page_texts.append((page_num, content))
                    except ValueError:
                        continue

        # Process each page
        for page_num, page_text in page_texts:
            # Clean up the text
            page_text = self._clean_text(page_text)

            if not page_text:
                continue

            # Split page into chunks
            page_chunks = self._chunk_page_text(page_text, page_num, chunk_size, overlap)

            for chunk in page_chunks:
                chunk.chunk_id = f"chunk_{chunk_id}"
                chunks.append(chunk)
                chunk_id += 1

        return chunks

    def _chunk_page_text(
        self,
        page_text: str,
        page_num: int,
        chunk_size: int,
        overlap: int
    ) -> List[TextChunk]:
        """Chunk text from a single page."""
        chunks = []
        start = 0

        while start < len(page_text):
            # Find chunk end
            end = start + chunk_size

            # Try to end at sentence boundary
            if end < len(page_text):
                # Look for sentence endings within the last 100 characters
                sentence_endings = ['. ', '! ', '? ', '\n\n']
                best_end = end

                for ending in sentence_endings:
                    last_ending = page_text.rfind(ending, start, end + 100)
                    if last_ending != -1 and last_ending > best_end - 200:
                        best_end = last_ending + len(ending)
                        break

                end = best_end

            chunk_text = page_text[start:end].strip()

            if chunk_text:
                # Estimate token count (rough approximation)
                token_estimate = len(chunk_text.split()) * 1.3  # Rough token estimation

                chunk = TextChunk(
                    content=chunk_text,
                    chunk_id="",  # Will be set by caller
                    page_number=page_num,
                    start_position=start,
                    end_position=end,
                    word_count=len(chunk_text.split()),
                    token_estimate=int(token_estimate)
                )
                chunks.append(chunk)

            # Move start position with overlap
            start = end - overlap
            if start >= len(page_text):
                break

        return chunks

    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        # Remove excessive whitespace
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)

        # Remove page headers/footers that might be OCR artifacts
        # This is a simple implementation - could be enhanced
        lines = text.split('\n')
        cleaned_lines = []

        for line in lines:
            line = line.strip()
            # Skip very short lines that might be headers/footers
            if len(line) > 3 or not line.isdigit():
                cleaned_lines.append(line)

        return '\n'.join(cleaned_lines).strip()

    def process_pdf(self, file_path: str) -> PDFProcessingResult:
        """
        Process a PDF file: extract text and create chunks.

        Args:
            file_path: Path to the PDF file

        Returns:
            PDFProcessingResult with extracted data
        """
        import time
        start_time = time.time()

        try:
            self.logger.info("Starting PDF processing", file_path=file_path)

            # Extract text and metadata
            text, metadata = self.extract_text_from_pdf(file_path)

            # Create metadata object
            file_path_obj = Path(file_path)
            pdf_metadata = PDFMetadata(
                filename=file_path_obj.name,
                file_path=str(file_path_obj),
                num_pages=metadata.get('num_pages', 0),
                title=metadata.get('title'),
                author=metadata.get('author'),
                subject=metadata.get('subject'),
                creator=metadata.get('creator'),
                producer=metadata.get('producer'),
                creation_date=self._parse_pdf_date(metadata.get('creation_date')),
                modification_date=self._parse_pdf_date(metadata.get('modification_date')),
                file_size=file_path_obj.stat().st_size,
                processing_timestamp=datetime.now()
            )

            # Create chunks
            chunks = self.chunk_text(text)

            processing_time = time.time() - start_time

            result = PDFProcessingResult(
                success=True,
                metadata=pdf_metadata,
                chunks=chunks,
                total_text_length=len(text),
                total_chunks=len(chunks),
                processing_time=processing_time
            )

            self.logger.info(
                "PDF processing completed",
                file_path=file_path,
                pages=pdf_metadata.num_pages,
                chunks=len(chunks),
                text_length=len(text),
                processing_time=processing_time
            )

            return result

        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f"PDF processing failed: {str(e)}"

            self.logger.error(
                "PDF processing failed",
                file_path=file_path,
                error=str(e),
                processing_time=processing_time
            )

            return PDFProcessingResult(
                success=False,
                metadata=PDFMetadata(
                    filename=Path(file_path).name,
                    file_path=file_path,
                    num_pages=0,
                    title=None,
                    author=None,
                    subject=None,
                    creator=None,
                    producer=None,
                    creation_date=None,
                    modification_date=None,
                    file_size=Path(file_path).stat().st_size,
                    processing_timestamp=datetime.now()
                ),
                chunks=[],
                total_text_length=0,
                total_chunks=0,
                processing_time=processing_time,
                error_message=error_msg
            )

    def _parse_pdf_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse PDF date string to datetime object."""
        if not date_str:
            return None

        try:
            # PDF dates are in format: D:YYYYMMDDHHMMSS
            if date_str.startswith('D:'):
                date_str = date_str[2:]

            # Extract components
            if len(date_str) >= 14:
                year = int(date_str[0:4])
                month = int(date_str[4:6])
                day = int(date_str[6:8])
                hour = int(date_str[8:10])
                minute = int(date_str[10:12])
                second = int(date_str[12:14])

                return datetime(year, month, day, hour, minute, second)
        except (ValueError, IndexError):
            pass

        return None
