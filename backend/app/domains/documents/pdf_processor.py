"""
PDF processing service using marker-pdf for OCR and text extraction
"""
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any
import logging
from concurrent.futures import ThreadPoolExecutor
import time

from ...core.config import settings

logger = logging.getLogger(__name__)


class PDFProcessor:
    """Service for processing PDFs using marker-pdf"""

    def __init__(self):
        self.processing_dir = Path(settings.PDF_PROCESSING_DIR)
        self.output_dir = Path(settings.MARKDOWN_OUTPUT_DIR)
        self.max_concurrent_jobs = settings.MAX_CONCURRENT_PDF_JOBS
        self.timeout = settings.PDF_PROCESSING_TIMEOUT

        # Create directories
        self.processing_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Thread pool for CPU-intensive PDF processing
        self.executor = ThreadPoolExecutor(max_workers=self.max_concurrent_jobs)

    async def process_pdf_async(self, pdf_path: str, filename: str) -> Dict[str, Any]:
        """
        Process a PDF file asynchronously using marker-pdf

        Args:
            pdf_path: Path to the PDF file
            filename: Original filename for output naming

        Returns:
            Dict with processing results
        """
        start_time = time.time()

        try:
            # Run PDF processing in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._process_pdf_sync,
                pdf_path,
                filename
            )

            processing_time = time.time() - start_time
            result["processing_time"] = processing_time

            logger.info(f"Successfully processed PDF {filename} in {processing_time:.2f}s")
            return result

        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f"PDF processing failed for {filename}: {str(e)}"
            logger.error(f"{error_msg} (took {processing_time:.2f}s)")

            return {
                "success": False,
                "error": error_msg,
                "processing_time": processing_time,
                "markdown_content": "",
                "filename": filename
            }

    def _process_pdf_sync(self, pdf_path: str, filename: str) -> Dict[str, Any]:
        """
        Synchronous PDF processing using marker-pdf
        """
        try:
            from marker.converters.pdf import PdfConverter
            from marker.models import create_model_dict
            from marker.output import text_from_rendered

            pdf_file_path = Path(pdf_path)
            if not pdf_file_path.exists():
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")

            # Initialize converter with models
            artifact_dict = create_model_dict()
            converter = PdfConverter(artifact_dict=artifact_dict)

            # Convert PDF
            rendered = converter(str(pdf_file_path))

            # Extract markdown text
            if hasattr(rendered, 'markdown') and isinstance(rendered.markdown, str):
                markdown_text = rendered.markdown
            elif hasattr(rendered, 'text') and isinstance(rendered.text, str):
                markdown_text = rendered.text
            else:
                # Try text_from_rendered helper
                try:
                    rendered_output = text_from_rendered(rendered)
                    if isinstance(rendered_output, str):
                        markdown_text = rendered_output
                    else:
                        markdown_text = str(rendered_output)
                except Exception:
                    # Fallback to string representation
                    markdown_text = str(rendered)

            # Save markdown to output directory
            output_filename = Path(filename).stem + ".md"
            output_path = self.output_dir / output_filename

            with open(output_path, "w", encoding="utf-8") as f:
                f.write(markdown_text)

            return {
                "success": True,
                "markdown_content": markdown_text,
                "output_path": str(output_path),
                "content_length": len(markdown_text),
                "filename": filename
            }

        except ImportError as e:
            raise ImportError(f"marker-pdf not installed: {e}")
        except Exception as e:
            raise Exception(f"PDF processing error: {e}")

    async def get_processing_status(self) -> Dict[str, Any]:
        """Get current processing status and capacity"""
        return {
            "max_concurrent_jobs": self.max_concurrent_jobs,
            "active_threads": len(self.executor._threads),
            "processing_dir": str(self.processing_dir),
            "output_dir": str(self.output_dir)
        }

    async def cleanup_old_files(self, max_age_hours: int = 24) -> int:
        """
        Clean up old processed files

        Args:
            max_age_hours: Maximum age of files to keep

        Returns:
            Number of files cleaned up
        """
        import os
        from datetime import datetime, timedelta

        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        cleaned_count = 0

        # Clean processing directory
        for file_path in self.processing_dir.glob("*"):
            if file_path.is_file() and file_path.stat().st_mtime < cutoff_time.timestamp():
                file_path.unlink()
                cleaned_count += 1

        # Clean output directory
        for file_path in self.output_dir.glob("*"):
            if file_path.is_file() and file_path.stat().st_mtime < cutoff_time.timestamp():
                file_path.unlink()
                cleaned_count += 1

        logger.info(f"Cleaned up {cleaned_count} old files")
        return cleaned_count

    def __del__(self):
        """Cleanup thread pool on destruction"""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)
