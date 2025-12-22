/**
 * Centralized crawling-related types and interfaces
 */

// Core Crawl Types
export interface CrawlJob {
  id: string;
  url: string;
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  pagesFound: number;
  pdfsFound: number;
  lastRun: string;
  avgDelay?: number;
  successRate?: number;
  errorMessage?: string;
  pdfUrls?: string[];
  currentStage?: "pages" | "articles" | "pdfs";
  pageUrls?: string[];
  articleUrls?: string[];
}

export interface CrawlSettings {
  autoDownloadEnabled: boolean;
}

export interface CrawlStats {
  totalJobs: number;
  completedJobs: number;
  runningJobs: number;
  failedJobs: number;
  totalPagesFound: number;
  totalPdfsFound: number;
  averageSuccessRate: number;
  averageDelay: number;
}

// API Response Types
export interface CrawlAPIResponse {
  success: boolean;
  message?: string;
  pages_found?: number;
  page_urls?: string[];
  article_urls?: string[];
  pdfs_found?: number;
  pdf_urls?: string[];
}

export interface DownloadAPIResponse {
  success: boolean;
  message?: string;
  downloaded_count?: number;
  total_urls?: number;
  output_dir?: string;
}

export interface ExistingPDFResponse {
  existing_files: string[];
}

// Hook Result Types
export interface UseCrawlJobsResult {
  jobs: CrawlJob[];
  isLoading: boolean;
  addJob: (url: string) => void;
  updateJob: (jobId: string, updates: Partial<CrawlJob>) => void;
  removeJob: (jobId: string) => void;
  getJob: (jobId: string) => CrawlJob | undefined;
  clearJobs: () => void;
}

export interface UseCrawlSettingsResult {
  settings: CrawlSettings;
  updateSettings: (updates: Partial<CrawlSettings>) => void;
  resetSettings: () => void;
}

export interface UseCrawlStatsResult {
  stats: CrawlStats;
  refreshStats: () => void;
  isLoading: boolean;
}

export interface UseCrawlOperationsResult {
  startCrawl: (jobId: string) => Promise<void>;
  stopCrawl: (jobId: string) => Promise<void>;
  downloadPDFs: (jobId: string) => Promise<void>;
  isRunning: boolean;
  currentOperation?: string;
}

// Utility Types
export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
}

// Constants
export const DEFAULT_CRAWL_SETTINGS: CrawlSettings = {
  autoDownloadEnabled: true,
};

export const CRAWL_JOB_STATUSES = {
  IDLE: "idle" as const,
  RUNNING: "running" as const,
  COMPLETED: "completed" as const,
  ERROR: "error" as const,
};

export const CRAWL_STAGES = {
  PAGES: "pages" as const,
  ARTICLES: "articles" as const,
  PDFS: "pdfs" as const,
};

// Type Guards
export const isCrawlJob = (obj: unknown): obj is CrawlJob => {
  const job = obj as Record<string, unknown>;
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof job.id === "string" &&
    typeof job.url === "string" &&
    typeof job.status === "string" &&
    ["idle", "running", "completed", "error"].includes(job.status) &&
    typeof job.progress === "number" &&
    typeof job.pagesFound === "number" &&
    typeof job.pdfsFound === "number" &&
    typeof job.lastRun === "string"
  );
};

export const isValidCrawlUrl = (url: string): UrlValidationResult => {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return {
        isValid: false,
        error: "URL must start with http:// or https://",
      };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid URL" };
  }
};

// Factory Functions
export const createCrawlJob = (url: string): CrawlJob => ({
  id: Date.now().toString(),
  url: url.trim(),
  status: "idle",
  progress: 0,
  pagesFound: 0,
  pdfsFound: 0,
  lastRun: "Never",
});

export const createDefaultCrawlStats = (): CrawlStats => ({
  totalJobs: 0,
  completedJobs: 0,
  runningJobs: 0,
  failedJobs: 0,
  totalPagesFound: 0,
  totalPdfsFound: 0,
  averageSuccessRate: 0,
  averageDelay: 0,
});
