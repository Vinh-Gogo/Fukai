import { useCallback } from 'react';

interface ActivityData {
  [key: string]: unknown;
}

export const useActivityLogger = () => {
  const logActivity = useCallback((action: string, data: ActivityData = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      data,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Activity logged:', logEntry);
    }

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        existingLogs.push(logEntry);

        // Keep only last 100 entries
        if (existingLogs.length > 100) {
          existingLogs.splice(0, existingLogs.length - 100);
        }

        localStorage.setItem('activityLogs', JSON.stringify(existingLogs));
      } catch (error) {
        console.error('Failed to store activity log:', error);
      }
    }

    // Here you could also send to analytics service
    // analytics.track(action, data);
  }, []);

  const logError = useCallback((action: string, error: Error, data: ActivityData = {}) => {
    logActivity(`error_${action}`, {
      ...data,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    });
  }, [logActivity]);

  return {
    logActivity,
    logError,
  };
};
