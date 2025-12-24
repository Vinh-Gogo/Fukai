# Search RAG Backend

A high-performance FastAPI backend for document search and Retrieval-Augmented Generation (RAG) operations.

## Features

- 🚀 **FastAPI**: Modern, async Python web framework
- 🔍 **Document Search**: Semantic search across uploaded documents
- 🤖 **RAG Pipeline**: Question-answering using retrieved documents
- 📊 **Vector Database**: Qdrant integration for efficient similarity search
- 🔐 **Authentication**: JWT-based user authentication
- 📁 **Document Processing**: Support for PDF, DOCX, TXT, and MD files
- ⚡ **Background Tasks**: Celery-based async processing
- 📝 **Structured Logging**: JSON logging with request tracing
- 🏥 **Health Checks**: Comprehensive system monitoring
- 🐳 **Container Ready**: Docker and docker-compose support

## Architecture

### Project Structure

```
backend/
├── app/
│   ├── api/              # API routes and endpoints
│   ├── core/             # Core functionality (auth, exceptions, events)
│   ├── config/           # Configuration management
│   ├── models/           # Database models
│   ├── services/         # Business logic layer
│   ├── utils/            # Utility functions
│   └── workers/          # Background task processing
├── tests/                # Test suite
├── requirements/         # Python dependencies
├── scripts/              # Utility scripts
├── migrations/           # Database migrations
└── docs/                 # Documentation
```

### API Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Comprehensive health check
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/documents/upload` - Upload documents
- `GET /api/v1/search/` - Search documents
- `POST /api/v1/rag/ask` - Ask questions using RAG
- `GET /docs` - API documentation (Swagger UI)

## Quick Start

### Prerequisites

- Python 3.9+
- Redis (for background tasks)
- Qdrant (vector database)

### Installation

1. **Clone and setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements/dev.txt
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the application:**
   ```bash
   # Start the FastAPI server
   python -m app.main

   # Or using uvicorn directly
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

The API will be available at `http://localhost:8000` and documentation at `http://localhost:8000/docs`.

### Docker Setup

```bash
# Build and run with docker-compose
docker-compose up -d

# Or build manually
docker build -t search-rag-backend .
docker run -p 8000:8000 search-rag-backend
```

## Configuration

### Environment Variables

Key configuration options:

- `DATABASE_URL`: Database connection string
- `QDRANT_URL`: Vector database URL
- `OPENAI_API_KEY`: OpenAI API key for LLM operations
- `SECRET_KEY`: JWT signing key (change in production)
- `DEBUG`: Enable/disable debug mode

See `.env.example` for all available options.

### External Services

The backend requires these external services:

- **Qdrant**: Vector database for document embeddings
- **Redis**: Message broker for background tasks
- **PostgreSQL/MySQL**: Primary database (optional, defaults to SQLite)

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_api/test_health.py
```

### Code Quality

```bash
# Format code
black .
isort .

# Lint code
flake8 app tests

# Type checking
mypy app
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Add new table"

# Run migrations
alembic upgrade head

# Downgrade
alembic downgrade -1
```

### Background Tasks

```bash
# Start Celery worker
celery -A app.workers.celery_app worker --loglevel=info

# Start Celery beat (scheduler)
celery -A app.workers.celery_app beat --loglevel=info
```

## API Usage Examples

### Authentication

```bash
# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=user&password=password"

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:8000/api/v1/documents/"
```

### Document Upload

```bash
curl -X POST "http://localhost:8000/api/v1/documents/upload" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@document.pdf"
```

### Search

```bash
curl "http://localhost:8000/api/v1/search/?query=your%20search%20term" \
     -H "Authorization: Bearer YOUR_TOKEN"
```

### RAG Query

```bash
curl -X POST "http://localhost:8000/api/v1/rag/ask?question=What%20is%20machine%20learning?" \
     -H "Authorization: Bearer YOUR_TOKEN"
```

## Deployment

### Production Checklist

- [ ] Set `DEBUG=false`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure production database
- [ ] Set up proper CORS origins
- [ ] Configure external service URLs
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL/TLS certificates

### Docker Production

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: .
    environment:
      - ENVIRONMENT=production
      - DEBUG=false
    env_file:
      - .env.production
```

## Monitoring

### Health Checks

- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed system status

### Metrics

The application exposes Prometheus metrics at `/metrics` (when configured).

### Logging

- Structured JSON logging for production
- Request ID tracing
- Configurable log levels

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Development Guidelines

- Use type hints for all function parameters
- Write comprehensive docstrings
- Follow PEP 8 style guidelines
- Add tests for new features
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- 📖 [API Documentation](http://localhost:8000/docs)
- 🐛 [Issue Tracker](https://github.com/your-org/search-rag/issues)
- 💬 [Discussions](https://github.com/your-org/search-rag/discussions)
