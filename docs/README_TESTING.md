# Testing Infrastructure

This document outlines the comprehensive testing infrastructure implemented for the RAG application.

## 📋 **Testing Stack**

### **Core Testing Framework**
- **Jest**: JavaScript testing framework with built-in mocking and assertion library
- **React Testing Library**: Testing utilities for React components
- **Jest DOM**: Custom Jest matchers for DOM testing
- **User Event**: Simulates real user interactions

### **Configuration**
- **Jest Config**: `jest.config.js` - Main configuration with Next.js integration
- **Setup File**: `jest.setup.js` - Global test setup and mocks
- **TypeScript**: Full TypeScript support with `@types/jest`

## 🏗️ **Project Structure**

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.test.tsx          # Component tests
│   │   └── ...
│   └── ...
├── hooks/
│   ├── crawl/
│   │   ├── useCrawlJobForm.test.ts  # Hook tests
│   │   └── ...
│   └── ...
├── lib/
│   └── utils.test.ts                # Utility tests
├── stores/
│   └── auth.test.ts                 # Store tests
└── ...
```

## 🧪 **Test Categories**

### **1. Unit Tests**
- Pure functions and utilities
- Custom hooks logic
- Component rendering and behavior
- State management logic

### **2. Integration Tests**
- Component interactions
- API integration (mocked)
- Form submissions
- Navigation flows

### **3. End-to-End Tests** (Future)
- Full user workflows
- Cross-browser testing
- Performance testing

## 📝 **Writing Tests**

### **Component Tests**
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### **Hook Tests**
```typescript
import { renderHook, act } from '@testing-library/react'
import { useCrawlJobForm } from './useCrawlJobForm'

describe('useCrawlJobForm', () => {
  it('updates URL when handleUrlChange is called', () => {
    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    act(() => {
      result.current.handleUrlChange('https://example.com')
    })

    expect(result.current.url).toBe('https://example.com')
  })
})
```

### **Mocking Strategy**
```typescript
// Mock external dependencies
jest.mock('@/lib/crawl', () => ({
  validateUrl: jest.fn(),
}))

// Mock API calls
global.fetch = jest.fn()

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockReturnValue({
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
})
```

## 🚀 **Running Tests**

### **Available Scripts**
```bash
# Run all tests
npm test
# or
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI (no watch, with coverage)
npm run test:ci
```

### **Test Commands**
```bash
# Run specific test file
npm test Button.test.tsx

# Run tests for specific directory
npm test src/components/ui/

# Run tests matching pattern
npm test -- --testNamePattern="renders with default props"
```

## 📊 **Coverage Requirements**

### **Coverage Goals**
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 85%
- **Lines**: > 80%

### **Coverage Configuration**
```javascript
// jest.config.js
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/pages/_app.tsx',
  '!src/pages/_document.tsx',
],
coverageThreshold: {
  global: {
    statements: 80,
    branches: 75,
    functions: 85,
    lines: 80,
  },
},
```

## 🔧 **Mocking Guidelines**

### **External APIs**
```typescript
// Mock fetch globally
global.fetch = jest.fn()

// Mock specific API responses
fetch.mockImplementationOnce(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'mocked' }),
  })
)
```

### **Browser APIs**
```typescript
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock
```

### **Custom Hooks**
```typescript
// Mock custom hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User' },
    isAuthenticated: true,
  }),
}))
```

## 🏃 **Test Performance**

### **Optimization Techniques**
- **Parallel test execution**: Jest runs tests in parallel by default
- **Smart mocking**: Only mock what's necessary
- **Test isolation**: Clean up after each test
- **Selective testing**: Use `test.only()` and `test.skip()` for debugging

### **Performance Best Practices**
```typescript
// Use beforeEach/beforeAll for expensive setup
beforeAll(() => {
  // Expensive setup (database, API mocks)
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})
```

## 📈 **CI/CD Integration**

### **GitHub Actions Example**
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 🎯 **Testing Philosophy**

### **Principles**
1. **Test behavior, not implementation**
2. **Keep tests simple and readable**
3. **Use descriptive test names**
4. **Test edge cases and error conditions**
5. **Maintain test independence**

### **Best Practices**
- ✅ Test user-facing behavior
- ✅ Use semantic queries (`getByRole`, `getByLabelText`)
- ✅ Mock external dependencies
- ✅ Test error states and loading states
- ✅ Keep tests fast and reliable
- ✅ Write tests alongside code (TDD/BDD)

### **Anti-patterns**
- ❌ Testing implementation details
- ❌ Over-mocking (leads to brittle tests)
- ❌ Testing third-party code
- ❌ Slow, flaky tests
- ❌ Tests that require manual intervention

## 📚 **Resources**

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🎉 **Getting Started**

1. **Install dependencies**: `npm install`
2. **Run tests**: `npm test`
3. **View coverage**: `npm run test:coverage`
4. **Watch mode**: `npm run test:watch`

The testing infrastructure is now ready for comprehensive test coverage across the entire RAG application! 🚀
