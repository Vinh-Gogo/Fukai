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
import { cn } from '@/lib/utils';
// NOT: import { cn } from '@/lib/shared';
```

### Edge Runtime
Pages using browser APIs need edge runtime:
```typescript
"use client";
export const runtime = 'edge';
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
