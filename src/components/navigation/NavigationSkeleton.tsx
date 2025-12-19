import React from 'react';

/**
 * Loading skeleton for the Navigation sidebar
 * Used as a fallback during dynamic import loading
 */
export const NavigationSkeleton: React.FC = () => {
  return (
    <div className="w-64 bg-gray-100 animate-pulse">
      <div className="h-16 bg-gray-200 mb-4"></div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
};

NavigationSkeleton.displayName = 'NavigationSkeleton';
