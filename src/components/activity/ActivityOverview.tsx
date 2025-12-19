import React from 'react';
import { Activity, TrendingUp, Clock, Target, BarChart3, Users } from 'lucide-react';
import { ActivityStats } from '@/hooks/useActivityData';

interface ActivityOverviewProps {
  stats: ActivityStats;
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, title, value, description, trend }) => (
  <div className="bg-white/80 backdrop-blur-sm border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <Icon className="w-8 h-8 text-primary" />
      {trend && (
        <div className={`flex items-center gap-1 text-sm ${
          trend === 'up' ? 'text-green-600' :
          trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
        }`}>
          <TrendingUp className={`w-4 h-4 ${
            trend === 'down' ? 'rotate-180' : ''
          }`} />
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

export const ActivityOverview: React.FC<ActivityOverviewProps> = ({ stats }) => {
  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const formatAverage = (avg: number): string => {
    return avg < 1 ? '< 1' : avg.toFixed(1);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Activity Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Activity}
          title="Total Activities"
          value={stats.totalActivities.toLocaleString()}
          description="All logged activities"
          trend="up"
        />

        <MetricCard
          icon={Target}
          title="Unique Activities"
          value={stats.uniqueActivities}
          description="Different activity types"
          trend="neutral"
        />

        <MetricCard
          icon={Clock}
          title="Peak Activity Hour"
          value={formatHour(stats.mostActiveHour)}
          description="Most active time period"
          trend="neutral"
        />

        <MetricCard
          icon={TrendingUp}
          title="Daily Average"
          value={formatAverage(stats.averagePerDay)}
          description="Activities per day"
          trend={stats.averagePerDay > 10 ? 'up' : 'neutral'}
        />
      </div>

      {/* Top Activity Type */}
      <div className="bg-white/80 backdrop-blur-sm border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Most Popular Activity</h3>
        </div>
        <div className="space-y-2">
          <p className="text-xl font-bold text-primary capitalize">
            {stats.topActivityType.replace(/_/g, ' ')}
          </p>
          <p className="text-sm text-muted-foreground">
            {stats.activityBreakdown[stats.topActivityType] || 0} occurrences
          </p>
        </div>

        {/* Activity Breakdown */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-foreground">Activity Breakdown</h4>
          {Object.entries(stats.activityBreakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground capitalize">
                  {type.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(count / stats.totalActivities) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};
