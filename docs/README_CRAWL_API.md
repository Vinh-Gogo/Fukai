# Crawl API Documentation

## Overview
The Crawl API provides endpoints for managing PDF crawling operations with configurable targets. It supports both simple download operations and full RAG pipeline processing with authentication and background task management.

## Base URL
```
/api/v1/crawl
```

## Endpoints

### 1. Start Crawl
**POST** `/start`

Starts a new crawling operation.

#### Request Body
```json
{
  "crawl_type": "simple",
  "user_id": "optional-user-id"
}
```

#### Parameters
- `crawl_type` (string, required): Type of crawl operation
  - `"simple"`: Download PDFs only
  - `"full_pipeline"`: Download + process + embed + store in vector database
- `user_id` (string, optional): User ID for document ownership (recommended for full_pipeline)

#### Response
```json
{
  "success": true,
  "task_id": "crawl_a1b2c3d4",
  "crawl_type": "simple",
  "status": "running",
  "message": "Crawl task crawl_a1b2c3d4 started successfully"
}
```

#### Example
```bash
curl -X POST "http://localhost:8000/api/v1/crawl/start" \
  -H "Content-Type: application/json" \
  -d '{
    "crawl_type": "simple",
    "user_id": "user123"
  }'
```

---

### 2. Get Crawl Status
**GET** `/status/{task_id}`

Retrieves the current status and progress of a crawl task.

#### Parameters
- `task_id` (string, required): The task ID returned from the start endpoint

#### Response
```json
{
  "task_id": "crawl_a1b2c3d4",
  "status": "completed",
  "progress": {
    "stage": "completed",
    "percentage": 100
  },
  "result": {
    "success": true,
    "crawl_type": "simple",
    "pages_found": 5,
    "pdfs_found": 12,
    "pdfs_downloaded": 10,
    "pdf_urls": ["https://biwase.com.vn/uploads/doc1.pdf", "..."],
    "download_results": [...],
    "output_dir": "./uploads",
    "stats": {
      "pages_processed": 5,
      "news_articles_found": 8,
      "pdfs_found": 12,
      "pdfs_downloaded": 10,
      "errors": [],
      "start_time": "2025-12-20T14:30:00",
      "end_time": "2025-12-20T14:35:00"
    },
    "message": "Successfully crawled and downloaded 10 PDFs from 5 pages"
  },
  "error": null,
  "created_at": "2025-12-20T14:30:00"
}
```

#### Status Values
- `"running"`: Task is currently executing
- `"completed"`: Task finished successfully
- `"failed"`: Task encountered an error
- `"cancelled"`: Task was cancelled

#### Example
```bash
curl -X GET "http://localhost:8000/api/v1/crawl/status/crawl_a1b2c3d4"
```

---

### 3. Get Crawl History
**GET** `/history`

Retrieves a list of recent crawl operations.

#### Query Parameters
- `limit` (integer, optional): Maximum number of results (default: 10)
- `offset` (integer, optional): Pagination offset (default: 0)

#### Response
```json
{
  "crawls": [
    {
      "type": "crawl_simple",
      "status": "completed",
      "progress": {"stage": "completed", "percentage": 100},
      "result": {...},
      "started_at": "2025-12-20T14:30:00",
      "user_id": "user123"
    }
  ],
  "total": 1
}
```

#### Example
```bash
curl -X GET "http://localhost:8000/api/v1/crawl/history?limit=5"
```

---

### 4. Cancel Crawl
**DELETE** `/cancel/{task_id}`

Attempts to cancel a running crawl task.

#### Parameters
- `task_id` (string, required): The task ID to cancel

#### Response
```json
{
  "success": false,
  "message": "Task cancellation not implemented. Task will complete or timeout naturally."
}
```

**Note**: Task cancellation is not currently implemented. Running tasks will complete naturally.

#### Example
```bash
curl -X DELETE "http://localhost:8000/api/v1/crawl/cancel/crawl_a1b2c3d4"
```

---

### 5. Get Pages
**GET** `/pages?url={url}`

Gets pagination links from a specified URL for crawling preparation.

#### Query Parameters
- `url` (string, required): Base URL to crawl for pagination links

#### Response
```json
{
  "success": true,
  "pages_found": 5,
  "page_urls": [
    "https://example.com/page/1",
    "https://example.com/page/2",
    "..."
  ],
  "message": "Found 5 pages"
}
```

#### Example
```bash
curl -X GET "http://localhost:8000/api/v1/crawl/pages?url=https://biwase.com.vn/tin-tuc/ban-tin-biwase"
```

---

### 6. Get Articles
**POST** `/articles`

Extracts article/news links from page URLs.

#### Request Body
```json
{
  "page_urls": [
    "https://example.com/page/1",
    "https://example.com/page/2"
  ]
}
```

#### Response
```json
{
  "success": true,
  "article_urls": [
    "https://example.com/article/1",
    "https://example.com/article/2",
    "..."
  ],
  "message": "Found 15 articles from 2 pages"
}
```

#### Example
```bash
curl -X POST "http://localhost:8000/api/v1/crawl/articles" \
  -H "Content-Type: application/json" \
  -d '{
    "page_urls": ["https://biwase.com.vn/page/1", "https://biwase.com.vn/page/2"]
  }'
```

---

### 7. Get PDF Links
**POST** `/pdf-links`

Extracts PDF download links from article URLs.

#### Request Body
```json
{
  "article_urls": [
    "https://example.com/article/1",
    "https://example.com/article/2"
  ]
}
```

#### Response
```json
{
  "success": true,
  "pdfs_found": 8,
  "pdf_urls": [
    "https://example.com/uploads/doc1.pdf",
    "https://example.com/uploads/doc2.pdf",
    "..."
  ],
  "message": "Found 8 PDFs from 2 articles"
}
```

#### Example
```bash
curl -X POST "http://localhost:8000/api/v1/crawl/pdf-links" \
  -H "Content-Type: application/json" \
  -d '{
    "article_urls": ["https://biwase.com.vn/article/1", "https://biwase.com.vn/article/2"]
  }'
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400`: Bad request (invalid parameters)
- `404`: Task not found
- `500`: Internal server error

## Crawl Types

### Simple Crawl
- Downloads PDFs to the local file system
- Provides basic statistics and progress tracking
- Fast and lightweight operation

### Full Pipeline Crawl
- Downloads PDFs and processes them through the complete RAG pipeline
- Extracts text using marker-pdf
- Generates embeddings
- Stores vectors in QDrant for semantic search
- Creates database records for documents
- More resource-intensive but provides full search capability

## Rate Limiting

The crawler includes built-in rate limiting to be respectful to the target website:
- 1 second delay between requests by default
- Configurable via settings
- Exponential backoff for retries

## Configuration

Crawl behavior can be configured via environment variables:

```bash
# Crawler settings
CRAWL_USER_AGENT="FastAPI-Crawler/1.0"
CRAWL_TIMEOUT=30
CRAWL_DELAY=1.0

# Biwase specific
BIWASE_BASE_URL="https://biwase.com.vn/tin-tuc/ban-tin-biwase"

# Output directories
UPLOAD_DIR="./uploads"
```

## Monitoring

All crawl operations are logged and tracked with:
- Request/response logging
- Error tracking and reporting
- Performance metrics
- Progress indicators

## Testing

The API includes comprehensive test coverage. Run tests with:

```bash
# Run crawler tests
python run_tests.py crawler

# Run all tests
python run_tests.py
```

## Future Enhancements

Planned improvements:
- Task cancellation support
- Scheduled crawling via cron-like interface
- Webhook notifications for task completion
- Advanced filtering and selection options
- Crawl analytics and reporting dashboard
