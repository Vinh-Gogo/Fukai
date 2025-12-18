import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { X, Minus, Plus, ChevronLeft, ChevronRight, Info, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFViewerProps } from './types';

/**
 * PDF Viewer with actual PDF content rendering using pdf.js
 */
export const PDFViewer = memo(({ file, onClose }: PDFViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(file.pages);
  const [zoomLevel, setZoomLevel] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTasksRef = useRef<Map<number, any>>(new Map()); // Store render tasks for cancellation
  const thumbnailTasksRef = useRef<Map<number, any>>(new Map()); // Store thumbnail render tasks

  // Initialize pdf.js
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Import pdf.js dynamically
        const pdfjs = await import('pdfjs-dist');
        // Set worker path to local file for reliability
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        // Load the PDF document
        const loadingTask = pdfjs.getDocument(file.sourceUrl);
        const pdf = await loadingTask.promise;

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();

    return () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [file.sourceUrl]);

  // Calculate visible pages for virtualization
  const calculateVisiblePages = useCallback(() => {
    if (!containerRef.current || !pdfDoc) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;
    const pageHeight = 1100 * zoomLevel;

    // Calculate first visible page
    const firstVisiblePage = Math.floor(scrollTop / pageHeight) + 1;
    // Calculate pages to render (viewport + buffer)
    const pagesToRender = Math.ceil(viewportHeight / pageHeight) + 2;

    const newVisiblePages = [];
    for (let i = 0; i < pagesToRender; i++) {
      const page = firstVisiblePage + i;
      if (page >= 1 && page <= totalPages) {
        newVisiblePages.push(page);
      }
    }

    setVisiblePages(newVisiblePages);
    setCurrentPage(Math.max(1, Math.min(totalPages, firstVisiblePage)));
  }, [pdfDoc, totalPages, zoomLevel]);

  // Render PDF pages
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdfDoc || !canvasRefs.current.has(pageNumber)) return;

    try {
      // Cancel any existing render task for this page
      const existingTask = renderTasksRef.current.get(pageNumber);
      if (existingTask && !existingTask.cancelled) {
        existingTask.cancel();
      }

      const canvas = canvasRefs.current.get(pageNumber);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const page = await pdfDoc.getPage(pageNumber);

      // Set canvas dimensions with zoom factor
      const scale = zoomLevel * 1.5; // Adjust scale factor as needed
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Clear canvas before rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create render task and store it
      const renderTask = page.render({
        canvasContext: ctx,
        viewport: viewport
      });

      renderTasksRef.current.set(pageNumber, renderTask);

      // Wait for render to complete
      await renderTask.promise;

      // Clean up completed task
      renderTasksRef.current.delete(pageNumber);

    } catch (err) {
      // Clean up failed task
      renderTasksRef.current.delete(pageNumber);

      // Only log errors that aren't due to cancellation
      if (!(err instanceof Error) || !err.message.includes('cancelled')) {
        console.error(`Error rendering page ${pageNumber}:`, err);
      }
    }
  }, [pdfDoc, zoomLevel]);

  // Render visible pages when they change
  useEffect(() => {
    if (!pdfDoc) return;

    visiblePages.forEach(page => {
      renderPage(page);
    });
  }, [visiblePages, pdfDoc, zoomLevel, renderPage]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    calculateVisiblePages();
  }, [calculateVisiblePages]);

  // Navigate to specific page
  const goToPage = useCallback((page: number) => {
    if (!containerRef.current || page < 1 || page > totalPages) return;

    setCurrentPage(page);
    const pageHeight = 1100 * zoomLevel;
    containerRef.current.scrollTop = (page - 1) * pageHeight;
  }, [totalPages, zoomLevel]);

  // Handle zoom changes
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoomLevel(newZoom);
    // Re-render all visible pages with new zoom level
    visiblePages.forEach(page => {
      renderPage(page);
    });
  }, [visiblePages, renderPage]);

  // Render thumbnail for a page
  const renderThumbnail = useCallback(async (pageNumber: number, canvas: HTMLCanvasElement) => {
    if (!pdfDoc) return;

    try {
      // Cancel any existing thumbnail render task for this page
      const existingTask = thumbnailTasksRef.current.get(pageNumber);
      if (existingTask && !existingTask.cancelled) {
        existingTask.cancel();
      }

      const page = await pdfDoc.getPage(pageNumber);
      const scale = 0.3;
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create render task and store it
      const renderTask = page.render({
        canvasContext: ctx,
        viewport: viewport
      });

      thumbnailTasksRef.current.set(pageNumber, renderTask);

      // Wait for render to complete
      await renderTask.promise;

      // Clean up completed task
      thumbnailTasksRef.current.delete(pageNumber);

    } catch (err) {
      // Clean up failed task
      thumbnailTasksRef.current.delete(pageNumber);

      // Only log errors that aren't due to cancellation
      if (!(err instanceof Error) || !err.message.includes('cancelled')) {
        console.error(`Error rendering thumbnail for page ${pageNumber}:`, err);
      }
    }
  }, [pdfDoc]);

  // Setup scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    calculateVisiblePages();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, calculateVisiblePages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        goToPage(currentPage - 1);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        goToPage(currentPage + 1);
      } else if (e.ctrlKey && e.key === '=') {
        e.preventDefault();
        handleZoomChange(Math.min(3, zoomLevel + 0.1));
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        handleZoomChange(Math.max(0.5, zoomLevel - 0.1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, goToPage, zoomLevel, handleZoomChange]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 border-b-2 border-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading PDF document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 p-8">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading PDF</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!pdfDoc) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No PDF document loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-xl">
      {/* Header with controls */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <h3 className="font-bold text-xl truncate max-w-md">{file.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm opacity-90">
              <div className="flex items-center gap-1">
                <span>{totalPages} pages</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <button
              onClick={() => handleZoomChange(Math.max(0.5, zoomLevel - 0.1))}
              className="p-1 hover:bg-white/30 rounded"
              aria-label="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => handleZoomChange(Math.min(3, zoomLevel + 0.1))}
              className="p-1 hover:bg-white/30 rounded"
              aria-label="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => handleZoomChange(1)}
            className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
            aria-label="Reset zoom"
          >
            100%
          </button>
        </div>
      </div>

      {/* Page navigation bar */}
      <div className="bg-gray-50 border-y border-gray-200 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
              goToPage(page);
            }}
            min="1"
            max={totalPages}
            className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm"
            aria-label="Current page number"
          />
          <span className="text-sm text-gray-600">of {totalPages}</span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:inline">Scroll or use arrow keys to navigate</span>
          <Info className="w-4 h-4 text-blue-500 cursor-help" />
        </div>
      </div>

      {/* Virtualized scroll container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-gray-100 relative"
        style={{ height: 'calc(100% - 100px)' }}
        tabIndex={0}
      >
        {/* Total height placeholder */}
        <div style={{ height: `${totalPages * 1100 * zoomLevel}px`, position: 'relative' }}>
          {visiblePages.map(page => {
            const topPosition = (page - 1) * 1100 * zoomLevel;

            return (
              <div
                key={`page-${page}`}
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
                    <span className="text-sm font-medium text-gray-700">Page {page}</span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                      PDF Viewer
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-center"
                    style={{ height: `calc(100% - 40px)` }}
                  >
                    <canvas
                      ref={(el) => {
                        if (el) {
                          canvasRefs.current.set(page, el);
                          // Render page if PDF is loaded
                          if (pdfDoc) {
                            renderPage(page);
                          }
                        }
                      }}
                      className="max-w-full max-h-full"
                      aria-label={`Page ${page} of ${file.name}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thumbnail sidebar */}
        <div className="hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-2 border border-gray-200 max-h-[80%] overflow-y-auto">
          <div className="space-y-1 pr-1">
            <div className="px-2 py-1 text-xs font-medium text-gray-600 border-b border-gray-200 mb-1">
              Pages ({totalPages})
            </div>
            {Array.from({ length: totalPages }).map((_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={cn(
                    "w-16 h-20 rounded-lg flex flex-col items-center justify-center text-xs p-1 border transition-all",
                    currentPage === page
                      ? "border-blue-500 bg-blue-50 shadow-md scale-105"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  )}
                  aria-label={`Go to page ${page}`}
                >
                  <div className="bg-gray-100 rounded w-12 h-16 mb-1 flex items-center justify-center overflow-hidden">
                    <canvas
                      ref={(el) => {
                        if (el && pdfDoc) {
                          renderThumbnail(page, el);
                        }
                      }}
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-[10px] font-medium">{page}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="bg-gray-50 border-t border-gray-200 p-2 text-center text-xs text-gray-500">
        <span className="hidden sm:inline">Keyboard shortcuts: </span>
        <kbd className="px-2 py-0.5 bg-gray-200 rounded font-mono text-xs">←</kbd> Previous page •
        <kbd className="px-2 py-0.5 bg-gray-200 rounded font-mono text-xs">→</kbd> Next page •
        <kbd className="px-2 py-0.5 bg-gray-200 rounded font-mono text-xs">Ctrl</kbd> +
        <kbd className="px-2 py-0.5 bg-gray-200 rounded font-mono text-xs">+</kbd> Zoom in •
        <kbd className="px-2 py-0.5 bg-gray-200 rounded font-mono text-xs">-</kbd> Zoom out
      </div>
    </div>
  );
});

PDFViewer.displayName = 'PDFViewer';
