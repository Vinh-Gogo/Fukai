"""
Integration tests for the complete data collection pipeline
"""
import pytest
import asyncio
import os
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
import tempfile
import shutil

from app.services.crawler import BiwaseCrawler
from app.services.pdf_processor import PDFProcessor
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QDrantService


@pytest.mark.integration
class TestDataCollectionPipeline:
    """Integration tests for the complete data collection pipeline"""

    @pytest.fixture
    def temp_dirs(self):
        """Create temporary directories for the pipeline."""
        processing_dir = Path(tempfile.mkdtemp(prefix="processing_"))
        output_dir = Path(tempfile.mkdtemp(prefix="output_"))
        upload_dir = Path(tempfile.mkdtemp(prefix="upload_"))

        yield processing_dir, output_dir, upload_dir

        shutil.rmtree(processing_dir, ignore_errors=True)
        shutil.rmtree(output_dir, ignore_errors=True)
        shutil.rmtree(upload_dir, ignore_errors=True)

    @pytest.fixture
    def pipeline_services(self, temp_dirs, mock_settings, sample_pdf_content):
        """Set up all services for the pipeline test."""
        processing_dir, output_dir, upload_dir = temp_dirs

        # Mock settings for all services
        with patch('app.services.pdf_processor.settings') as pdf_settings, \
             patch('app.services.embedding_service.settings') as embed_settings, \
             patch('app.services.qdrant_service.settings') as qdrant_settings:

            # PDF processor settings
            pdf_settings.PDF_PROCESSING_DIR = str(processing_dir)
            pdf_settings.MARKDOWN_OUTPUT_DIR = str(output_dir)
            pdf_settings.MAX_CONCURRENT_PDF_JOBS = 2
            pdf_settings.PDF_PROCESSING_TIMEOUT = 30

            # Embedding service settings
            embed_settings.OPENAI_BASE_URL_EMBED = "http://localhost:8001/v1"
            embed_settings.OPENAI_API_KEY_EMBED = "test-key"
            embed_settings.OPENAI_API_MODEL_NAME_EMBED = "text-embedding-3-small"
            embed_settings.EMBEDDING_DIMENSION = 1536
            embed_settings.CHUNK_SIZE = 1000
            embed_settings.CHUNK_OVERLAP = 200

            # QDrant settings
            qdrant_settings.QDRANT_URL = "http://localhost:6333"
            qdrant_settings.QDRANT_API_KEY = "test-qdrant-key"
            qdrant_settings.QDRANT_COLLECTION_NAME = "test-collection"
            qdrant_settings.MAX_RETRIEVED_DOCS = 10

            # Create services
            pdf_processor = PDFProcessor()
            embedding_service = EmbeddingService()
            qdrant_service = QDrantService()

            yield {
                'pdf_processor': pdf_processor,
                'embedding_service': embedding_service,
                'qdrant_service': qdrant_service,
                'dirs': (processing_dir, output_dir, upload_dir),
                'sample_pdf': sample_pdf_content
            }

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_complete_data_collection_pipeline(self, pipeline_services):
        """
        Test the complete data collection pipeline:
        1. Crawl PDFs from website
        2. Process PDFs to extract text
        3. Generate embeddings
        4. Store in vector database
        5. Search and retrieve
        """
        services = pipeline_services
        pdf_processor = services['pdf_processor']
        embedding_service = services['embedding_service']
        qdrant_service = services['qdrant_service']
        processing_dir, output_dir, upload_dir = services['dirs']
        sample_pdf_content = services['sample_pdf']

        user_id = "test-user-123"

        # Step 1: Simulate PDF crawling and download
        # Create a test PDF file as if downloaded by crawler
        pdf_path = upload_dir / "test-document.pdf"
        pdf_path.write_bytes(sample_pdf_content)

        # Step 2: Process PDF to extract text
        with patch('app.services.pdf_processor.PdfConverter') as mock_converter_class:
            mock_converter = Mock()
            mock_rendered = Mock()
            extracted_text = "# Test Document\n\nThis is a test document extracted from PDF.\n\n## Section 1\n\nSome content here.\n\n## Section 2\n\nMore content in this section."
            mock_rendered.markdown = extracted_text
            mock_converter.return_value = mock_rendered
            mock_converter_class.return_value = mock_converter

            result = await pdf_processor.process_pdf_async(str(pdf_path), "test-document.pdf")

            assert result["success"] is True
            assert result["markdown_content"] == extracted_text
            assert result["content_length"] == len(extracted_text)

        # Verify markdown file was created
        markdown_files = list(output_dir.glob("*.md"))
        assert len(markdown_files) == 1
        assert markdown_files[0].name == "test-document.md"

        # Step 3: Generate embeddings for the extracted text
        with patch('app.services.embedding_service.aiohttp.ClientSession') as mock_session_class:
            mock_session = AsyncMock()
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json.return_value = {
                "data": [{"embedding": [0.1] * 1536, "index": 0}]
            }
            mock_session.post.return_value.__aenter__.return_value = mock_response
            mock_session.post.return_value.__aexit__.return_value = None

            embedding_service.session = mock_session

            embedding_result = await embedding_service.generate_embedding(extracted_text[:500])  # Use first 500 chars

            assert embedding_result is not None
            assert len(embedding_result) == 1536

        # Step 4: Store embeddings in QDrant
        points = [
            {
                "vector": embedding_result,
                "payload": {
                    "text": extracted_text,
                    "filename": "test-document.pdf",
                    "content_type": "pdf",
                    "chunk_index": 0,
                    "total_chunks": 1
                }
            }
        ]

        # Mock QDrant operations
        mock_operation = Mock()
        mock_operation.operation_id = "test-upsert-op"

        qdrant_service.client.upsert.return_value = mock_operation

        # Ensure collection exists
        mock_collections = Mock()
        mock_collections.collections = []
        qdrant_service.client.get_collections.return_value = mock_collections

        collection_created = await qdrant_service.ensure_collection_exists()
        assert collection_created is True

        # Add points
        add_result = await qdrant_service.add_points(points, user_id)
        assert add_result["success"] is True
        assert add_result["points_added"] == 1

        # Step 5: Search and retrieve similar content
        mock_hit = Mock()
        mock_hit.id = "test-point-id"
        mock_hit.score = 0.95
        mock_hit.payload = {
            "text": extracted_text,
            "filename": "test-document.pdf",
            "user_id": user_id
        }

        qdrant_service.client.search.return_value = [mock_hit]

        search_result = await qdrant_service.search_similar(embedding_result, user_id, limit=5)

        assert search_result["success"] is True
        assert len(search_result["results"]) == 1
        assert search_result["results"][0]["score"] == 0.95
        assert search_result["results"][0]["payload"]["filename"] == "test-document.pdf"

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_pipeline_error_handling(self, pipeline_services):
        """
        Test error handling throughout the pipeline.
        """
        services = pipeline_services
        pdf_processor = services['pdf_processor']
        embedding_service = services['embedding_service']
        qdrant_service = services['qdrant_service']

        # Test PDF processing failure
        result = await pdf_processor.process_pdf_async("/nonexistent/file.pdf", "missing.pdf")
        assert result["success"] is False
        assert "FileNotFoundError" in result["error"]

        # Test embedding failure
        with patch.object(embedding_service, '_ensure_session') as mock_ensure:
            mock_ensure.side_effect = Exception("API unavailable")

            embedding_result = await embedding_service.generate_embedding("test text")
            assert embedding_result is None

        # Test QDrant failure
        qdrant_service.client.get_collections.side_effect = Exception("Connection failed")

        connection_result = await qdrant_service.test_connection()
        assert connection_result["connected"] is False
        assert "Connection failed" in connection_result["error"]

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_pipeline_with_chunking(self, pipeline_services):
        """
        Test the pipeline with text chunking for large documents.
        """
        services = pipeline_services
        embedding_service = services['embedding_service']
        qdrant_service = services['qdrant_service']

        # Create a long text that will be chunked
        long_text = "This is a test sentence. " * 100  # Creates text that will be chunked

        # Mock embeddings for chunks
        with patch('app.services.embedding_service.aiohttp.ClientSession') as mock_session_class:
            mock_session = AsyncMock()
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json.return_value = {
                "data": [{"embedding": [0.1] * 1536, "index": 0}]
            }
            mock_session.post.return_value.__aenter__.return_value = mock_response
            mock_session.post.return_value.__aexit__.return_value = None

            embedding_service.session = mock_session

            chunk_result = await embedding_service.chunk_and_embed(long_text, chunk_size=50, overlap=10)

            assert chunk_result["total_chunks"] > 1
            assert len(chunk_result["chunks"]) == chunk_result["total_chunks"]
            assert len(chunk_result["embeddings"]) == chunk_result["total_chunks"]
            assert chunk_result["success_count"] > 0

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_concurrent_pipeline_processing(self, pipeline_services, sample_pdf_content):
        """
        Test concurrent processing of multiple documents through the pipeline.
        """
        services = pipeline_services
        pdf_processor = services['pdf_processor']
        embedding_service = services['embedding_service']
        qdrant_service = services['qdrant_service']
        processing_dir, output_dir, upload_dir = services['dirs']

        # Create multiple test PDFs
        pdf_files = []
        for i in range(3):
            pdf_path = upload_dir / f"test-doc-{i}.pdf"
            pdf_path.write_bytes(sample_pdf_content)
            pdf_files.append((str(pdf_path), f"test-doc-{i}.pdf"))

        # Process PDFs concurrently
        with patch('app.services.pdf_processor.PdfConverter') as mock_converter_class:
            mock_converter = Mock()
            mock_rendered = Mock()
            mock_rendered.markdown = f"Extracted content for document {{i}}"
            mock_converter.return_value = mock_rendered
            mock_converter_class.return_value = mock_converter

            tasks = [
                pdf_processor.process_pdf_async(pdf_path, filename)
                for pdf_path, filename in pdf_files
            ]
            pdf_results = await asyncio.gather(*tasks)

            # All PDF processing should succeed
            assert all(result["success"] for result in pdf_results)
            assert len(pdf_results) == 3

        # Generate embeddings concurrently
        texts = [result["markdown_content"] for result in pdf_results]

        with patch('app.services.embedding_service.aiohttp.ClientSession') as mock_session_class:
            mock_session = AsyncMock()
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json.return_value = {
                "data": [{"embedding": [0.1] * 1536, "index": 0}]
            }
            mock_session.post.return_value.__aenter__.return_value = mock_response
            mock_session.post.return_value.__aexit__.return_value = None

            embedding_service.session = mock_session

            embed_tasks = [
                embedding_service.generate_embedding(text[:200])  # Use first 200 chars
                for text in texts
            ]
            embeddings = await asyncio.gather(*embed_tasks)

            # All embeddings should be generated
            assert all(emb is not None for emb in embeddings)
            assert len(embeddings) == 3

        # Store all embeddings in QDrant
        user_id = "concurrent-test-user"
        points = [
            {
                "vector": emb,
                "payload": {
                    "text": text,
                    "filename": f"test-doc-{i}.pdf",
                    "content_type": "pdf"
                }
            }
            for i, (emb, text) in enumerate(zip(embeddings, texts))
        ]

        # Mock QDrant operations
        mock_operation = Mock()
        mock_operation.operation_id = "concurrent-upsert-op"

        qdrant_service.client.upsert.return_value = mock_operation

        add_result = await qdrant_service.add_points(points, user_id)
        assert add_result["success"] is True
        assert add_result["points_added"] == 3

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_pipeline_cleanup_and_maintenance(self, pipeline_services):
        """
        Test cleanup and maintenance operations in the pipeline.
        """
        services = pipeline_services
        pdf_processor = services['pdf_processor']
        qdrant_service = services['qdrant_service']
        processing_dir, output_dir, upload_dir = services['dirs']

        user_id = "maintenance-test-user"

        # Create some test files
        old_pdf = processing_dir / "old-file.pdf"
        old_pdf.write_text("old pdf content")
        old_md = output_dir / "old-file.md"
        old_md.write_text("old markdown content")

        # Modify timestamps to be old
        import time
        old_time = time.time() - (3 * 60 * 60)  # 3 hours ago
        os.utime(old_pdf, (old_time, old_time))
        os.utime(old_md, (old_time, old_time))

        # Test PDF processor cleanup
        cleaned_count = await pdf_processor.cleanup_old_files(max_age_hours=2)
        assert cleaned_count == 2
        assert not old_pdf.exists()
        assert not old_md.exists()

        # Test QDrant user data cleanup
        mock_operation = Mock()
        mock_operation.operation_id = "cleanup-op"

        qdrant_service.client.delete.return_value = mock_operation

        delete_result = await qdrant_service.delete_user_points(user_id)
        assert delete_result["success"] is True
        assert user_id in delete_result["message"]
