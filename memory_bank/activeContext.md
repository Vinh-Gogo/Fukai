# Active Context - Web RAG Backup

## Current State (December 19, 2025)
Major refactoring session completed. Codebase is now well-organized with clean architecture.

## Recent Changes

### Session 2 - Bug Fixes & Feature Updates
1. **Fixed "document is not defined"** - Added `typeof document !== 'undefined'` guard in NavigationItem.tsx
2. **Fixed hydration mismatch** - useCrawlJobs now initializes with `[]` and loads from localStorage in useEffect
3. **CollapseToggle → Fly component** - Replaced poop emoji with animated fly 🪰 at random position
4. **Added right-click auth menu** - Context menu with login/logout buttons on fly
5. **Refactored CollapseToggle** - Extracted 3 custom hooks + 2 sub-components

### Session 1 - Structure Refactoring (Completed)
1. **Removed duplicate hook files** - Hooks now only in subdirectories (`hooks/activity/`, `hooks/chat/`, etc.)
2. **Removed duplicate lib files** - Services only in subdirectories (`lib/archive/`, `lib/chat/`, etc.)
3. **Consolidated components** - Moved `app/pdfs/components/` → `components/pdf/` and `app/archive/components/` → `components/archive/`
4. **Unified type definitions** - All types now in `@/types/`, lib files import and re-export
5. **Standardized imports** - All using barrel exports (`@/hooks`, `@/types`, `@/components`)
6. **Created NavigationSkeleton** - Extracted repeated loading skeleton into shared component
7. **Fixed route naming** - Renamed `activity-dashboard` → `activity_dashboard` (underscore)

### Import Patterns Established
```typescript
// Hooks - use barrel export
import { useCrawlJobs, useFileManager } from '@/hooks';

// Types - use @/types barrel
import { CrawlJob, PDFFile } from '@/types';
// OR from lib (re-exported for convenience)
import { CrawlJob } from '@/lib/crawl';

// Components - use barrel exports
import { Navigation, NavigationSkeleton } from '@/components/navigation';

// Utilities
import { cn } from '@/lib/utils';  // STANDARD
```

## Active Decisions

### Type Location
- **Decision**: Types defined ONLY in `src/types/`
- **Reason**: Single source of truth, no duplication
- **Pattern**: `lib/` files import from `@/types` and re-export for backwards compatibility

### Component Colocation
- **Decision**: All components in `src/components/`, not colocated with pages
- **Reason**: Easier to share, clearer import paths
- **Structure**: Feature-based folders (pdf/, archive/, crawl/, etc.)

### SSR Handling
- **Decision**: Use `export const runtime = 'edge'` for client-heavy pages
- **Pattern**: Dynamic import Navigation with `ssr: false`

## Next Steps (Potential)
1. **Integrate core architecture into existing components** - Update hooks and components to use new APIClient, state management, and error boundaries
2. **Add comprehensive unit tests** - Create tests for core utilities, hooks, and components using the new testing framework
3. **Implement real API endpoints** - Replace mock services with actual backend integration
4. **Add performance monitoring** - Implement bundle analysis and runtime performance tracking
5. **Security hardening** - Apply security utilities to API routes and user inputs
6. **Configuration integration** - Connect configuration system to feature flags and environment settings

## Known Issues
None currently - build passes successfully.

## Important Patterns to Remember

### Adding New Hooks
1. Create in appropriate subdirectory (`hooks/{feature}/`)
2. Export from subdirectory's `index.ts`
3. Types go in `types/{feature}.ts`

### Adding New Components
1. Create in `components/{feature}/`
2. Export from `index.ts`
3. Use `cn` from `@/lib/utils` for styling

### Adding New Types
1. Add to appropriate file in `types/`
2. Export from `types/index.ts`
3. If needed in lib, re-export with `export type { X } from '@/types'`
