"""
Unit tests for PDFProcessor service
"""
import pytest
import os
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from pathlib import Path
import asyncio
import tempfile
import shutil
from concurrent.futures import ThreadPoolExecutor

from app.services.pdf_processor import PDFProcessor


class TestPDFProcessor:
    """Test cases for PDFProcessor"""

    @pytest.fixture
    def temp_dirs(self):
        """Create temporary directories for processing and output."""
        processing_dir = Path(tempfile.mkdtemp(prefix="processing_"))
        output_dir = Path(tempfile.mkdtemp(prefix="output_"))

        yield processing_dir, output_dir

        shutil.rmtree(processing_dir, ignore_errors=True)
        shutil.rmtree(output_dir, ignore_errors=True)

    @pytest.fixture
    def processor(self, temp_dirs, mock_settings):
        """Create PDFProcessor instance with temp directories."""
        processing_dir, output_dir = temp_dirs

        with patch('app.services.pdf_processor.settings') as mock_settings_module:
            mock_settings_module.PDF_PROCESSING_DIR = str(processing_dir)
            mock_settings_module.MARKDOWN_OUTPUT_DIR = str(output_dir)
            mock_settings_module.MAX_CONCURRENT_PDF_JOBS = 2
            mock_settings_module.PDF_PROCESSING_TIMEOUT = 30

            processor = PDFProcessor()
            yield processor

    @pytest.mark.unit
    @pytest.mark.pdf
    def test_processor_initialization(self, temp_dirs, mock_settings):
        """Test PDFProcessor initialization."""
        processing_dir, output_dir = temp_dirs

        with patch('app.services.pdf_processor.settings') as mock_settings_module:
            mock_settings_module.PDF_PROCESSING_DIR = str(processing_dir)
            mock_settings_module.MARKDOWN_OUTPUT_DIR = str(output_dir)
            mock_settings_module.MAX_CONCURRENT_PDF_JOBS = 2
            mock_settings_module.PDF_PROCESSING_TIMEOUT = 30

            processor = PDFProcessor()

            assert processor.processing_dir == processing_dir
            assert processor.output_dir == output_dir
            assert processor.max_concurrent_jobs == 2
            assert processor.timeout == 30
            assert isinstance(processor.executor, ThreadPoolExecutor)
            assert processor.executor._max_workers == 2

    @pytest.mark.unit
    @pytest.mark.pdf
    @pytest.mark.asyncio
    async def test_process_pdf_async_success(self, processor, sample_pdf_content, temp_dir):
        """Test successful async PDF processing."""
        # Create a test PDF file
        pdf_path = temp_dir / "test.pdf"
        pdf_path.write_bytes(sample_pdf_content)

        # Mock the marker-pdf converter
        with patch('app.services.pdf_processor.PdfConverter') as mock_converter_class:
            mock_converter = Mock()
            mock_rendered = Mock()
            mock_rendered.markdown = "# Extracted content\n\nThis is test content."
            mock_converter.return_value = mock_rendered
            mock_converter_class.return_value = mock_converter

            result = await processor.process_pdf_async(str(pdf_path), "test.pdf")

            assert result["success"] is True
            assert "processing_time" in result
            assert result["markdown_content"] == "# Extracted content\n\nThis is test content."
            assert result["filename"] == "test.pdf"
            assert result["content_length"] == len("# Extracted content\n\nThis is test content.")

            # Check that output file was created
            output_files = list(processor.output_dir.glob("*.md"))
            assert len(output_files) == 1
            assert output_files[0].name == "test.md"

    @pytest.mark.unit
    @pytest.mark.pdf
    @pytest.mark.asyncio
    async def test_process_pdf_async_file_not_found(self, processor):
        """Test PDF processing when file doesn't exist."""
        result = await processor.process_pdf_async("/nonexistent/file.pdf", "test.pdf")

        assert result["success"] is False
        assert "FileNotFoundError" in result["error"]
        assert result["filename"] == "test.pdf"
        assert "processing_time" in result

    @pytest.mark.unit
    @pytest.mark.pdf
    @pytest.mark.asyncio
    async def test_process_pdf_async_marker_error(self, processor, sample_pdf_content, temp_dir):
        """Test PDF processing with marker-pdf error."""
        # Create a test PDF file
        pdf_path = temp_dir / "test.pdf"
        pdf_path.write_bytes(sample_pdf_content)

        # Mock marker-pdf to raise an exception
        with patch('app.services.pdf_processor.PdfConverter') as mock_converter_class:
            mock_converter_class.side_effect = Exception("Marker processing failed")

            result = await processor.process_pdf_async(str(pdf_path), "test.pdf")

            assert result["success"] is False
            assert "Marker processing failed" in result["error"]
            assert result["filename"] == "test.pdf"
            assert result["markdown_content"] == ""

    @pytest.mark.unit
    @pytest.mark.pdf
    @pytest.mark.asyncio
    async def test_process_pdf_async_fallback_text(self, processor, sample_pdf_content, temp_dir):
        """Test PDF processing with text fallback."""
        # Create a test PDF file
        pdf_path = temp_dir / "test.pdf"
        pdf_path.write_bytes(sample_pdf_content)

        # Mock marker-pdf with text attribute instead of markdown
        with patch('app.services.pdf_processor.PdfConverter') as mock_converter_class:
            mock_converter = Mock()
            mock_rendered = Mock()
            mock_rendered.markdown = None
            mock_rendered.text = "Plain text content"
            mock_converter.return_value = mock_rendered
            mock_converter_class.return_value = mock_converter

            result = await processor.process_pdf_async(str(pdf_path), "test.pdf")

            assert result["success"] is True
            assert result["markdown_content"] == "Plain text content"

    @pytest.mark.unit
    @pytest.mark.pdf
    @pytest.mark.asyncio
    async def test_process_pdf_async_string_fallback(self, processor, sample_pdf_content, temp_dir):
        """Test PDF processing with string representation fallback."""
        # Create a test PDF file
        pdf_path = temp_dir / "test.pdf"
        pdf_path.write_bytes(sample_pdf_content)

        # Mock marker-pdf with neither markdown nor text
        with patch('app.services.pdf_processor.PdfConverter') as mock_converter_class:
            with patch('app.services.pdf_processor.text_from_rendered') as mock_text_func:
                mock_converter = Mock()
                mock_rendered = Mock()
                mock_rendered.markdown = None
                mock_rendered.text = None
                mock_converter.return_value = mock_rendered
                mock_converter_class.return_value = mock_converter

                mock_text_func.return_value = "Fallback content"

                result = await processor.process_pdf_async(str(pdf_path), "test.pdf")

                assert result["success"] is True
                assert result["markdown_content"] == "Fallback content"

    @pytest.mark.unit
    @pytest.mark.pdf
    @pytest.mark.asyncio
    async def test_get_processing_status(self, processor):
        """Test getting processing status."""
        status = await processor.get_processing_status()

        assert "max_concurrent_jobs" in status
        assert "active_threads" in status
        assert "processing_dir" in status
        assert "output_dir" in status
        assert status["max_concurrent_jobs"] == 2

    @pytest.mark.unit
    @pytest.mark.pdf
    @pytest.mark.asyncio
    async def test_cleanup_old_files(self, processor, temp_dir):
        """Test cleanup of old processed files."""
        # Create some test files
        old_file = processor.processing_dir / "old_file.pdf"
        old_file.write_text("test")
        old_file.touch()

        # Create output file
        old_md_file = processor.output_dir / "old_file.md"
        old_md_file.write_text("test markdown")
        old_md_file.touch()

        # Modify timestamps to be old (2 hours ago)
        import time
        old_time = time.time() - (2 * 60 * 60)
        os.utime(old_file, (old_time, old_time))
        os.utime(old_md_file, (old_time, old_time))

        # Create a new file (should not be cleaned)
        new_file = processor.processing_dir / "new_file.pdf"
        new_file.write_text("new test")

        cleaned_count = await processor.cleanup_old_files(max_age_hours=1)

        assert cleaned_count == 2
        assert not old_file.exists()
        assert not old_md_file.exists()
        assert new_file.exists()  # New file should remain

    @pytest.mark.unit
    @pytest.mark.pdf
    def test_processor_cleanup(self, processor):
        """Test that thread pool is cleaned up properly."""
        executor = processor.executor
        assert executor is not None

        # Manually call __del__ to test cleanup
        processor.__del__()

        # Executor should be shut down
        assert executor._shutdown

    @pytest.mark.unit
    @pytest.mark.pdf
    @pytest.mark.asyncio
    async def test_concurrent_processing(self, processor, sample_pdf_content, temp_dir):
        """Test concurrent PDF processing."""
        # Create multiple test PDF files
        pdf_files = []
        for i in range(3):
            pdf_path = temp_dir / f"test_{i}.pdf"
            pdf_path.write_bytes(sample_pdf_content)
            pdf_files.append((str(pdf_path), f"test_{i}.pdf"))

        # Mock successful processing for all files
        with patch('app.services.pdf_processor.PdfConverter') as mock_converter_class:
            mock_converter = Mock()
            mock_rendered = Mock()
            task = asyncio.current_task()
            task_name = task.get_name() if task else "default"
            mock_rendered.markdown = f"Content {task_name}"
            mock_converter.return_value = mock_rendered
            mock_converter_class.return_value = mock_converter

            # Process all files concurrently
            tasks = [
                processor.process_pdf_async(pdf_path, filename)
                for pdf_path, filename in pdf_files
            ]
            results = await asyncio.gather(*tasks)

            # All should succeed
            assert all(result["success"] for result in results)
            assert len(results) == 3

            # Check output files were created
            output_files = list(processor.output_dir.glob("*.md"))
            assert len(output_files) == 3

    @pytest.mark.unit
    @pytest.mark.pdf
    @pytest.mark.asyncio
    async def test_import_error_handling(self, processor, sample_pdf_content, temp_dir):
        """Test handling of marker-pdf import errors."""
        # Create a test PDF file
        pdf_path = temp_dir / "test.pdf"
        pdf_path.write_bytes(sample_pdf_content)

        # Mock ImportError in _process_pdf_sync
        with patch('app.services.pdf_processor.PdfConverter') as mock_converter_class:
            mock_converter_class.side_effect = ImportError("marker-pdf not available")

            result = await processor.process_pdf_async(str(pdf_path), "test.pdf")

            assert result["success"] is False
            assert "marker-pdf not installed" in result["error"]

    @pytest.mark.unit
    @pytest.mark.pdf
    @pytest.mark.asyncio
    async def test_timeout_handling(self, processor):
        """Test timeout handling in PDF processing."""
        # This test verifies that the timeout setting is used
        # In a real scenario, this would test actual timeout behavior
        with patch('app.services.pdf_processor.settings') as mock_settings:
            mock_settings.PDF_PROCESSING_TIMEOUT = 10

            processor_timeout = PDFProcessor()
            assert processor_timeout.timeout == 10
