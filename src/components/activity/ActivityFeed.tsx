import React from "react";
import {
  Activity,
  Clock,
  User,
  Hash,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { ActivityItem } from "@/types/activity";

interface ActivityFeedProps {
  activities: ActivityItem[];
  searchQuery: string;
}

const getActivityIcon = (type: string, success?: boolean) => {
  switch (type) {
    case "page_load":
      return <Activity className="w-4 h-4 text-blue-500" />;
    case "crawl_started":
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    case "pdf_download":
      return success ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      );
    case "job_added":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "settings_changed":
      return <AlertCircle className="w-4 h-4 text-purple-500" />;
    default:
      return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

const formatActivityDetails = (activity: ActivityItem): string => {
  const details = activity.details;

  switch (activity.type) {
    case "crawl_started":
      return `Job: ${details.job_id || "Unknown"} - URL: ${details.job_url || "Unknown"}`;
    case "pdf_download":
      const fileSize =
        typeof details.file_size === "number"
          ? `${(details.file_size / 1024 / 1024).toFixed(1)}MB`
          : "Unknown";
      const filename =
        typeof details.pdf_url === "string"
          ? details.pdf_url.split("/").pop()
          : "Unknown";
      return `File: ${filename} (${fileSize})`;
    case "page_load":
      return `Duration: ${details.duration_ms}ms`;
    default:
      return Object.entries(details)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key]) => `${key}: ${details[key]}`)
        .join(", ");
  }
};

const ActivityFeedItem: React.FC<{ activity: ActivityItem }> = ({
  activity,
}) => {
  const success = activity.details.success !== false; // Default to true unless explicitly false

  return (
    <div className="flex items-start gap-4 p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-colors">
      <div className="flex-shrink-0 mt-1">
        {getActivityIcon(activity.type, success)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="text-sm font-medium text-foreground capitalize">
            {activity.action.replace(/_/g, " ")}
          </h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {activity.timestamp.toLocaleDateString()}{" "}
              {activity.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          {formatActivityDetails(activity)}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            <span>{activity.type.replace(/_/g, " ")}</span>
          </div>
          {activity.userId && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{activity.userId}</span>
            </div>
          )}
          {activity.details.duration_ms && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{activity.details.duration_ms}ms</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  searchQuery,
}) => {
  // Filter activities based on search query (already handled in useActivityData hook)
  const displayActivities = activities.slice(0, 50); // Limit to 50 most recent

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Activity Feed
            </h3>
            <p className="text-sm text-muted-foreground">
              Recent user activities and system events
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {displayActivities.length} of {activities.length} activities
        </div>
      </div>

      {displayActivities.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">
            No Activities Found
          </h4>
          <p className="text-muted-foreground">
            {searchQuery
              ? `No activities match your search for "${searchQuery}"`
              : "No activities recorded in the selected time range"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {displayActivities.map((activity) => (
            <ActivityFeedItem key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {activities.length > 50 && (
        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Showing 50 most recent activities. Use filters to narrow down
            results.
          </p>
        </div>
      )}
    </div>
  );
};
