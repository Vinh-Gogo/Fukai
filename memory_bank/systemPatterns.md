# System Patterns - Web RAG Backup

## Architecture Overview

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Crawl Dashboard (/)
│   ├── pdfs/              # PDF Processing (/pdfs)
│   ├── archive/           # Archive Management (/archive)
│   ├── rag/               # RAG Query (/rag)
│   ├── activity_dashboard/ # Activity Dashboard
│   └── api/               # API routes
├── components/            # Shared React components
│   ├── activity/          # Activity dashboard components
│   ├── archive/           # Archive file components
│   ├── crawl/             # Crawl job components
│   ├── features/          # Feature-specific components
│   ├── layout/            # Layout components (BrandHeader)
│   ├── navigation/        # Navigation sidebar components
│   ├── pdf/               # PDF viewer components
│   ├── rag/               # Chat/RAG components
│   ├── status/            # Status indicators
│   ├── ui/                # UI primitives
│   └── uploads/           # File upload components
├── hooks/                 # Custom React hooks (organized by feature)
│   ├── activity/          # Activity hooks
│   ├── chat/              # Chat hooks
│   ├── crawl/             # Crawl hooks
│   ├── file/              # File management hooks
│   ├── navigation/        # Navigation hooks
│   ├── pdf/               # PDF hooks
│   ├── ui/                # UI hooks
│   └── utils/             # Utility hooks
├── lib/                   # Services and utilities
│   ├── archive/           # Archive utilities
│   ├── chat/              # Chat service
│   ├── crawl/             # Crawl service + API client
│   ├── pdf/               # PDF utilities
│   └── shared/            # Shared utilities (cn, etc.)
├── types/                 # TypeScript type definitions
│   ├── activity.ts        # Activity types
│   ├── archive.ts         # Archive types
│   ├── chat.ts            # Chat types
│   ├── crawl.ts           # Crawl types
│   ├── pdf.ts             # PDF types
│   └── index.ts           # Barrel export
└── config/                # Configuration files
    └── navigation.config.ts
```

## Key Design Patterns

### 1. Barrel Exports
All directories use `index.ts` for clean imports:
```typescript
// Instead of: import { useCrawlJobs } from '@/hooks/crawl/useCrawlJobs'
import { useCrawlJobs } from '@/hooks';

// Instead of: import { CrawlJob } from '@/lib/crawl/index'
import { CrawlJob } from '@/types';
```

### 2. Type Source of Truth
- All types defined in `src/types/` directory
- `lib/` files import types from `@/types` and re-export for backwards compatibility
- Never duplicate type definitions across files

### 3. Dynamic Imports for SSR Safety
```typescript
const Navigation = dynamic(
  () => import('@/components/navigation').then(mod => ({ default: mod.Navigation })),
  { ssr: false, loading: () => <NavigationSkeleton /> }
);
```

### 4. Custom Hooks Pattern
- Hooks organized by feature domain
- Each hook returns a typed result interface
- Hooks handle state, side effects, and derived computations
- **Hydration-safe**: Initialize with default values, load from storage in useEffect

### 5. Component Organization
- Feature components in `components/{feature}/`
- Shared UI primitives in `components/ui/`
- Each folder has `index.ts` barrel export
- **Extract sub-components** when JSX exceeds ~50 lines
- **Extract custom hooks** when logic is reusable or complex

### 6. Service Layer
- API calls abstracted in `lib/{feature}/`
- `CrawlService` class for crawl API
- `StorageService` for localStorage operations

### 7. SSR/Edge Runtime Safety
```typescript
// Guard browser APIs at module level
if (typeof document !== 'undefined') {
  // Safe to use document
}

// Initialize state without browser APIs
const [data, setData] = useState([]); // NOT useState(loadFromStorage())
useEffect(() => {
  setData(loadFromStorage()); // Load after mount
}, []);
```

## Critical Implementation Details

### Navigation
- Dynamically imported to avoid SSR issues
- `NavigationSkeleton` component for loading state
- Controlled via `useNavigationState` hook

### PDF Viewer
- Uses pdf.js library (dynamically loaded)
- Virtualized rendering for performance
- Custom hooks: `usePDFLoader`, `usePDFRenderer`

### Crawl Jobs
- Multi-stage: pages → articles → pdfs
- State persisted in localStorage
- Real-time progress updates

### File Upload
- Drag-and-drop zone component
- Progress tracking per file
- Supports batch uploads
