# Web RAG Application

## 🎥 Demo Video
[Watch the Demo](Demo.mp4)

A comprehensive Retrieval-Augmented Generation (RAG) application for processing, indexing, and searching PDF documents from the Biwase website. Features web crawling, PDF text extraction, semantic search, and an intuitive web interface.

## 🌟 Features

- **Web Crawling**: Automated PDF discovery and download from Biwase website
- **PDF Processing**: Advanced text extraction using marker-pdf and OCR
- **Semantic Search**: Vector-based search powered by QDrant and embeddings
- **Modern UI**: Responsive Next.js frontend with real-time progress tracking
- **RESTful API**: FastAPI backend with comprehensive endpoints
- **Background Processing**: Asynchronous task management for long-running operations
- **Docker Support**: Containerized deployment with docker-compose

## 🏗️ Architecture

### Project Structure
```
search_rag/
├── backend/                    # FastAPI backend application
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
```
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

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 18+** with npm/pnpm/yarn
- **QDrant API key** and endpoint URL
- **Embedding service** running on `http://localhost:8080` (Qwen3-Embedding model)

### One-Command Setup

1. **Clone and navigate to the project**:
   ```bash
   git clone <repository-url>
   cd search_rag
   ```

2. **Configure environment**:
   ```bash
   # Copy and edit backend configuration
   cp backend/.env.example backend/.env
   # Edit backend/.env with your QDrant credentials
   ```

3. **Start all services**:
   ```bash
   # Terminal 1: Start API servers
   ./start-apis.sh

   # Terminal 2: Start frontend (after APIs are running)
   ./start-frontend.sh
   ```

4. **Access the application**:
   - **Web Interface**: http://localhost:3000
   - **API Documentation**: http://localhost:8000/docs
   - **API Health Check**: http://localhost:8000/health

## 📋 Detailed Setup

### Backend Setup

1. **Install Python dependencies**:
   ```bash
   cd backend
   pip install -r requirements-core.txt
   pip install -r requirements.txt
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Initialize database**:
   ```bash
   python -m app.core.database  # Creates tables
   ```

### Frontend Setup

1. **Install Node.js dependencies**:
   ```bash
   # Using pnpm (recommended)
   pnpm install

   # Or using npm
   npm install

   # Or using yarn
   yarn install
   ```

2. **Configure environment**:
   ```bash
   cp .env.local.example .env.local  # If needed
   ```

### External Services

1. **QDrant Setup**:
   - Get API key from https://cloud.qdrant.io
   - Update `QDRANT_API_KEY` and `QDRANT_URL` in `backend/.env`

2. **Embedding Service**:
   - Run Qwen3-Embedding model on port 8080
   - Example: `python -m vllm.entrypoints.openai.api_server --model Qwen/Qwen3-Embedding-0.6B --port 8080`

## 🏃 Running the Application

### Development Mode

```bash
# Start all services with auto-reload
./start-apis.sh      # Terminal 1
./start-frontend.sh  # Terminal 2
```

### Production Mode

```bash
# Using Docker Compose
docker-compose -f docker/docker-compose.yml up -d

# Or manually
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 &
cd ../frontend && npm run build && npm start
```

## 📚 API Documentation

### Core Endpoints

- **Health Check**: `GET /health`
- **API Docs**: `GET /docs` (Swagger UI)
- **API Schema**: `GET /openapi.json`

### Crawling API

See [README_CRAWL_API.md](README_CRAWL_API.md) for detailed crawling API documentation.

**Key endpoints**:
- `POST /api/v1/crawl/start` - Start crawling operation
- `GET /api/v1/crawl/status/{task_id}` - Check crawl progress
- `GET /api/v1/crawl/history` - View crawl history

### RAG API

- `POST /api/v1/rag/search` - Semantic search
- `POST /api/v1/rag/ingest` - Ingest documents
- `GET /api/v1/rag/documents` - List documents

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
python run_tests.py

# Run specific test categories
python run_tests.py crawler
python run_tests.py embedding
python run_tests.py qdrant

# Run with coverage
python -m pytest --cov=app --cov-report=html
```

### Frontend Tests

The frontend includes a comprehensive Jest + React Testing Library setup with TypeScript support.

#### Test Configuration

- **Framework**: Jest with jsdom environment
- **Testing Library**: React Testing Library + Testing Library Jest DOM
- **TypeScript**: Full type safety with custom Jest type declarations (`src/jest.d.ts`)
- **Module Mocking**: Configured for `@/` path aliases and external dependencies

#### Running Tests

```bash
cd frontend

# Using pnpm
pnpm test

# Or npm
npm test

# Or yarn
yarn test

# Run specific test file
npm test -- src/hooks/crawl/useCrawlJobForm.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode for development
npm run test:watch
```

#### Test File Patterns

- **Unit Tests**: `*.test.ts`, `*.test.tsx`
- **Integration Tests**: `*.spec.ts`, `*.spec.tsx`
- **Location**: `src/**/__tests__/` or alongside source files
- **Example**: `src/hooks/crawl/useCrawlJobForm.test.ts`

#### Testing Best Practices

1. **Component Testing**:
   - Use `render` from React Testing Library
   - Query elements by accessibility attributes
   - Test user interactions with `fireEvent` or `userEvent`
   - Assert on rendered content and behavior

2. **Hook Testing**:
   - Use `renderHook` for custom hooks
   - Test hook state and side effects
   - Mock external dependencies appropriately

3. **Mocking Strategy**:
   - Mock external APIs and services
   - Use `jest.mock()` for module mocking
   - Provide consistent mock implementations

#### Jest Configuration Details

The project uses a custom Jest configuration (`jest.config.js`) with Next.js integration:

```javascript
{
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  // ... additional configuration
}
```

#### TypeScript Support

Jest globals are properly typed through `src/jest.d.ts`:

```typescript
declare global {
  const jest: typeof jestType;
  const describe: jestType.Describe;
  const it: jestType.It;
  const expect: jestType.Expect;
  // ... other globals
}
```

This ensures full TypeScript intellisense and type checking in test files.

### Integration Tests

```bash
# Run end-to-end tests
./test-integration.sh
```

## 🐳 Docker Deployment

### Development

```bash
# Start all services
docker-compose -f docker/docker-compose.dev.yml up

# With rebuild
docker-compose -f docker/docker-compose.dev.yml up --build
```

### Production

```bash
# Build and deploy
docker-compose -f docker/docker-compose.yml up -d --build

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale frontend=3
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```bash
# Database
DATABASE_URL=sqlite:///./app.db

# QDrant
QDRANT_API_KEY=your_qdrant_key
QDRANT_URL=https://your-instance.qdrant.io

# Embedding Service
OPENAI_BASE_URL_EMBED=http://localhost:8080/v1
OPENAI_API_KEY_EMBED=text

# File Storage
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=52428800

# Processing
MAX_CONCURRENT_PDF_JOBS=2
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

**Frontend (.env.local)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
```

## 📊 Monitoring & Logging

- **Structured Logging**: All services use structured logging with JSON output
- **Health Checks**: Built-in health endpoints for all services
- **Metrics**: Performance monitoring and error tracking
- **Background Tasks**: Asynchronous job processing with status tracking

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run tests**: `python run_tests.py && npm test`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for frontend code
- Add comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Embedding service not accessible**:
   - Ensure Qwen3 model is running on port 8080
   - Check `OPENAI_BASE_URL_EMBED` in backend/.env

2. **QDrant connection failed**:
   - Verify API key and URL in backend/.env
   - Check network connectivity to QDrant instance

3. **PDF processing errors**:
   - Ensure marker-pdf dependencies are installed
   - Check file permissions on upload directories

4. **Frontend API connection**:
   - Verify backend is running on port 8000
   - Check CORS settings in backend configuration

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Review the [Wiki](https://github.com/your-repo/wiki) for detailed guides
- Join our [Discord](https://discord.gg/your-server) for community support

## 📈 Roadmap

- [ ] Advanced query understanding and rewriting
- [ ] Multi-language document support
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Plugin system for custom processors
- [ ] Mobile application companion

---

**Built with ❤️ using FastAPI, Next.js, QDrant, and modern AI technologies**
