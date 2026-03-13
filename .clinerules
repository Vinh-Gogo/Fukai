# Cline's Project Rules for Fukai

## Project Intelligence & Patterns

### Environment & Setup
- **Issue**: `.env.example` file was missing or inaccessible during setup
- **Status**: Needs investigation on first startup
- **Workaround**: May need to create `.env` from scratch or locate original

### Architecture Notes
- Monorepo structure with pnpm workspace (not npm, not yarn)
- Separate Python and Node.js dependency trees
- Two entry points: `python run_server.py` for backend, `pnpm dev` for frontend
- FastAPI backend at port 8000, Next.js frontend at port 3000

### Frontend Patterns
- Component organization by feature (not by type) - very intentional
- Example: `/components/archive/` has FileCard, FileGrid, FileList, StorageStats together
- Heavy use of custom hooks organized by feature domain
- Zustand for state (lightweight, not Redux complexity)

### Backend Patterns
- FastAPI dependency injection pattern for services
- Pydantic models for request/response validation
- Async/await throughout (important for non-blocking I/O)
- Celery for background tasks (imported in settings but verify usage)

### Testing
- Jest for frontend testing
- Jest setup file exists (jest.setup.js) - middleware configured
- Test suites likely in `__tests__` directories (pdfs/__tests__/ visible)
- Backend testing configuration in pyproject.toml

### Common Tasks
- **Start backend**: `python run_server.py`
- **Start frontend**: `pnpm dev`
- **View API docs**: http://127.0.0.1:8000/docs after running backend
- **Check health**: `curl -H "X-API-Key: your-key" http://127.0.0.1:8000/api/v1/health`

### Known Patterns to Watch
1. API key authentication is mandatory (no public endpoints observed)
2. Real-time features likely use polling based on architecture review
3. PDF processing is async via Celery (not synchronous)
4. Vector search is semantic-based (no keyword fallback)

### Integration Points to Verify
- [ ] Frontend successfully calls backend API
- [ ] WebSocket or polling for real-time updates
- [ ] Celery worker receives and processes jobs
- [ ] QDrant vector database connection
- [ ] Embedding service endpoint configuration

### Development Workflow
- Use pnpm commands (not npm)
- Python development uses async patterns
- Frontend has component tests via Jest
- API documentation available at `/docs` endpoint

### Potential Gotchas
1. **Environment required**: Server won't start without `.env` properly set
2. **Multiple services**: Must run worker separately from API
3. **Vector DB dependency**: QDrant must be running for search features
4. **Port conflicts**: Default ports 3000 (frontend), 8000 (backend), 6333 (QDrant), 8080 (embed service)
5. **Monorepo commands**: Use `pnpm` from workspace root, not individual package directories

### Type Safety
- TypeScript throughout frontend
- Pydantic models provide runtime validation on backend
- Type definitions in `/src/types/` are comprehensive

### State Management Philosophy
- Zustand chosen deliberately for simplicity
- Per-feature custom hooks (auth, chat, crawl, file, etc.)
- No complex global state needed (good decision)

### Feature Areas (Top-Level Organization)
- **Activity**: Tracking and monitoring
- **Archive**: File management
- **Chat**: RAG interaction
- **Crawl**: Web crawling configuration and monitoring
- **Features**: Core user-facing functionality
- **PDF**: Document viewing and management
- **RAG**: Search and retrieval
- **Search**: Query interface
- **Upload**: Document ingestion

## Working Assumptions
- Project is actively developed (recent structure)
- Docker production-ready (compose file present)
- API fully exposed via REST (not GraphQL)
- Authentication is role-agnostic (simple API key)
- No multi-tenant support yet (single user context)

## Update Log
- Initial Memory Bank creation: 2026-03-13
