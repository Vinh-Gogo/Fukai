"use client";

import React, { useState } from "react";
import dynamic from 'next/dynamic';
import BrandHeader from "@/components/layout/BrandHeader";
import { Activity, BarChart3, TrendingUp, Users, Clock, Filter } from "lucide-react";

// Components
import { ActivityOverview } from "@/components/activity/ActivityOverview";
import { ActivityChart } from "@/components/activity/ActivityChart";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { ActivityFilters } from "@/components/activity/ActivityFilters";

// Custom hooks
import { useActivityData } from "../../hooks/useActivityData";

// Dynamically import Navigation to prevent SSR issues
const Navigation = dynamic(() => import('@/components/navigation').then(mod => ({ default: mod.Navigation })), {
  ssr: false,
  loading: () => (
    <div className="w-64 bg-gray-100 animate-pulse">
      <div className="h-16 bg-gray-200 mb-4"></div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
});

export default function ActivityDashboardPage() {
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);
  const [filters, setFilters] = useState({
    timeRange: '7d',
    activityType: 'all',
    searchQuery: ''
  });

  const { activities, stats, isLoading } = useActivityData(filters);

  const handleNavigationToggle = () => {
    setIsNavigationVisible(prev => !prev);
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading activity dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/20 overflow-x-hidden">
      {/* Navigation Sidebar */}
      <Navigation
        isVisible={isNavigationVisible}
        onToggle={handleNavigationToggle}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <main className="flex-1 overflow-y-auto rounded-3xl">
          <BrandHeader
            icon={Activity}
            title="Activity Dashboard"
            subtitle="Monitor User Activities & Analytics"
            statusText="Real-time activity tracking & insights"
          />

          <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Filters */}
            <ActivityFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />

            {/* Overview Cards */}
            <ActivityOverview stats={stats} />

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ActivityChart
                activities={activities}
                timeRange={filters.timeRange}
                title="Activity Trends"
                description="Activity volume over time"
              />
              <ActivityChart
                activities={activities}
                timeRange={filters.timeRange}
                chartType="pie"
                title="Activity Types"
                description="Breakdown by activity category"
              />
            </div>

            {/* Activity Feed */}
            <ActivityFeed
              activities={activities}
              searchQuery={filters.searchQuery}
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-3 px-4">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            <p>
              Activity Dashboard © {new Date().getFullYear()} - Real-time Analytics & Monitoring
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
