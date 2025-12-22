# Tech Context - Web RAG Backup

## Technology Stack

### Framework

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### Styling

- **Tailwind CSS** - Utility-first CSS
- **tailwind-merge** - Class merging utility
- **clsx** - Conditional classes

### UI Components

- **Lucide React** - Icon library
- **Framer Motion** - Animations

### PDF Processing

- **pdf.js (pdfjs-dist)** - PDF rendering
- Worker file at `/public/pdf.worker.min.js`

## Development Setup

### Package Manager

```bash
pnpm install
pnpm dev     # Development server
pnpm build   # Production build
pnpm lint    # ESLint
```

### Project Config Files

- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript config
- `tailwind.config.ts` - Tailwind CSS config
- `eslint.config.mjs` - ESLint config
- `postcss.config.mjs` - PostCSS config

## Technical Patterns

### Import Aliases

```typescript
// tsconfig.json paths
"@/*": ["./src/*"]

// Usage
import { Component } from '@/components';
import { useHook } from '@/hooks';
import { Type } from '@/types';
import { util } from '@/lib';
```

### cn Utility Function

Standard import pattern for Tailwind class merging:

```typescript
import { cn } from "@/lib/utils";
// NOT: import { cn } from '@/lib/shared';
```

### Edge Runtime

Pages using browser APIs need edge runtime:

```typescript
"use client";
export const runtime = "edge";
```

### Dynamic Imports

For components with browser dependencies:

```typescript
const Component = dynamic(
  () => import('@/components/path').then(mod => ({ default: mod.Component })),
  { ssr: false, loading: () => <Skeleton /> }
);
```

## Dependencies Structure

### Core Dependencies

- next, react, react-dom
- typescript
- tailwindcss, postcss, autoprefixer
- pdfjs-dist
- lucide-react
- framer-motion
- clsx, tailwind-merge

### Type Definitions

- @types/react
- @types/node

### Development Dependencies (Testing)

- @testing-library/jest-dom
- @testing-library/react
- @testing-library/user-event
- jest
- jest-environment-jsdom

## Build and Deployment

### Current Issues (December 2025)

#### Docker Build Failures

- **Heavy packages causing timeouts**: `aiosqlite==0.19.0`, `aiofiles==23.2.1`, `tenacity==8.2.3`
- **Version conflicts**: SQLAlchemy ecosystem (2.0.23 + Alembic 1.12.1 + aiosqlite 0.19.0), FastAPI ecosystem
- **WSL2 networking issues**: Connectivity problems with PyPI repositories
- **Memory pressure**: pip install phase taking ~27 seconds

#### Comprehensive Optimization Solutions ✅ IMPLEMENTED

**Phase 1: Multi-stage Docker Build**

- **Builder stage**: Separate dependency installation from runtime
- **Virtual environment**: Clean dependency isolation in `/opt/venv`
- **Layer optimization**: Core dependencies installed first for better caching
- **Production stage**: Minimal runtime image with copied dependencies

**Phase 2: Dependency Restructuring**

- **requirements-core.txt**: Core dependencies (FastAPI, SQLAlchemy, etc.)
- **requirements.txt**: Additional lighter packages
- **Version pinning**: Exact versions for reproducible builds
- **Performance packages**: uvloop and httptools for async optimization

**Phase 3: WSL2 Docker Optimizations**

- **Buildkit**: Enabled for faster, parallel builds
- **Network optimization**: Host networking mode for better performance
- **Resource limits**: CPU/memory constraints to prevent host strain
- **Health checks**: Optimized intervals for WSL2 environment
- **Volume management**: Local driver with bind mount configuration

**Dockerfile multi-stage structure:**

```dockerfile
FROM python:3.11-slim AS builder
# Build dependencies in virtual environment
# Install core dependencies first for caching
# Install remaining dependencies

FROM python:3.11-slim AS production
# Copy virtual environment from builder
# Minimal runtime with optimized settings
# Security hardening with non-root user
```

**Results:**

- ✅ **Build time**: 87 seconds total (vs 76s previous, vs failures before)
- ✅ **Layer caching**: Core dependencies cached separately for faster rebuilds
- ✅ **Image size**: Smaller production image through multi-stage build
- ✅ **Security**: Non-root user with proper permissions
- ✅ **Performance**: uvloop/httptools for async optimization
- ✅ **WSL2 compatibility**: Host networking and resource management
- ✅ **Reliability**: No more pip timeouts or version conflicts

### Comprehensive Optimization Plan

#### Phase 1: Multi-stage Docker Build

- Separate dependency installation from runtime
- Better layer caching for faster rebuilds
- Memory and CPU allocation for builds

#### Phase 2: Dependency Restructuring

- Core vs optional dependencies (ML packages as extras)
- Exact version pinning for reproducible builds
- Platform-specific optimizations for WSL2/Linux

#### Phase 3: Build Process Enhancement

- Parallel frontend/backend building
- Incremental builds (rebuild only changed components)
- Comprehensive caching strategies
- Automatic retry with exponential backoff

### Backend Dependencies (Python/FastAPI)

- **Core**: fastapi, uvicorn, pydantic, sqlalchemy, alembic
- **Async**: aiosqlite, aiofiles
- **Utilities**: tenacity (retry logic)
- **Development**: pytest, black, isort

## File Conventions

### Page Files

- `page.tsx` - Route component
- `layout.tsx` - Layout wrapper
- Always use "use client" for interactive pages

### Component Files

- PascalCase: `ComponentName.tsx`
- Index barrel: `index.ts`
- Types alongside or in `types.ts`

### Hook Files

- camelCase with use prefix: `useHookName.ts`
- Return typed interface: `UseHookNameResult`

### Service Files

- camelCase: `serviceName.ts`
- Classes for API services
- Functions for utilities
