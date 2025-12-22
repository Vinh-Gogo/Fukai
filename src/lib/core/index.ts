// Core architecture utilities barrel export
export {
  default as ErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
} from "./ErrorBoundary";
export {
  default as APIClient,
  CrawlAPI,
  FileAPI,
  ChatAPI,
  ActivityAPI,
  APIError,
  NetworkError,
  TimeoutError,
  isNetworkError,
  isClientError,
  isServerError,
} from "./APIClient";
export type { APIResponse, RequestConfig } from "./APIClient";
export {
  useEnhancedState,
  createStateManager,
  useStateManager,
  createValidationRules,
  loggerMiddleware,
  debounceMiddleware,
  localStorageAdapter,
  memoryAdapter,
} from "./StateManager";
export type { StorageAdapter } from "./StateManager";
export {
  InputSanitizer,
  CSRFProtection,
  CSPUtils,
  SecurityHeaders,
  FileUploadSecurity,
  rateLimiters,
} from "./Security";
export {
  useVirtualList,
  useLazyImage,
  useDebounce,
  useThrottle,
  memo,
  PerformanceMonitor,
  ResourceLoader,
  BundleAnalyzer,
  MemoryLeakDetector,
  performanceUtils,
} from "./Performance";
