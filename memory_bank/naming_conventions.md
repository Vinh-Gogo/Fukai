# Naming Conventions & Code Organization

## 📁 **File & Directory Naming**

### **General Rules**
- **kebab-case** for file and directory names
- **PascalCase** for React components
- **camelCase** for utilities, hooks, and services
- **snake_case** for Python backend files

### **Directory Structure**
```
src/
├── app/                    # Next.js app directory (kebab-case)
├── components/             # React components
│   ├── ui/                # Design system components
│   ├── feature-name/      # Feature-specific components
│   └── index.ts           # Barrel exports
├── hooks/                 # Custom hooks
│   ├── feature-name/      # Feature-specific hooks
│   └── index.ts           # Barrel exports
├── lib/                   # Utility libraries
├── stores/                # Zustand stores
├── types/                 # TypeScript type definitions
└── config/                # Configuration files

backend/
├── app/                   # FastAPI application
├── tests/                 # Test files
└── alembic/               # Database migrations
```

### **File Naming Patterns**

#### **React Components** (`*.tsx`)
```
ComponentName.tsx          # Main component file
ComponentName.stories.tsx  # Storybook stories (future)
ComponentName.test.tsx     # Unit tests (future)
```

#### **Hooks** (`*.ts`)
```
useFeatureName.ts          # Custom hook
useFeatureName.test.ts     # Hook tests (future)
```

#### **Utilities** (`*.ts`)
```
utilityName.ts             # Utility functions
utilityName.test.ts        # Utility tests (future)
```

#### **Types** (`*.ts`)
```
featureName.ts             # Type definitions
```

## 🏗️ **Component Architecture**

### **Component Organization**
```
components/
├── ui/                    # Design system (atoms)
│   ├── Button.tsx
│   ├── Input.tsx
│   └── index.ts
├── forms/                 # Form components (molecules)
│   ├── LoginForm.tsx
│   └── index.ts
├── features/              # Feature components (organisms)
│   ├── UserProfile.tsx
│   └── index.ts
└── layouts/               # Layout components (templates)
    ├── MainLayout.tsx
    └── index.ts
```

### **Component Naming**
- **Base components**: `Button`, `Input`, `Card`
- **Composite components**: `ButtonGroup`, `InputField`, `CardList`
- **Feature components**: `UserProfile`, `DocumentViewer`
- **Layout components**: `MainLayout`, `SidebarLayout`

## 🎯 **Hook Organization**

### **Hook Categories**
```
hooks/
├── ui/                    # UI-related hooks
│   ├── useLoading.ts
│   ├── useTheme.ts
│   └── index.ts
├── features/              # Feature-specific hooks
│   ├── useAuth.ts
│   ├── useDocuments.ts
│   └── index.ts
├── utils/                 # Utility hooks
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── index.ts
```

### **Hook Naming**
- **State hooks**: `useAuth`, `useTheme`
- **Data hooks**: `useDocuments`, `useUsers`
- **UI hooks**: `useLoading`, `useModal`
- **Utility hooks**: `useLocalStorage`, `useDebounce`

## 📦 **Export Patterns**

### **Barrel Exports** (`index.ts`)
```typescript
// Single export
export { ComponentName } from './ComponentName'
export type { ComponentProps } from './ComponentName'

// Multiple exports
export {
  ComponentA,
  ComponentB,
  type ComponentAProps,
  type ComponentBProps
} from './components'
```

### **Consistent Export Order**
1. **React components** first
2. **Custom hooks** second
3. **Utilities** third
4. **Types** last

## 🏷️ **TypeScript Types**

### **Type Naming**
```typescript
// Interfaces
interface ComponentProps {}
interface HookReturnType {}

// Types
type ComponentVariant = 'primary' | 'secondary'
type Status = 'idle' | 'loading' | 'success' | 'error'

// Generics
type ApiResponse<T> = { data: T; error?: string }
type ComponentWithRef<T> = React.ForwardRefExoticComponent<T>
```

### **File Organization**
```typescript
// types/featureName.ts
export interface FeatureProps {}
export type FeatureState = {}
export type FeatureActions = {}
```

## 🔧 **Backend Naming (Python)**

### **File Structure**
```
backend/
├── app/
│   ├── api/               # API endpoints
│   ├── core/              # Core functionality
│   ├── models/            # Database models
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   └── repositories/      # Data access
├── tests/                 # Test files
└── alembic/               # Migrations
```

### **Python Naming**
- **snake_case** for files and functions
- **PascalCase** for classes
- **UPPER_CASE** for constants

## ✅ **Migration Plan**

### **Phase 1: Analysis** ✅
- [x] Document current naming patterns
- [x] Identify inconsistencies
- [x] Create standardization guidelines

### **Phase 2: Standardization** 🔄
- [ ] Rename files to follow conventions
- [ ] Update import statements
- [ ] Update barrel exports
- [ ] Update documentation

### **Phase 3: Verification** ⏳
- [ ] Ensure all imports work
- [ ] Run build to verify no breaking changes
- [ ] Update any documentation references

## 📋 **Current Issues Found**

### **Component Files**
- Some components use inconsistent casing
- Missing index.ts files in some directories
- Inconsistent export patterns

### **Hook Files**
- Some hooks don't follow `use*` convention
- Missing index.ts files in subdirectories

### **Type Files**
- Inconsistent organization of types
- Some types mixed with implementation

## 🎯 **Standards to Apply**

1. **All component files**: PascalCase for React components
2. **All hook files**: `use*` prefix with camelCase
3. **All utility files**: camelCase
4. **All directories**: kebab-case
5. **All barrel exports**: Consistent ordering
6. **All type files**: Clear organization and naming

This standardization will improve:
- **Developer experience** with predictable file locations
- **Code maintainability** with consistent patterns
- **Build performance** with optimized imports
- **Team collaboration** with shared conventions
