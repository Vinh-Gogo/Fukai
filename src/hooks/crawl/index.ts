/**
 * Crawl hooks - centralized exports
 */

// Crawl job management hooks
export { useCrawlJobs } from './useCrawlJobs';

// Crawl settings management hooks
export { useCrawlSettings } from './useCrawlSettings';

// Crawl statistics hooks
export { useCrawlStats } from './useCrawlStats';

// Crawl operations hooks
export { useCrawlOperations } from './useCrawlOperations';

// Re-export types for convenience
export type {
  CrawlJob,
  CrawlSettings,
  CrawlStats,
  UseCrawlJobsResult,
  UseCrawlSettingsResult,
  UseCrawlStatsResult,
  UseCrawlOperationsResult,
} from '@/types/crawl';
