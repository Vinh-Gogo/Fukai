import { useState, useCallback, useEffect, useRef } from 'react';
import { PDFVirtualizationResult } from '@/app/pdfs/components/types';

export const usePDFVirtualization = (
  totalPages: number,
  containerHeight: number = 800,
  pageHeight: number = 1100
): PDFVirtualizationResult => {
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  const calculateVisiblePages = useCallback((scrollTop?: number) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const currentScrollTop = scrollTop ?? container.scrollTop;
    const viewportHeight = container.clientHeight;

    // Calculate first visible page with buffer
    const bufferPages = 1;
    const firstVisiblePage = Math.max(1, Math.floor(currentScrollTop / (pageHeight * zoomLevel)) + 1 - bufferPages);

    // Calculate number of pages to render (viewport + buffer)
    const pagesToRender = Math.ceil(viewportHeight / (pageHeight * zoomLevel)) + bufferPages * 2;

    const newVisiblePages = [];
    for (let i = 0; i < pagesToRender; i++) {
      const page = firstVisiblePage + i;
      if (page >= 1 && page <= totalPages) {
        newVisiblePages.push(page);
      }
    }

    setVisiblePages(newVisiblePages);
    setCurrentPage(Math.max(1, Math.min(totalPages, firstVisiblePage + bufferPages)));
    lastScrollTop.current = currentScrollTop;
  }, [totalPages, pageHeight, zoomLevel]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    calculateVisiblePages(container.scrollTop);
  }, [calculateVisiblePages]);

  const goToPage = useCallback((page: number) => {
    if (!containerRef.current || page < 1 || page > totalPages) return;

    const newScrollTop = (page - 1) * pageHeight * zoomLevel;
    containerRef.current.scrollTop = newScrollTop;
    setCurrentPage(page);
    calculateVisiblePages(newScrollTop);
  }, [totalPages, pageHeight, zoomLevel, calculateVisiblePages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    // Initial calculation
    calculateVisiblePages(container.scrollTop);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, calculateVisiblePages]);

  useEffect(() => {
    // Recalculate when zoom changes
    const container = containerRef.current;
    if (container) {
      calculateVisiblePages(container.scrollTop);
    }
  }, [zoomLevel, calculateVisiblePages]);

  return {
    visiblePages,
    currentPage,
    totalPages,
    containerRef,
    goToPage,
    zoomLevel,
    setZoom: setZoomLevel,
    pageHeight: pageHeight * zoomLevel
  };
};
