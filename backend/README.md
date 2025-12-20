# FastAPI Backend

This is the FastAPI backend for the web crawling and document management system. It provides APIs for crawling PDF files from websites and managing uploaded documents.

## Features

- **Web Crawling**: Automated PDF crawling from Biwase website
- **File Management**: Upload, download, and delete PDF files
- **Progress Tracking**: Real-time progress monitoring for crawl operations
- **Structured Logging**: Comprehensive logging with Structlog
- **Health Monitoring**: System health checks and metrics
- **Type Safety**: Full Pydantic models and type hints

## Quick Start

### Using Docker (Recommended)

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the API:**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

### Local Development

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run the application:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### Crawl Operations
- `POST /api/v1/crawl/start` - Start a web crawling job
- `GET /api/v1/crawl/status/{job_id}` - Get crawl job status
- `GET /api/v1/crawl/jobs` - List all crawl jobs
- `DELETE /api/v1/crawl/jobs/{job_id}` - Cancel a crawl job
- `GET /api/v1/crawl/test` - Test crawl functionality

### File Management
- `POST /api/v1/files/upload` - Upload a PDF file
- `GET /api/v1/files/list` - List uploaded files
- `GET /api/v1/files/download/{filename}` - Download a file
- `DELETE /api/v1/files/{filename}` - Delete a file

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health check
- `GET /api/v1/health/system` - System information

## Configuration

Environment variables can be set in a `.env` file:

```bash
# Database
DATABASE_URL=sqlite:///./app.db

# File Storage
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=52428800  # 50MB

# Crawling
BIWASE_BASE_URL=https://biwase.com.vn/tin-tuc/ban-tin-biwase
CRAWL_TIMEOUT=30
CRAWL_MAX_CONCURRENT=5
CRAWL_DELAY=1.0

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

## Crawler Usage

The crawler is based on your original implementation but enhanced with:

- **Async operations** for better performance
- **Progress tracking** with detailed metrics
- **Error handling** and retry logic
- **Rate limiting** to avoid being blocked
- **Concurrent downloads** for faster processing

### Example Usage

```python
from app.services.crawler import BiwaseCrawler

# Create crawler instance
crawler = BiwaseCrawler(
    base_url="https://biwase.com.vn/tin-tuc/ban-tin-biwase",
    output_dir="./downloads"
)

# Execute crawl
result = crawler.crawl()

print(f"Found {result['pdfs_found']} PDFs")
print(f"Downloaded {result['downloaded']} files")
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/     # API endpoint handlers
│   │       │   ├── crawl.py   # Crawl operations
│   │       │   ├── files.py   # File management
│   │       │   └── health.py  # Health checks
│   │       └── api.py         # API router setup
│   ├── core/                  # Core functionality
│   │   ├── config.py          # Configuration management
│   │   ├── database.py        # Database setup
│   │   └── logging.py         # Logging configuration
│   ├── services/              # Business logic
│   │   └── crawler.py         # Biwase crawler service
│   └── main.py                # FastAPI application
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker configuration
└── README.md                  # This file
```

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
isort .
```

### Type Checking
```bash
mypy .
```

## Deployment

The backend is designed to work with Docker and can be deployed alongside the Next.js frontend using Docker Compose.

### Production Considerations

- Use environment-specific configuration
- Set up proper logging and monitoring
- Configure database backups
- Implement authentication and authorization
- Set up SSL/TLS certificates
- Configure rate limiting and security headers

## Integration with Next.js

The backend provides REST APIs that the Next.js frontend can consume:

- Crawl operations for starting PDF collection jobs
- File management for uploading and organizing documents
- Real-time progress updates for long-running operations

See the main project README for full integration details.
