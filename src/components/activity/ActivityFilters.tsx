import React from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';

interface ActivityFiltersProps {
  filters: {
    timeRange: string;
    activityType: string;
    searchQuery: string;
  };
  onFiltersChange: (filters: ActivityFiltersProps['filters']) => void;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const handleTimeRangeChange = (timeRange: string) => {
    onFiltersChange({ ...filters, timeRange });
  };

  const handleActivityTypeChange = (activityType: string) => {
    onFiltersChange({ ...filters, activityType });
  };

  const handleSearchChange = (searchQuery: string) => {
    onFiltersChange({ ...filters, searchQuery });
  };

  const clearFilters = () => {
    onFiltersChange({
      timeRange: '7d',
      activityType: 'all',
      searchQuery: ''
    });
  };

  const hasActiveFilters = filters.timeRange !== '7d' ||
                          filters.activityType !== 'all' ||
                          filters.searchQuery !== '';

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Time Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Time Range
          </label>
          <select
            value={filters.timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        {/* Activity Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Activity Type
          </label>
          <select
            value={filters.activityType}
            onChange={(e) => handleActivityTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="all">All Activities</option>
            <option value="page_load">Page Load</option>
            <option value="crawl_started">Crawl Started</option>
            <option value="pdf_download">PDF Download</option>
            <option value="job_added">Job Added</option>
            <option value="settings_changed">Settings Changed</option>
          </select>
        </div>

        {/* Search Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search activities..."
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {filters.searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {filters.timeRange !== '7d' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">
                Time: {filters.timeRange}
              </span>
            )}
            {filters.activityType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-600 rounded-full">
                Type: {filters.activityType.replace(/_/g, ' ')}
              </span>
            )}
            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-full">
                Search: &ldquo;{filters.searchQuery}&rdquo;
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
