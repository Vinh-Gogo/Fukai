import React, { memo } from 'react';
import { HardDrive } from 'lucide-react';
import { StorageStats as StorageStatsType, formatBytes } from '@/lib/archive';

interface StorageStatsProps {
  stats: StorageStatsType;
}

export const StorageStats = memo(({ stats }: StorageStatsProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <HardDrive className="w-5 h-5" />
        Storage Overview
      </h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Files</span>
          <span className="font-medium">{stats.totalFiles}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Size</span>
          <span className="font-medium">{stats.totalSizeFormatted}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Avg Size</span>
          <span className="font-medium">{formatBytes(stats.averageSize)}</span>
        </div>
      </div>

      {/* Storage Optimization Tips */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Optimization Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Archive old files to reduce storage</li>
          <li>• Use compression for large documents</li>
          <li>• Remove duplicate files regularly</li>
        </ul>
      </div>
    </div>
  );
});

StorageStats.displayName = 'StorageStats';
