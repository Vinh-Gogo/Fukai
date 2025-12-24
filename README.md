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
