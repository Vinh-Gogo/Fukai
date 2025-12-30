# Web RAG Application

A comprehensive Retrieval-Augmented Generation (RAG) application for processing, indexing, and searching PDF documents. Features web crawling, PDF text extraction, semantic search, vector embeddings, and an intuitive web interface with real-time progress tracking.

## 🌟 Features

- **Web Crawling**: Automated PDF discovery and download with configurable targets
- **PDF Processing**: Advanced text extraction using marker-pdf and OCR
- **Semantic Search**: Vector-based search powered by QDrant and embeddings
- **Modern UI**: Responsive Next.js frontend with real-time progress tracking
- **RESTful API**: FastAPI backend with comprehensive endpoints
- **Background Processing**: Asynchronous task management for long-running operations
- **Docker Support**: Containerized deployment with docker-compose

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd search_rag
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**
   ```bash
   pnpm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the Application

#### Backend API Server

Choose one of the following methods to run the FastAPI backend:

**Method 1: Using the launcher script (Recommended)**
```bash
python run_server.py
```

**Method 2: Using Python module mode**
```bash
python -m src.rag_server.main
```

**Method 3: Using Uvicorn directly**
```bash
uvicorn src.rag_server.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at:
- **API Server**: http://127.0.0.1:8000
- **API Documentation**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc
- **OpenAPI Schema**: http://127.0.0.1:8000/openapi.json

#### Frontend Development Server

```bash
pnpm dev
```

The frontend will be available at: http://localhost:3000

#### Using Docker (Production)

```bash
docker-compose up -d
```

### API Authentication

Most API endpoints require authentication. Include the API key in requests:

```bash
curl -H "X-API-Key: your-api-key" http://127.0.0.1:8000/api/v1/health
```

## 🏗️ Architecture

### Project Structure

```text
search_rag/
├── src/                        # Next.js frontend source code
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── stores/                 # State management (Zustand)
│   ├── types/                  # TypeScript type definitions
│   └── config/                 # Frontend configuration
├── public/                     # Static assets
├── package.json                # Frontend dependencies and scripts
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.mjs           # ESLint configuration
└── [other config files]
```

### Service Architecture

```c
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI    │    │   FastAPI       │    │   QDrant        │
│   (Port 3000)   │◄──►│   Backend       │◄──►│   Vector DB     │
│                 │    │   (Port 8000)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │  Embedding      │
                    │  Service        │
                    │  (Port 8080)    │
                    └─────────────────┘
```

### Components

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS, and shadcn/ui
- **Backend**: FastAPI with SQLAlchemy, Pydantic, and async support
- **Vector Database**: QDrant for high-performance vector similarity search
- **Embedding Service**: Qwen3-Embedding model for text vectorization
- **PDF Processing**: marker-pdf with OCR capabilities
- **Task Queue**: Background job processing for document ingestion
