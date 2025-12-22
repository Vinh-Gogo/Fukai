/**
 * Centralized activity and analytics types and interfaces
 */

// Core Activity Types
export interface ActivityItem {
  id: string;
  type: string;
  action: string;
  timestamp: Date;
  details: Record<string, string | number | boolean | null>;
  userId?: string;
  sessionId?: string;
}

export interface ActivityStats {
  totalActivities: number;
  uniqueActivities: number;
  mostActiveHour: number;
  topActivityType: string;
  averagePerDay: number;
  activityBreakdown: Record<string, number>;
  trendData: Array<{
    date: string;
    count: number;
  }>;
}

// Hook Result Types
export interface UseActivityDataResult {
  activities: ActivityItem[];
  stats: ActivityStats;
  isLoading: boolean;
  refetch: () => void;
}

// Filter and Query Types
export interface ActivityFilters {
  timeRange: string;
  activityType: string;
  searchQuery: string;
}

export type TimeRange = "1h" | "24h" | "7d" | "30d" | "all";
export type ActivityType =
  | "all"
  | "page_load"
  | "crawl_started"
  | "pdf_download"
  | "job_added"
  | "settings_changed";

// Component Props Types
export interface ActivityOverviewProps {
  stats: ActivityStats;
  className?: string;
}

export interface ActivityChartProps {
  data: ActivityStats["trendData"];
  className?: string;
}

export interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  className?: string;
}

export interface ActivityFiltersProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  className?: string;
}

// Constants
export const ACTIVITY_TYPES = {
  PAGE_LOAD: "page_load" as const,
  CRAWL_STARTED: "crawl_started" as const,
  PDF_DOWNLOAD: "pdf_download" as const,
  JOB_ADDED: "job_added" as const,
  SETTINGS_CHANGED: "settings_changed" as const,
};

export const ACTIVITY_ACTIONS = {
  PAGE_LOAD: "page_load" as const,
  CRAWL_STARTED: "crawl_started" as const,
  SINGLE_PDF_DOWNLOAD: "single_pdf_download" as const,
  BULK_DOWNLOAD: "bulk_download" as const,
  JOB_ADDED: "job_added" as const,
  SETTINGS_UPDATED: "settings_updated" as const,
};

export const TIME_RANGES = {
  HOUR: "1h" as const,
  DAY: "24h" as const,
  WEEK: "7d" as const,
  MONTH: "30d" as const,
  ALL: "all" as const,
};

// Type Guards
export const isActivityItem = (obj: unknown): obj is ActivityItem => {
  const item = obj as Record<string, unknown>;
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof item.id === "string" &&
    typeof item.type === "string" &&
    typeof item.action === "string" &&
    item.timestamp instanceof Date &&
    typeof item.details === "object" &&
    item.details !== null
  );
};

// Utility Functions
export const formatActivityTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getActivityIcon = (type: string): string => {
  switch (type) {
    case ACTIVITY_TYPES.PAGE_LOAD:
      return "📄";
    case ACTIVITY_TYPES.CRAWL_STARTED:
      return "🔍";
    case ACTIVITY_TYPES.PDF_DOWNLOAD:
      return "📥";
    case ACTIVITY_TYPES.JOB_ADDED:
      return "➕";
    case ACTIVITY_TYPES.SETTINGS_CHANGED:
      return "⚙️";
    default:
      return "📊";
  }
};

export const getActivityDescription = (activity: ActivityItem): string => {
  const icon = getActivityIcon(activity.type);
  const time = formatActivityTimestamp(activity.timestamp);

  switch (activity.type) {
    case ACTIVITY_TYPES.CRAWL_STARTED:
      return `${icon} Started crawling ${activity.details.job_url || "website"} at ${time}`;
    case ACTIVITY_TYPES.PDF_DOWNLOAD:
      return `${icon} Downloaded PDF from ${activity.details.pdf_url || "source"} at ${time}`;
    case ACTIVITY_TYPES.JOB_ADDED:
      return `${icon} Added new crawl job at ${time}`;
    case ACTIVITY_TYPES.SETTINGS_CHANGED:
      return `${icon} Updated application settings at ${time}`;
    case ACTIVITY_TYPES.PAGE_LOAD:
      return `${icon} Page loaded at ${time}`;
    default:
      return `${icon} ${activity.action} at ${time}`;
  }
};

export const filterActivitiesByTimeRange = (
  activities: ActivityItem[],
  timeRange: TimeRange,
): ActivityItem[] => {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case TIME_RANGES.HOUR:
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case TIME_RANGES.DAY:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case TIME_RANGES.WEEK:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case TIME_RANGES.MONTH:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return activities; // All time
  }

  return activities.filter((activity) => activity.timestamp >= startDate);
};

export const groupActivitiesByDate = (
  activities: ActivityItem[],
): Record<string, ActivityItem[]> => {
  return activities.reduce(
    (groups, activity) => {
      const date = activity.timestamp.toISOString().split("T")[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
      return groups;
    },
    {} as Record<string, ActivityItem[]>,
  );
};

// Factory Functions
export const createActivityItem = (
  type: string,
  action: string,
  details: Record<string, string | number | boolean | null> = {},
  userId?: string,
  sessionId?: string,
): Omit<ActivityItem, "id" | "timestamp"> => ({
  type,
  action,
  details,
  userId,
  sessionId,
});

export const createDefaultActivityFilters = (): ActivityFilters => ({
  timeRange: TIME_RANGES.ALL,
  activityType: "all",
  searchQuery: "",
});
