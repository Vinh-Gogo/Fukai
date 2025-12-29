import os
import shutil
import tempfile
import time
import pytest
from types import SimpleNamespace
from app.services.biwase_crawler import BiwaseCrawlerService
import requests


class FakeResponse:
    def __init__(self, content=b"%PDF-1.4 fake pdf content", status_code=200):
        self._content = content
        self.status_code = status_code
        self.headers = {"Content-Length": str(len(content))}
        self._iter_called = False

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.exceptions.RequestException(f"Status code {self.status_code}")

    def iter_content(self, chunk_size=8192):
        # Simulate streaming
        self._iter_called = True
        yield self._content

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def test_download_pdf_handles_spaces_and_encodes_url(monkeypatch):
    tmpdir = tempfile.mkdtemp()
    try:
        # Prepare a PDF URL with spaces
        original_url = "https://biwase.com.vn/Data/Sites/1/media/filescan/ban-tin-biwase/BAN TIN T4-2021 A4.pdf"

        # Make the session.get return a fake response object
        def fake_get(url, timeout=None, stream=False):
            # Ensure URL is encoded (contains %20)
            assert "%20" in url
            return FakeResponse()

        svc = BiwaseCrawlerService(output_dir=tmpdir)
        monkeypatch.setattr(svc.session, "get", fake_get)

        result = svc.download_pdf(original_url)

        # Should return file info with originals and requested_url
        assert result["original_url"] == original_url
        assert "requested_url" in result
        assert "%20" in result["requested_url"]

        # File should be created with spaces converted to underscores
        expected_filename = "BAN_TIN_T4-2021_A4.pdf"
        expected_path = os.path.join(tmpdir, "biwase_crawler", expected_filename)
        assert os.path.exists(expected_path)
        assert result["filename"] == expected_filename
        assert result["filepath"] == expected_path
        assert result["size"] > 0

    finally:
        shutil.rmtree(tmpdir)


def test_download_pdf_adds_https_when_missing_scheme(monkeypatch):
    tmpdir = tempfile.mkdtemp()
    try:
        # URL missing scheme
        original_url = "biwase.com.vn/Data/Sites/1/media/filescan/ban-tin-biwase/BAN TIN T4-2021 A4.pdf"

        def fake_get(url, timeout=None, stream=False):
            # Should have https:// prefixed and encoded
            assert url.startswith("https://")
            assert "%20" in url
            return FakeResponse()

        svc = BiwaseCrawlerService(output_dir=tmpdir)
        monkeypatch.setattr(svc.session, "get", fake_get)

        result = svc.download_pdf(original_url)
        assert result["original_url"] == original_url
        assert result["requested_url"].startswith("https://")
        assert "%20" in result["requested_url"]

    finally:
        shutil.rmtree(tmpdir)


def test_download_pdf_returns_error_info_on_failure(monkeypatch):
    tmpdir = tempfile.mkdtemp()
    try:
        original_url = "https://biwase.com.vn/some/nonexistent/BAN TIN.pdf"

        def fake_get_raises(url, timeout=None, stream=False):
            raise requests.exceptions.RequestException("Network failure")

        svc = BiwaseCrawlerService(output_dir=tmpdir)
        monkeypatch.setattr(svc.session, "get", fake_get_raises)

        result = svc.download_pdf(original_url)
        # When an exception occurs, result should contain error info
        assert "error" in result
        assert result["original_url"] == original_url
        assert result["attempted_url"] is not None

    finally:
        shutil.rmtree(tmpdir)
