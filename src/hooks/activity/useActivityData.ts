import { useState, useEffect, useMemo } from "react";

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

interface UseActivityDataResult {
  activities: ActivityItem[];
  stats: ActivityStats;
  isLoading: boolean;
  refetch: () => void;
}

interface ActivityFilters {
  timeRange: string;
  activityType: string;
  searchQuery: string;
}

// Mock data generator for demonstration
const generateMockActivities = (): ActivityItem[] => {
  const activities: ActivityItem[] = [];
  const types = [
    "page_load",
    "crawl_started",
    "pdf_download",
    "job_added",
    "settings_changed",
  ];
  const actions = [
    "page_load",
    "crawl_started",
    "single_pdf_download",
    "bulk_download",
    "job_added",
  ];

  for (let i = 0; i < 100; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const timestamp = new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    ); // Last 30 days

    activities.push({
      id: `activity-${i}`,
      type,
      action,
      timestamp,
      details: {
        duration_ms: Math.floor(Math.random() * 5000),
        success: Math.random() > 0.1,
        ...(type === "crawl_started" && {
          job_url: `https://example${i}.com`,
          job_id: `job-${i}`,
        }),
        ...(type === "pdf_download" && {
          pdf_url: `https://example.com/file${i}.pdf`,
          file_size: Math.floor(Math.random() * 10000000),
        }),
      },
      userId: "user-1",
      sessionId: `session-${Math.floor(i / 10)}`,
    });
  }

  return activities.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );
};

// Filter activities based on criteria
const filterActivities = (
  activities: ActivityItem[],
  filters: ActivityFilters,
): ActivityItem[] => {
  let filtered = [...activities];

  // Time range filter
  const now = new Date();
  let startDate: Date;

  switch (filters.timeRange) {
    case "1h":
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "24h":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(0); // All time
  }

  filtered = filtered.filter((activity) => activity.timestamp >= startDate);

  // Activity type filter
  if (filters.activityType !== "all") {
    filtered = filtered.filter(
      (activity) => activity.type === filters.activityType,
    );
  }

  // Search query filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (activity) =>
        activity.action.toLowerCase().includes(query) ||
        activity.type.toLowerCase().includes(query) ||
        JSON.stringify(activity.details).toLowerCase().includes(query),
    );
  }

  return filtered;
};

// Calculate statistics from activities
const calculateStats = (activities: ActivityItem[]): ActivityStats => {
  const totalActivities = activities.length;
  const uniqueActivities = new Set(activities.map((a) => a.action)).size;

  // Most active hour
  const hourCounts = activities.reduce(
    (acc, activity) => {
      const hour = activity.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const mostActiveHour = Object.entries(hourCounts).reduce(
    (max, [hour, count]) =>
      count > (hourCounts[max] || 0) ? parseInt(hour) : max,
    0,
  );

  // Activity breakdown
  const activityBreakdown = activities.reduce(
    (acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topActivityType = Object.entries(activityBreakdown).reduce(
    (max, [type, count]) =>
      count > (activityBreakdown[max] || 0) ? type : max,
    "",
  );

  // Average per day (based on date range)
  const dateRange = Math.max(
    1,
    Math.ceil(
      (Date.now() - activities[0]?.timestamp?.getTime() || Date.now()) /
        (24 * 60 * 60 * 1000),
    ),
  );
  const averagePerDay = totalActivities / dateRange;

  // Trend data (last 7 days)
  const trendData: Array<{ date: string; count: number }> = [];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  last7Days.forEach((date) => {
    const count = activities.filter(
      (activity) => activity.timestamp.toISOString().split("T")[0] === date,
    ).length;
    trendData.push({ date, count });
  });

  return {
    totalActivities,
    uniqueActivities,
    mostActiveHour,
    topActivityType,
    averagePerDay,
    activityBreakdown,
    trendData,
  };
};

export const useActivityData = (
  filters: ActivityFilters,
): UseActivityDataResult => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load activities (in a real app, this would be an API call)
  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockActivities = generateMockActivities();
      setActivities(mockActivities);
      setIsLoading(false);
    };

    loadActivities();
  }, []);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return filterActivities(activities, filters);
  }, [activities, filters]);

  // Calculated statistics
  const stats = useMemo(() => {
    return calculateStats(filteredActivities);
  }, [filteredActivities]);

  const refetch = () => {
    // In a real app, this would trigger a data refresh
    console.log("Refetching activity data...");
  };

  return {
    activities: filteredActivities,
    stats,
    isLoading,
    refetch,
  };
};
