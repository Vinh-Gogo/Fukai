import React, { memo, useState, useCallback, useEffect, useLayoutEffect, useRef, Component, ErrorInfo } from 'react';
import { X, Minus, Plus, ChevronLeft, ChevronRight, Info, RefreshCw, AlertCircle, FileText, Search, X as CloseIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFViewerProps } from './types';
import { usePDFLoader, usePDFRenderer } from '@/hooks';
import { preloadAdjacentPages, getDevicePixelRatio } from '@/lib/pdf';

/**
 * Error Boundary for PDF Viewer
 */
class PDFViewerErrorBoundary extends Component<
  { children: React.ReactNode; onRetry?: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onRetry?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PDF Viewer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-100 p-8">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">PDF Viewer Error</h3>
            <p className="text-gray-600 mb-4">
              Something went wrong while rendering the PDF. This might be due to a corrupted file or browser compatibility issue.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  this.props.onRetry?.();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={() => this.props.children}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Reload Viewer
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * PDF Viewer with actual PDF content rendering using pdf.js
 */
export const PDFViewer = memo(({ file, onClose }: PDFViewerProps) => {
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{page: number, text: string, index: number}>>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [zoomPresets, setZoomPresets] = useState([0.5, 0.75, 1, 1.25, 1.5, 2, 3]);
  const [pageLoadingStates, setPageLoadingStates] = useState<Map<number, boolean>>(new Map());

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const lastCalculatedPdfRef = useRef<string>('');
  const [shouldCalculatePages, setShouldCalculatePages] = useState(false);

  // Use the existing PDF hooks
  const {
    pdfDoc,
    isLoading,
    error,
    metadata,
    isValid,
    loadPDF,
    unloadPDF,
    retry
  } = usePDFLoader();

  const {
    renderPage: renderPDFPage,
    cancelAllRenders,
    cleanup: cleanupRenderer,
    calculateScale
  } = usePDFRenderer();

  const totalPages = metadata?.numPages || file.pages;

  // Load PDF when file changes
  useEffect(() => {
    if (file.sourceUrl) {
      loadPDF(file.sourceUrl);
    }

    return () => {
      unloadPDF();
      cancelAllRenders();
    };
  }, [file.sourceUrl, loadPDF, unloadPDF, cancelAllRenders]);

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

  // Render visible pages when they change
  useEffect(() => {
    if (!pdfDoc) return;

    const devicePixelRatio = getDevicePixelRatio();

    visiblePages.forEach(async (pageNumber) => {
      const canvas = canvasRefs.current.get(pageNumber);
      if (!canvas) return;

      // Set loading state
      setPageLoadingStates(prev => new Map(prev.set(pageNumber, true)));

      try {
        const scale = calculateScale(canvas.clientWidth, 600, zoomLevel) * devicePixelRatio;
        await renderPDFPage(pageNumber, canvas, pdfDoc, scale);
      } catch (error) {
        console.error(`Failed to render page ${pageNumber}:`, error);
      } finally {
        // Clear loading state
        setPageLoadingStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(pageNumber);
          return newMap;
        });
      }
    });
  }, [visiblePages, pdfDoc, zoomLevel, renderPDFPage, calculateScale]);

  // Handle scroll events with debouncing
  const handleScroll = useCallback(() => {
    // Debounce scroll calculations
    const timeoutId = setTimeout(() => {
      calculateVisiblePages();
    }, 16); // ~60fps

    return () => clearTimeout(timeoutId);
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
    // Cancel all current renders and re-render visible pages
    cancelAllRenders();
  }, [cancelAllRenders]);

  // Render thumbnail for a page (simplified version)
  const renderThumbnail = useCallback(async (pageNumber: number, canvas: HTMLCanvasElement) => {
    if (!pdfDoc) return;

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const scale = 0.3;
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create render task
      const renderTask = page.render({
        canvasContext: ctx,
        viewport: viewport
      });

      // Wait for render to complete
      await renderTask.promise;

    } catch (err) {
      // Only log errors that aren't due to cancellation
      if (!(err instanceof Error) || !err.message.includes('cancelled')) {
        console.error(`Error rendering thumbnail for page ${pageNumber}:`, err);
      }
    }
  }, [pdfDoc]);

  // Extract text from a PDF page
  const extractPageText = useCallback(async (pageNumber: number): Promise<string> => {
    if (!pdfDoc) return '';

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const textContent = await page.getTextContent();
      return textContent.items
        .map((item) => item.str)
        .join(' ')
        .toLowerCase();
    } catch (error) {
      console.error(`Error extracting text from page ${pageNumber}:`, error);
      return '';
    }
  }, [pdfDoc]);

  // Perform text search across all pages
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !pdfDoc) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    setIsSearching(true);
    const results: Array<{page: number, text: string, index: number}> = [];
    const searchTerm = query.toLowerCase().trim();

    try {
      // Search through all pages
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageText = await extractPageText(pageNum);
        const index = pageText.indexOf(searchTerm);

        if (index !== -1) {
          // Extract context around the match
          const start = Math.max(0, index - 50);
          const end = Math.min(pageText.length, index + searchTerm.length + 50);
          const context = pageText.substring(start, end);

          results.push({
            page: pageNum,
            text: context,
            index: results.length
          });
        }
      }

      setSearchResults(results);
      setCurrentSearchIndex(results.length > 0 ? 0 : -1);

      // Navigate to first result
      if (results.length > 0) {
        goToPage(results[0].page);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setCurrentSearchIndex(-1);
    } finally {
      setIsSearching(false);
    }
  }, [pdfDoc, totalPages, extractPageText, goToPage]);

  // Navigate to next/previous search result
  const navigateSearchResult = useCallback((direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
    } else {
      newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
    }

    setCurrentSearchIndex(newIndex);
    goToPage(searchResults[newIndex].page);
  }, [searchResults, currentSearchIndex, goToPage]);

  // Handle search input changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [performSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    setShowSearch(false);
  }, []);

  // Setup scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScrollEvent = () => handleScroll();
    container.addEventListener('scroll', handleScrollEvent);

    return () => {
      container.removeEventListener('scroll', handleScrollEvent);
    };
  }, [handleScroll]);

  // Calculate visible pages when PDF loads or dependencies change
  useLayoutEffect(() => {
    if (pdfDoc && file.sourceUrl !== lastCalculatedPdfRef.current) {
      lastCalculatedPdfRef.current = file.sourceUrl;
      // Defer calculation to avoid setState in effect - using requestAnimationFrame
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestAnimationFrame(() => {
        calculateVisiblePages();
      });
    }
  }, [pdfDoc, file.sourceUrl, calculateVisiblePages]);

  // Preload adjacent pages for better performance
  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      preloadAdjacentPages(pdfDoc, currentPage, 2);
    }
  }, [pdfDoc, currentPage]);

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
    <PDFViewerErrorBoundary onRetry={() => {
      // Reset component state and retry loading
      setVisiblePages([]);
      setCurrentPage(1);
      setZoomLevel(1);
      setSearchQuery('');
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      setIsSearching(false);
      setShowSearch(false);
      setPageLoadingStates(new Map());
      // Reload PDF
      if (file.sourceUrl) {
        loadPDF(file.sourceUrl);
      }
    }}>
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
          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showSearch
                ? "bg-white/30 text-white"
                : "text-white/80 hover:bg-white/20"
            )}
            aria-label="Toggle search"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <button
              onClick={() => handleZoomChange(Math.max(0.5, zoomLevel - 0.1))}
              className="p-1 hover:bg-white/30 rounded"
              aria-label="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <select
              value={zoomLevel}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="bg-transparent text-white text-sm font-medium border-none outline-none cursor-pointer min-w-16"
              aria-label="Zoom level"
            >
              {zoomPresets.map(preset => (
                <option key={preset} value={preset} className="text-black">
                  {Math.round(preset * 100)}%
                </option>
              ))}
            </select>
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
            Fit Width
          </button>
        </div>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search in PDF..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSearching}
              />
              {isSearching && (
                <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
                <button
                  onClick={() => navigateSearchResult('prev')}
                  disabled={searchResults.length <= 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  aria-label="Previous search result"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateSearchResult('next')}
                  disabled={searchResults.length <= 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  aria-label="Next search result"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={clearSearch}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Close search"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 max-h-32 overflow-y-auto">
              <div className="text-sm text-gray-600 mb-2">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </div>
              <div className="space-y-1">
                {searchResults.slice(0, 5).map((result, index) => (
                  <button
                    key={result.index}
                    onClick={() => {
                      setCurrentSearchIndex(result.index);
                      goToPage(result.page);
                    }}
                    className={cn(
                      "w-full text-left p-2 rounded hover:bg-gray-50 transition-colors",
                      currentSearchIndex === result.index && "bg-blue-50 border border-blue-200"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Page {result.page}</span>
                      <span className="text-xs text-gray-500">#{result.index + 1}</span>
                    </div>
                    <div className="text-xs text-gray-600 truncate mt-1">
                      {result.text}
                    </div>
                  </button>
                ))}
                {searchResults.length > 5 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    ... and {searchResults.length - 5} more results
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
                    className="flex items-center justify-center relative"
                    style={{ height: `calc(100% - 40px)` }}
                  >
                    {pageLoadingStates.get(page) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-lg">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600">Loading page...</span>
                        </div>
                      </div>
                    )}
                    <canvas
                      ref={(el) => {
                        if (el) {
                          canvasRefs.current.set(page, el);
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
    </PDFViewerErrorBoundary>
  );
});

PDFViewer.displayName = 'PDFViewer';
