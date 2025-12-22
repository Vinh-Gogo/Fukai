/**
 * Centralized types barrel export
 *
 * This file provides a single entry point for all application types,
 * organized by feature domain for better maintainability and tree-shaking.
 */

// PDF Types
export type {
  PDFDocumentProxy,
  PDFPageProxy,
  PDFViewport,
  PDFRenderOptions,
  PDFRenderTaskProxy,
  PDFMetadata,
  PDFInfo,
  PDFTextContent,
  PDFDocumentInfo,
  PDFFile,
  PDFFileStatus,
  UploadProgress,
  UploadStatus,
  PDFRenderTask,
  PDFError,
  PDFLoaderError,
  PDFRenderError,
  UsePDFLoaderResult,
  UsePDFRendererResult,
  FileDisplayProps,
  TableRowProps,
  PDFViewerProps,
  PageContentProps,
  FileUploadZoneProps,
  UploadProgressBarProps,
  VirtualizationConfig,
  VirtualizationResult,
  PDFVirtualizationResult,
  ComponentWithChildren,
} from "./pdf";

export { isPDFFile, isUploadCompleted, isUploadFailed } from "./pdf";

// Crawl Types
export type {
  CrawlJob,
  CrawlSettings,
  CrawlStats,
  CrawlAPIResponse,
  DownloadAPIResponse,
  ExistingPDFResponse,
  UseCrawlJobsResult,
  UseCrawlSettingsResult,
  UseCrawlStatsResult,
  UseCrawlOperationsResult,
  UrlValidationResult,
} from "./crawl";

export {
  DEFAULT_CRAWL_SETTINGS,
  CRAWL_JOB_STATUSES,
  CRAWL_STAGES,
  isCrawlJob,
  isValidCrawlUrl,
  createCrawlJob,
  createDefaultCrawlStats,
} from "./crawl";

// Chat Types
export type {
  ChatMessage,
  QuickPrompt,
  UseChatMessagesResult,
  UseChatInputResult,
  UseAIResponsesResult,
  UseChatScrollResult,
  ChatInputProps,
  ChatMessagesProps,
  QuickPromptsProps,
  TypingIndicatorProps,
  WelcomeScreenProps,
  MessageValidationResult,
  ConversationStats,
} from "./chat";

export {
  QUICK_PROMPTS,
  isChatMessage,
  isValidMessage,
  createErrorMessage,
  formatMessage,
  getConversationStats,
  createUserMessage,
  createAssistantMessage,
} from "./chat";

// Archive Types
export type {
  ArchiveFile,
  CategoryInfo,
  StorageStats,
  SortField,
  SortOrder,
  FileCategory,
  UseFileManagerResult,
  UseFileManagerOptions,
  FileCardProps,
  FileListRowProps,
  FileGridProps,
  FileListProps,
  StorageStatsProps,
  FileFilterOptions,
  FileSizeInfo,
  ArchiveFileValidation,
} from "./archive";

export {
  ARCHIVE_CATEGORIES,
  SORT_FIELDS,
  SORT_ORDERS,
  isArchiveFile,
  parseSize,
  formatBytes,
  formatDate,
  categorizeFile,
  extractTags,
  calculateStorageStats,
  createArchiveFile,
  createDefaultCategoryInfo,
} from "./archive";

// Activity Types
export type {
  ActivityItem,
  ActivityStats,
  UseActivityDataResult,
  ActivityFilters,
  TimeRange,
  ActivityType,
  ActivityOverviewProps,
  ActivityChartProps,
  ActivityFeedProps,
  ActivityFiltersProps,
} from "./activity";

export {
  ACTIVITY_TYPES,
  ACTIVITY_ACTIONS,
  TIME_RANGES,
  isActivityItem,
  formatActivityTimestamp,
  getActivityIcon,
  getActivityDescription,
  filterActivitiesByTimeRange,
  groupActivitiesByDate,
  createActivityItem,
  createDefaultActivityFilters,
} from "./activity";

// Navigation Types
export type {
  NavigationItemConfig,
  ToolItemConfig,
  NavigationState,
  NavigationMode,
  UseNavigationStateResult,
  NavigationProps,
  NavigationItemProps,
  NavigationSectionProps,
  ToolItemProps,
  NavigationControlsProps,
  BrandHeaderMiniProps,
  NavigationConfig,
  NavigationContext,
} from "./navigation";

export {
  NAVIGATION_BREAKPOINTS,
  NAVIGATION_MODES,
  isNavigationItemConfig,
  isToolItemConfig,
  getNavigationMode,
  shouldAutoCollapse,
  getNavigationItemKey,
  isNavigationItemActive,
  createNavigationItemConfig,
  createToolItemConfig,
  createDefaultNavigationState,
  validateNavigationConfig,
  validateNavigationState,
} from "./navigation";

// Common/Shared Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface ComponentBaseProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  "data-testid"?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  isEmpty?: boolean;
}

export interface AsyncOperationState<T = unknown> extends LoadingState {
  data?: T;
}

// Common Type Guards
export const isApiResponse = <T>(obj: unknown): obj is ApiResponse<T> => {
  const response = obj as Record<string, unknown>;
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof response.success === "boolean"
  );
};

export const isPaginatedResponse = <T>(
  obj: unknown,
): obj is PaginatedResponse<T> => {
  const response = obj as Record<string, unknown>;
  return (
    typeof obj === "object" &&
    obj !== null &&
    Array.isArray(response.data) &&
    typeof response.total === "number" &&
    typeof response.page === "number" &&
    typeof response.pageSize === "number" &&
    typeof response.totalPages === "number"
  );
};

// Common Constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  LAPTOP: 1024,
  DESKTOP: 1280,
} as const;

// Common Utility Functions
export const createId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production";
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};
