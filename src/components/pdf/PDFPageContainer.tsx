import React, { useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFPageContainerProps {
  pageNumber: number;
  topPosition: number;
  zoomLevel: number;
  isLoading: boolean;
  canvasRef: (el: HTMLCanvasElement | null) => void;
  fileName: string;
}

export const PDFPageContainer: React.FC<PDFPageContainerProps> = ({
  pageNumber,
  topPosition,
  zoomLevel,
  isLoading,
  canvasRef,
  fileName,
}) => {
  const canvasElementRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasElementRef.current) {
      canvasRef(canvasElementRef.current);
    }
  }, [canvasRef]);

  return (
    <div
      className="absolute w-full transition-opacity duration-300 p-4"
      style={{
        top: `${topPosition}px`,
        height: `${1100 * zoomLevel + 32}px` // +32 for padding
      }}
    >
      <div className="h-full w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div
          className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center"
          style={{ height: '40px' }}
        >
          <span className="text-sm font-medium text-gray-700">Page {pageNumber}</span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
            PDF Viewer
          </span>
        </div>
        <div
          className="flex items-center justify-center relative"
          style={{ height: `calc(100% - 40px)` }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-lg">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Loading page...</span>
              </div>
            </div>
          )}
          <canvas
            ref={canvasElementRef}
            className="max-w-full max-h-full"
            aria-label={`Page ${pageNumber} of ${fileName}`}
          />
        </div>
      </div>
    </div>
  );
};
