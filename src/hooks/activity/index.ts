/**
 * Activity hooks - centralized exports
 */

// Activity data and analytics hooks
export { useActivityData } from "./useActivityData";

// Activity logging hooks
export { useActivityLogger } from "./useActivityLogger";

// Re-export types for convenience
export type {
  ActivityItem,
  ActivityStats,
  UseActivityDataResult,
  ActivityFilters,
  TimeRange,
  ActivityType,
} from "@/types/activity";
