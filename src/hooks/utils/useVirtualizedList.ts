import { useState, useMemo, useCallback } from "react";
import { PDFFile, VirtualizationResult } from "@/types/pdf";

/**
 * Hook for virtualizing large lists of PDF files
 * Only renders items currently visible in the viewport for optimal performance
 */
export const useVirtualizedList = (
  items: PDFFile[],
  containerHeight = 600,
  itemHeight = 64,
): VirtualizationResult<PDFFile> => {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate which items should be visible
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // +2 for buffer
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    startIndex,
    totalItems: items.length,
    handleScroll,
    itemHeight,
  };
};
