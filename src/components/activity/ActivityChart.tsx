import React from 'react';
import { TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { ActivityItem } from '@/types/activity';

interface ActivityChartProps {
  activities: ActivityItem[];
  timeRange: string;
  chartType?: 'line' | 'pie';
  title: string;
  description: string;
}

// Simple line chart component
const LineChart: React.FC<{ data: Array<{ date: string; count: number }> }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.count));
  const chartHeight = 200;
  const chartWidth = 400;

  return (
    <div className="w-full h-48">
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1="0"
            y1={chartHeight - (ratio * chartHeight)}
            x2={chartWidth}
            y2={chartHeight - (ratio * chartHeight)}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        ))}

        {/* Data line */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={
            data.map((point, index) => {
              const x = (index / (data.length - 1)) * chartWidth;
              const y = chartHeight - ((point.count / maxValue) * chartHeight);
              return `${x},${y}`;
            }).join(' ')
          }
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * chartWidth;
          const y = chartHeight - ((point.count / maxValue) * chartHeight);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill="#3b82f6"
              className="hover:r-6 transition-all"
            />
          );
        })}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 px-2">
        {data.map((point, index) => (
          <span key={index} className="text-xs text-muted-foreground">
            {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </div>
  );
};

// Simple pie chart component
const PieChartComponent: React.FC<{ data: Record<string, number> }> = ({ data }) => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  let currentAngle = 0;
  const slices = Object.entries(data).map(([key, value], index) => {
    const percentage = value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = 100 + 80 * Math.cos(startAngleRad);
    const y1 = 100 + 80 * Math.sin(startAngleRad);
    const x2 = 100 + 80 * Math.cos(endAngleRad);
    const y2 = 100 + 80 * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M 100 100`,
      `L ${x1} ${y1}`,
      `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ');

    currentAngle = endAngle;

    return {
      key,
      value,
      percentage,
      pathData,
      color: colors[index % colors.length],
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    };
  });

  return (
    <div className="flex flex-col items-center space-y-4">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {slices.map((slice, index) => (
          <path
            key={index}
            d={slice.pathData}
            fill={slice.color}
            stroke="#ffffff"
            strokeWidth="2"
            className="hover:opacity-80 transition-opacity"
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {slices.map((slice, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{slice.label}</p>
              <p className="text-xs text-muted-foreground">
                {(slice.percentage * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ActivityChart: React.FC<ActivityChartProps> = ({
  activities,
  timeRange,
  chartType = 'line',
  title,
  description
}) => {
  // Prepare data based on chart type
  const chartData = React.useMemo(() => {
    if (chartType === 'pie') {
      // Activity type breakdown for pie chart
      const breakdown: Record<string, number> = {};
      activities.forEach(activity => {
        breakdown[activity.type] = (breakdown[activity.type] || 0) + 1;
      });
      return breakdown;
    } else {
      // Trend data for line chart
      const trendData: Array<{ date: string; count: number }> = [];
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const count = activities.filter(activity =>
          activity.timestamp.toISOString().split('T')[0] === dateStr
        ).length;

        trendData.push({ date: dateStr, count });
      }

      return trendData;
    }
  }, [activities, timeRange, chartType]);

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {chartType === 'pie' ? (
              <PieChart className="w-5 h-5 text-primary" />
            ) : (
              <BarChart3 className="w-5 h-5 text-primary" />
            )}
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span>{activities.length} activities</span>
        </div>
      </div>

      <div className="flex justify-center">
        {chartType === 'pie' ? (
          <PieChartComponent data={chartData as Record<string, number>} />
        ) : (
          <LineChart data={chartData as Array<{ date: string; count: number }>} />
        )}
      </div>
    </div>
  );
};
