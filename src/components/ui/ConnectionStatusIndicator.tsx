"use client";

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  hasError?: boolean;
  lastUpdate?: Date | null;
  className?: string;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  isConnected,
  hasError = false,
  lastUpdate,
  className,
}) => {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimeDisplay = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdate.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);

      if (diffSeconds < 60) {
        setTimeSinceUpdate(`${diffSeconds}s ago`);
      } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        setTimeSinceUpdate(`${minutes}m ago`);
      } else {
        const hours = Math.floor(diffSeconds / 3600);
        setTimeSinceUpdate(`${hours}h ago`);
      }
    };

    updateTimeDisplay();
    const interval = setInterval(updateTimeDisplay, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const getStatusInfo = () => {
    if (hasError) {
      return {
        icon: AlertTriangle,
        text: 'Connection Error',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        description: 'Real-time updates unavailable',
      };
    }

    if (isConnected) {
      return {
        icon: Wifi,
        text: 'Connected',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        description: lastUpdate ? `Last update: ${timeSinceUpdate}` : 'Real-time updates active',
      };
    }

    return {
      icon: WifiOff,
      text: 'Disconnected',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      description: 'Real-time updates inactive',
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border',
        statusInfo.bgColor,
        statusInfo.borderColor,
        statusInfo.color,
        className
      )}
    >
      <Icon
        className={cn(
          'w-4 h-4',
          isConnected && !hasError && 'animate-pulse'
        )}
      />
      <div className="flex flex-col">
        <span className="font-medium">{statusInfo.text}</span>
        <span className="text-xs opacity-75">{statusInfo.description}</span>
      </div>
    </div>
  );
};
