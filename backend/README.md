# Backend API Server

FastAPI backend for web crawling, document processing, and RAG (Retrieval-Augmented Generation) functionality.

## 🚀 Features

- **FastAPI Framework**: High-performance async API with automatic OpenAPI documentation
- **Web Crawling**: Automated PDF discovery and download with configurable targets
- **Document Processing**: PDF text extraction using marker-pdf with OCR capabilities
- **Vector Search**: Semantic search powered by QDrant and embeddings
- **Authentication**: User authentication and authorization system
- **Background Tasks**: Asynchronous job processing with status tracking
- **Database Integration**: SQLAlchemy ORM with SQLite/PostgreSQL support
- **Rate Limiting**: Built-in rate limiting and request throttling
- **Structured Logging**: JSON logging with monitoring and alerting
- **Docker Support**: Containerized deployment ready

## 🏗️ Architecture

### API Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── core/                # Core functionality
│   │   ├── config.py        # Application configuration
│   │   ├── database.py      # Database setup and utilities
│   │   ├── dependencies.py  # Dependency injection
│   │   └── middleware.py    # Custom middleware
│   ├── api/v1/              # API version 1
│   │   ├── api.py           # Main API router
│   │   └── endpoints/       # API endpoints
│   │       ├── auth.py      # Authentication endpoints
│   │       ├── crawl.py     # Crawling operations
│   │       ├── files.py     # File management
│   │       └── health.py    # Health checks
│   ├── domains/             # Business logic domains
│   │   ├── auth/            # Authentication domain
│   │   ├── crawler/         # Crawling domain
│   │   ├── search/          # Search/RAG domain
│   │   └── documents/       # Document processing domain
│   ├── infrastructure/      # Infrastructure layer
│   │   ├── external_services/  # External API clients
│   │   └── repositories/       # Data access layer
│   ├── models/              # Database models
│   ├── schemas/             # Pydantic schemas
│   └── shared/              # Shared utilities
├── tests/                   # Test suite
├── alembic/                 # Database migrations
└── requirements*.txt        # Dependencies
```

### Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI       │    │   Background     │    │   External      │
│   Server        │◄──►│   Tasks         │◄──►│   Services      │
│   (Port 8000)   │    │   Service        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   File System   │    │   QDrant        │
│   (SQLite/PG)   │    │   Storage       │    │   Vector DB     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Python 3.12+
- pip or uv package manager
- QDrant instance (cloud or local)
- Embedding service (Qwen3-Embedding model)

## 🛠️ Installation

### 1. Clone and Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

### 2. Install Dependencies

```bash
# Using pip
pip install -r requirements-core.txt
pip install -r requirements.txt

# Or using uv (recommended)
uv pip install -r requirements-core.txt
uv pip install -r requirements.txt
```

### 3. Initialize Database

```bash
# Create tables
python -m app.core.database

# Run migrations (if using Alembic)
alembic upgrade head
```

## 🚀 Running the Application

### Development Mode

```bash
# Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using the startup script
../scripts/start-apis.sh
```

### Production Mode

```bash
# Using gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or using Docker
docker-compose -f ../docker/docker-compose.yml up -d backend
```

## 📚 API Documentation

### Access Points

- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json
- **Health Check**: http://localhost:8000/health

### Main Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user

#### Crawling Operations
- `POST /api/v1/crawl/start` - Start crawl job
- `GET /api/v1/crawl/status/{task_id}` - Get job status
- `GET /api/v1/crawl/history` - List crawl history
- `DELETE /api/v1/crawl/cancel/{task_id}` - Cancel job
- `GET /api/v1/crawl/pages` - Get pagination links
- `POST /api/v1/crawl/articles` - Extract article links
- `POST /api/v1/crawl/pdf-links` - Extract PDF links

#### File Management
- `GET /api/v1/files/list` - List uploaded files
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/{file_id}` - Download file
- `DELETE /api/v1/files/{file_id}` - Delete file

#### Search/RAG
- `POST /api/v1/rag/search` - Semantic search
- `POST /api/v1/rag/ingest` - Ingest documents
- `GET /api/v1/rag/documents` - List documents

## ⚙️ Configuration

### Environment Variables

```bash
# Application
PROJECT_NAME="Web RAG Backend"
API_V1_STR="/api/v1"
SECRET_KEY="your-secret-key"

# Database
DATABASE_URL="sqlite:///./app.db"

# QDrant Vector Database
QDRANT_API_KEY="your-qdrant-key"
QDRANT_URL="https://your-instance.qdrant.io"

# Embedding Service
OPENAI_BASE_URL_EMBED="http://localhost:8080/v1"
OPENAI_API_KEY_EMBED="text"

# File Storage
UPLOAD_DIR="./uploads"
MAX_UPLOAD_SIZE=52428800

# Crawling
BIWASE_BASE_URL="https://biwase.com.vn/tin-tuc/ban-tin-biwase"
CRAWL_USER_AGENT="FastAPI-Crawler/1.0"
CRAWL_TIMEOUT=30
CRAWL_DELAY=1.0

# Processing
MAX_CONCURRENT_PDF_JOBS=2
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Security
ALLOWED_HOSTS=["localhost", "127.0.0.1"]
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
```

### External Services Setup

#### QDrant Vector Database
1. Sign up at https://cloud.qdrant.io
2. Create a new cluster
3. Get API key and URL
4. Update environment variables

#### Embedding Service
1. Run Qwen3-Embedding model locally or use hosted service
2. Example with vLLM:
```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen3-Embedding-0.6B \
  --port 8080
```

## 🧪 Testing

### Run Tests

```bash
# All tests
python run_tests.py

# Specific test categories
python run_tests.py crawler
python run_tests.py auth
python run_tests.py integration

# With coverage
python -m pytest --cov=app --cov-report=html
```

### Test Structure

```
tests/
├── conftest.py              # Test configuration and fixtures
├── test_auth_endpoints.py   # Authentication endpoint tests
├── test_crawl_endpoints.py  # Crawling endpoint tests
├── test_crawler.py          # Crawler logic tests
├── test_embedding_service.py # Embedding service tests
├── test_pdf_processor.py    # PDF processing tests
└── test_qdrant_service.py   # Vector database tests
```

## 🔧 Development

### Code Quality

```bash
# Linting
ruff check .

# Formatting
black .

# Type checking
mypy .
```

### Database Operations

```bash
# Create migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Downgrade
alembic downgrade -1
```

### Docker Development

```bash
# Build development image
docker build -f ../docker/backend/Dockerfile -t rag-backend:dev .

# Run with hot reload
docker run -v $(pwd):/app -p 8000:8000 rag-backend:dev
```

## 📊 Monitoring & Logging

### Structured Logging

All logs are structured JSON with the following fields:
- `timestamp`: ISO 8601 timestamp
- `level`: Log level (INFO, WARNING, ERROR)
- `logger`: Logger name
- `message`: Log message
- `extra`: Additional context fields

### Health Checks

- **Application Health**: `/health` - Overall application status
- **Database Health**: `/health/database` - Database connectivity
- **External Services**: `/health/external` - QDrant and embedding service status

### Metrics

- Request/response times
- Error rates by endpoint
- Background task success/failure rates
- Resource usage (CPU, memory)

## 🚀 Deployment

### Docker Production

```bash
# Build production image
docker build -f ../docker/backend/Dockerfile.prod -t rag-backend:latest .

# Run with docker-compose
docker-compose -f ../docker/docker-compose.yml up -d
```

### Environment-Specific Configs

- **Development**: `.env` - Full debugging, reload enabled
- **Testing**: `.env.test` - Test database, minimal logging
- **Production**: Environment variables - Optimized settings, security enabled

## 🤝 API Usage Examples

### Start a Crawl Job

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/crawl/start",
    json={"crawl_type": "simple", "user_id": "user123"},
    headers={"Authorization": "Bearer your-token"}
)
task_id = response.json()["data"]["task_id"]
```

### Check Job Status

```python
status_response = requests.get(
    f"http://localhost:8000/api/v1/crawl/status/{task_id}",
    headers={"Authorization": "Bearer your-token"}
)
status = status_response.json()
```

### Semantic Search

```python
search_response = requests.post(
    "http://localhost:8000/api/v1/rag/search",
    json={"query": "your search query", "limit": 10},
    headers={"Authorization": "Bearer your-token"}
)
results = search_response.json()
```

## 📝 Contributing

1. Follow PEP 8 style guidelines
2. Add tests for new functionality
3. Update documentation for API changes
4. Use type hints for all function parameters
5. Run full test suite before submitting PR

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in environment
   - Ensure database server is running
   - Verify connection credentials

2. **QDrant Connection Issues**
   - Verify API key and URL
   - Check network connectivity
   - Ensure QDrant service is accessible

3. **Embedding Service Errors**
   - Confirm service is running on correct port
   - Check OPENAI_BASE_URL_EMBED configuration
   - Verify model compatibility

4. **File Upload Issues**
   - Check UPLOAD_DIR permissions
   - Verify MAX_UPLOAD_SIZE settings
   - Ensure sufficient disk space

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=DEBUG uvicorn app.main:app --reload
```

## 📈 Performance Optimization

- **Async Operations**: All I/O operations are async
- **Connection Pooling**: Database and external service connections pooled
- **Caching**: Response caching for frequently accessed data
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Background Processing**: Long-running tasks processed asynchronously

## 🔒 Security

- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based access control
- **Input Validation**: All inputs validated with Pydantic
- **Rate Limiting**: Request throttling to prevent abuse
- **CORS**: Configurable cross-origin resource sharing
- **HTTPS**: SSL/TLS encryption in production
- **Secrets Management**: Sensitive data stored securely

---

Built with FastAPI, SQLAlchemy, and modern Python async patterns for high-performance document processing and retrieval.
