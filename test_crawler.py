#!/usr/bin/env python3
"""
Test script for the BiwaseCrawler APIs

This script demonstrates the crawler functionality by:
1. Testing the scan endpoint to get article counts
2. Optionally testing the download endpoint

Usage:
    python test_crawler.py [--download]

Note: Make sure the backend is running on port 8000 before running this script.
"""

import requests
import json
import argparse
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/v1"

def print_response(title: str, response: Dict[str, Any]):
    """Pretty print API response"""
    print(f"\n{'='*50}")
    print(f"📊 {title}")
    print(f"{'='*50}")
    print(json.dumps(response, indent=2, ensure_ascii=False))
    print()

def test_scan_endpoint():
    """Test the crawler scan endpoint"""
    print("🔍 Testing crawler scan endpoint...")

    try:
        response = requests.get(f"{BASE_URL}/crawler/scan", timeout=60)
        response.raise_for_status()
        data = response.json()

        print_response("CRAWLER SCAN RESULTS", data)

        if data.get('success'):
            print("✅ Scan successful!")
            print(f"   📄 Pages found: {data.get('pages_found', 0)}")
            print(f"   📰 Articles found: {data.get('articles_found', 0)}")
            print(f"   📕 PDFs found: {data.get('pdfs_found', 0)}")
            return data.get('pdfs_found', 0)
        else:
            print(f"❌ Scan failed: {data.get('error', 'Unknown error')}")
            return 0
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return 0
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 0

def test_download_endpoint(pdf_count: int):
    """Test the crawler download endpoint"""
    if pdf_count == 0:
        print("⚠️  No PDFs found to download")
        return

    print(f"📥 Testing crawler download endpoint ({pdf_count} PDFs)...")

    try:
        # Download all discovered PDFs
        response = requests.post(
            f"{BASE_URL}/crawler/download",
            json={},  # Empty body to download all
            timeout=300  # 5 minutes timeout for downloads
        )
        response.raise_for_status()
        data = response.json()

        print_response("CRAWLER DOWNLOAD RESULTS", data)

        if data.get('success'):
            print("✅ Download successful!")
            print(f"   📥 Downloaded: {data.get('downloaded_count', 0)} / {data.get('total_count', 0)} files")

            # Show downloaded files
            files = data.get('files', [])
            if files:
                print("\n📁 Downloaded files:")
                for file_info in files[:5]:  # Show first 5
                    print(f"   • {file_info.get('filename', 'Unknown')} ({file_info.get('size', 0)} bytes)")
                if len(files) > 5:
                    print(f"   ... and {len(files) - 5} more files")
        else:
            print(f"❌ Download failed: {data.get('error', 'Unknown error')}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_status_endpoint():
    """Test the crawler status endpoint"""
    print("📊 Testing crawler status endpoint...")

    try:
        response = requests.get(f"{BASE_URL}/crawler/status", timeout=30)
        response.raise_for_status()
        data = response.json()

        print_response("CRAWLER STATUS", data)

        if data.get('downloaded_files_count', 0) > 0:
            print(f"✅ Found {data.get('downloaded_files_count')} downloaded files")

    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def main():
    """Main test function"""
    print("🚀 BiwaseCrawler API Test Script")
    print("=" * 50)

    parser = argparse.ArgumentParser(description='Test BiwaseCrawler APIs')
    parser.add_argument('--download', action='store_true',
                       help='Also test the download functionality')
    parser.add_argument('--status', action='store_true',
                       help='Test the status endpoint')

    args = parser.parse_args()

    # Test if backend is running
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        response.raise_for_status()
    except requests.exceptions.RequestException:
        print("❌ Backend server is not running on http://localhost:8000")
        print("   Please start the backend server first:")
        print("   cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        sys.exit(1)

    print("✅ Backend server is running")

    # Test scan endpoint
    pdf_count = test_scan_endpoint()

    # Test status endpoint
    if args.status:
        test_status_endpoint()

    # Test download endpoint if requested
    if args.download:
        if pdf_count > 0:
            user_input = input(f"\n⚠️  This will download {pdf_count} PDF files. Continue? (y/N): ")
            if user_input.lower() in ['y', 'yes']:
                test_download_endpoint(pdf_count)
            else:
                print("⏭️  Skipping download test")
        else:
            print("⏭️  No PDFs to download")

    print("\n🎉 Test completed!")
    print("\n📋 Available endpoints:")
    print(f"   GET  {BASE_URL}/crawler/scan     - Scan for articles and PDFs")
    print(f"   POST {BASE_URL}/crawler/download - Download PDFs")
    print(f"   GET  {BASE_URL}/crawler/status   - Get crawler status")
    print(f"   GET  {BASE_URL}/crawler/downloads - List downloaded files")

if __name__ == "__main__":
    main()
