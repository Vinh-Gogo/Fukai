import React, { memo } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { PageContentProps } from './types';

/**
 * Individual page content component with loading states and zoom support
 */
export const PageContent = memo(({
  pageNumber,
  file,
  zoomLevel,
  isLoading
}: PageContentProps) => {
  if (isLoading) {
    return (
      <div className="h-full w-full bg-white flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 border-b-2 border-blue-600 animate-spin mx-auto mb-2" />
          <span className="text-sm text-gray-600">Loading page {pageNumber}</span>
        </div>
      </div>
    );
  }

  // Placeholder for actual PDF rendering
  // In a real implementation, this would use pdf.js or similar library
  return (
    <div
      className="h-full w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
      style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top center'
      }}
    >
      <div className="p-8 min-h-full flex flex-col">
        <div className="mb-4 border-b border-gray-200 pb-2">
          <h4 className="font-bold text-lg text-gray-900">Page {pageNumber}</h4>
          <p className="text-sm text-gray-500">{file.name}</p>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-4">
            <FileText className="w-24 h-24 text-blue-500 mx-auto mb-4 opacity-75" />
            <p className="text-gray-600 mb-2">PDF content would be rendered here</p>
            <p className="text-sm text-gray-500">This is a virtualized page view for page {pageNumber}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500 text-right">
          Rendered with {Math.round(zoomLevel * 100)}% zoom
        </div>
      </div>
    </div>
  );
});

PageContent.displayName = 'PageContent';
