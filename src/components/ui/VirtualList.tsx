import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// Types
export interface VirtualListItem {
  id: string | number;
  height?: number;
  [key: string]: unknown;
}

export interface VirtualListProps {
  /** Array of items to render */
  items: VirtualListItem[];

  /** Item height in pixels (for fixed height items) */
  itemHeight?: number;

  /** Container height in pixels */
  containerHeight?: number;

  /** Number of items to render outside visible area for smoother scrolling */
  overscan?: number;

  /** Custom render function for each item */
  renderItem: (item: VirtualListItem, index: number) => ReactNode;

  /** Custom key function */
  keyExtractor?: (item: VirtualListItem, index: number) => string | number;

  /** Called when items come into view */
  onItemsRendered?: (startIndex: number, endIndex: number) => void;

  /** Loading state */
  loading?: boolean;

  /** Empty state content */
  emptyContent?: ReactNode;

  /** Additional CSS classes */
  className?: string;

  /** Scroll behavior */
  scrollBehavior?: "smooth" | "auto";
}

/**
 * VirtualList component for efficiently rendering large lists
 * Only renders visible items plus a small buffer for smooth scrolling
 */
export const VirtualList = forwardRef<HTMLDivElement, VirtualListProps>(
  (
    {
      items,
      itemHeight = 50,
      containerHeight = 400,
      overscan = 5,
      renderItem,
      keyExtractor,
      onItemsRendered,
      loading = false,
      emptyContent,
      className,
      scrollBehavior = "auto",
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    // Calculate visible range
    const visibleRange = useMemo(() => {
      if (items.length === 0) return { start: 0, end: 0 };

      const itemCount = items.length;
      const start = Math.floor(scrollTop / itemHeight);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const end = Math.min(itemCount - 1, start + visibleCount);

      // Add overscan
      const startWithOverscan = Math.max(0, start - overscan);
      const endWithOverscan = Math.min(itemCount - 1, end + overscan);

      return {
        start: startWithOverscan,
        end: endWithOverscan,
        visibleStart: start,
        visibleEnd: end,
      };
    }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

    // Get items to render
    const itemsToRender = useMemo(() => {
      if (items.length === 0) return [];

      return items
        .slice(visibleRange.start, visibleRange.end + 1)
        .map((item, index) => ({
          item,
          index: visibleRange.start + index,
          style: {
            position: "absolute" as const,
            top: (visibleRange.start + index) * itemHeight,
            width: "100%",
            height: itemHeight,
          },
        }));
    }, [items, visibleRange, itemHeight]);

    // Handle scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
    }, []);

    // Notify about rendered items
    useEffect(() => {
      if (
        onItemsRendered &&
        visibleRange.visibleStart !== undefined &&
        visibleRange.visibleEnd !== undefined
      ) {
        onItemsRendered(visibleRange.visibleStart, visibleRange.visibleEnd);
      }
    }, [visibleRange.visibleStart, visibleRange.visibleEnd, onItemsRendered]);

    // Default key extractor
    const getKey = useCallback(
      (item: VirtualListItem, index: number) => {
        if (keyExtractor) return keyExtractor(item, index);
        return item.id || index;
      },
      [keyExtractor],
    );

    // Total height calculation
    const totalHeight = items.length * itemHeight;

    // Handle empty state
    if (!loading && items.length === 0 && emptyContent) {
      return (
        <div
          ref={ref}
          className={cn("flex items-center justify-center", className)}
          style={{ height: containerHeight }}
          {...props}
        >
          {emptyContent}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-auto",
          scrollBehavior === "smooth" && "scroll-smooth",
          className,
        )}
        style={{
          height: containerHeight,
          scrollBehavior,
        }}
        onScroll={handleScroll}
        {...props}
      >
        <div
          style={{
            height: totalHeight,
            position: "relative",
          }}
        >
          {itemsToRender.map(({ item, index, style }) => (
            <div
              key={getKey(item, index)}
              style={style}
              className="flex items-center"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Loading...
              </span>
            </div>
          </div>
        )}
      </div>
    );
  },
);

VirtualList.displayName = "VirtualList";

// ============================================================================
// VirtualGrid Component
// ============================================================================

export interface VirtualGridProps extends Omit<VirtualListProps, "renderItem"> {
  /** Number of columns */
  columns?: number;

  /** Gap between items */
  gap?: number;

  /** Custom render function for each grid item */
  renderItem: (item: VirtualListItem, index: number) => ReactNode;

  /** Grid item aspect ratio (width/height) */
  aspectRatio?: number;
}

/**
 * VirtualGrid component for efficiently rendering large grids
 */
export const VirtualGrid = forwardRef<HTMLDivElement, VirtualGridProps>(
  (
    {
      items,
      columns = 3,
      gap = 8,
      containerHeight = 400,
      overscan = 5,
      renderItem,
      keyExtractor,
      onItemsRendered,
      loading = false,
      emptyContent,
      className,
      aspectRatio = 1,
      scrollBehavior = "auto",
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    // Calculate grid dimensions
    const itemWidth = useMemo(() => {
      return `calc(${100 / columns}% - ${(gap * (columns - 1)) / columns}px)`;
    }, [columns, gap]);

    const itemHeight = useMemo(() => {
      return `calc(${itemWidth} / ${aspectRatio})`;
    }, [itemWidth, aspectRatio]);

    // Calculate rows and visible range
    const rows = Math.ceil(items.length / columns);
    const rowHeight = 100; // We'll use percentage-based calculations

    const visibleRange = useMemo(() => {
      if (items.length === 0) return { start: 0, end: 0 };

      const start = Math.floor(scrollTop / rowHeight);
      const visibleCount = Math.ceil(containerHeight / rowHeight);
      const end = Math.min(rows - 1, start + visibleCount);

      // Add overscan
      const startWithOverscan = Math.max(0, start - overscan);
      const endWithOverscan = Math.min(rows - 1, end + overscan);

      return {
        start: startWithOverscan,
        end: endWithOverscan,
        visibleStart: start,
        visibleEnd: end,
      };
    }, [scrollTop, rowHeight, containerHeight, overscan, rows]);

    // Get items to render
    const itemsToRender = useMemo(() => {
      const result: Array<{
        item: VirtualListItem;
        index: number;
        row: number;
        col: number;
        style: React.CSSProperties;
      }> = [];

      for (let row = visibleRange.start; row <= visibleRange.end; row++) {
        for (let col = 0; col < columns; col++) {
          const index = row * columns + col;
          if (index >= items.length) break;

          const item = items[index];
          result.push({
            item,
            index,
            row,
            col,
            style: {
              position: "absolute",
              top: row * rowHeight,
              left: `calc(${col} * (${100 / columns}% + ${gap}px))`,
              width: itemWidth,
              height: itemHeight,
              marginRight: col < columns - 1 ? gap : 0,
            },
          });
        }
      }

      return result;
    }, [items, visibleRange, columns, gap, itemWidth, itemHeight, rowHeight]);

    // Handle scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
    }, []);

    // Default key extractor
    const getKey = useCallback(
      (item: VirtualListItem, index: number) => {
        if (keyExtractor) return keyExtractor(item, index);
        return item.id || index;
      },
      [keyExtractor],
    );

    // Handle empty state
    if (!loading && items.length === 0 && emptyContent) {
      return (
        <div
          ref={ref}
          className={cn("flex items-center justify-center", className)}
          style={{ height: containerHeight }}
          {...props}
        >
          {emptyContent}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-auto",
          scrollBehavior === "smooth" && "scroll-smooth",
          className,
        )}
        style={{
          height: containerHeight,
          scrollBehavior,
        }}
        onScroll={handleScroll}
        {...props}
      >
        <div
          style={{
            height: rows * rowHeight,
            position: "relative",
          }}
        >
          {itemsToRender.map(({ item, index, style }) => (
            <div key={getKey(item, index)} style={style}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Loading...
              </span>
            </div>
          </div>
        )}
      </div>
    );
  },
);

VirtualGrid.displayName = "VirtualGrid";
