import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveStatusIndicatorProps {
  isConnected: boolean;
  error?: string | null;
  discoveredUrls: number;
  className?: string;
}

export const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({
  isConnected,
  error,
  discoveredUrls,
  className,
}) => {
  const getStatusInfo = () => {
    if (error) {
      return {
        icon: AlertCircle,
        text: 'Connection Error',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    }

    if (isConnected) {
      return {
        icon: Wifi,
        text: `Live Updates Active${discoveredUrls > 0 ? ` (${discoveredUrls} URLs)` : ''}`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    }

    return {
      icon: WifiOff,
      text: 'Real-time updates inactive',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border',
        statusInfo.bgColor,
        statusInfo.borderColor,
        statusInfo.color,
        className
      )}
    >
      <Icon
        className={cn(
          'w-4 h-4',
          isConnected && !error && 'animate-pulse'
        )}
      />
      <span>{statusInfo.text}</span>
    </div>
  );
};
