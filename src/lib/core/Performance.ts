// Performance optimization utilities and patterns
import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
} from "react";

// Types for performance utilities
interface VirtualListOptions<T> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  containerHeight: number;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  enableSmoothScrolling?: boolean;
  scrollThreshold?: number;
  onScrollDirectionChange?: (direction: "up" | "down") => void;
}

interface VirtualListResult<T> {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollToIndex: (index: number, align?: "start" | "center" | "end") => void;
  getItemOffset: (index: number) => number;
  isScrolling: boolean;
}

interface LazyImageOptions {
  threshold?: number;
  rootMargin?: string;
}

interface LazyImageResult {
  ref: React.RefObject<HTMLImageElement | null>;
  src: string;
  isLoaded: boolean;
  error: string;
}

interface PerformanceMetrics {
  count: number;
  average: number;
  min: number;
  max: number;
  p95: number;
}

interface MemoryInfo {
  used: number;
  total: number;
  limit: number;
}

interface BundleAnalysis {
  jsSize: string;
  cssSize: string;
  imageSize: string;
  totalSize: string;
  recommendations: string[];
}

interface CacheStatus {
  cached: number;
  loading: number;
}

interface MemoryLeakStats {
  leakedListeners: number;
  leakedTimers: number;
  leakedIntervals: number;
}

// Advanced virtual list implementation with dynamic heights and optimizations
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
  enableSmoothScrolling = false,
  scrollThreshold = 100,
  onScrollDirectionChange,
}: VirtualListOptions<T>): VirtualListResult<T> {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("down");
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate item heights and offsets
  const itemHeights = useMemo(() => {
    return items.map((item, index) =>
      typeof itemHeight === "function" ? itemHeight(item, index) : itemHeight,
    );
  }, [items, itemHeight]);

  // Calculate cumulative offsets for each item
  const itemOffsets = useMemo(() => {
    const offsets = [0];
    for (let i = 1; i <= items.length; i++) {
      offsets[i] = offsets[i - 1] + itemHeights[i - 1];
    }
    return offsets;
  }, [itemHeights, items.length]);

  // Total height of all items
  const totalHeight = itemOffsets[items.length] || 0;

  // Find item index by scroll position using binary search for performance
  const findItemIndex = useCallback(
    (scrollY: number): number => {
      let low = 0;
      let high = items.length - 1;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const itemTop = itemOffsets[mid];
        const itemBottom = itemTop + itemHeights[mid];

        if (scrollY >= itemTop && scrollY < itemBottom) {
          return mid;
        } else if (scrollY < itemTop) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      return Math.max(0, Math.min(items.length - 1, low));
    },
    [itemOffsets, itemHeights, items.length],
  );

  // Calculate visible range with overscan
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, findItemIndex(scrollTop) - overscan);
    let endIndex = startIndex;

    let currentOffset = itemOffsets[startIndex];
    const maxVisibleOffset = scrollTop + containerHeight;

    while (
      endIndex < items.length &&
      currentOffset < maxVisibleOffset + overscan * 50
    ) {
      currentOffset += itemHeights[endIndex];
      endIndex++;
    }

    endIndex = Math.min(items.length - 1, endIndex + overscan);

    return { startIndex, endIndex };
  }, [
    scrollTop,
    containerHeight,
    overscan,
    findItemIndex,
    itemOffsets,
    itemHeights,
    items.length,
  ]);

  // Get visible items slice
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  // Calculate offset for positioning
  const offsetY = useMemo(() => {
    return itemOffsets[visibleRange.startIndex] || 0;
  }, [itemOffsets, visibleRange.startIndex]);

  // Enhanced scroll handler with direction detection and smooth scrolling
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const currentScrollTop = e.currentTarget.scrollTop;
      const newDirection =
        currentScrollTop > lastScrollTop.current ? "down" : "up";

      // Update scroll direction if changed
      if (newDirection !== scrollDirection) {
        setScrollDirection(newDirection);
        onScrollDirectionChange?.(newDirection);
      }

      setScrollTop(currentScrollTop);
      lastScrollTop.current = currentScrollTop;

      // Set scrolling state
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Reset scrolling state after threshold
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, scrollThreshold);
    },
    [scrollDirection, scrollThreshold, onScrollDirectionChange],
  );

  // Scroll to specific index with alignment
  const scrollToIndex = useCallback(
    (index: number, align: "start" | "center" | "end" = "start") => {
      if (!containerRef.current || index < 0 || index >= items.length) return;

      const itemOffset = itemOffsets[index];
      const itemHeightValue = itemHeights[index];

      let targetScrollTop: number;

      switch (align) {
        case "center":
          targetScrollTop =
            itemOffset - containerHeight / 2 + itemHeightValue / 2;
          break;
        case "end":
          targetScrollTop = itemOffset - containerHeight + itemHeightValue;
          break;
        case "start":
        default:
          targetScrollTop = itemOffset;
          break;
      }

      targetScrollTop = Math.max(
        0,
        Math.min(targetScrollTop, totalHeight - containerHeight),
      );

      if (
        enableSmoothScrolling &&
        "scrollBehavior" in containerRef.current.style
      ) {
        containerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      } else {
        containerRef.current.scrollTop = targetScrollTop;
      }
    },
    [
      itemOffsets,
      itemHeights,
      items.length,
      containerHeight,
      totalHeight,
      enableSmoothScrolling,
    ],
  );

  // Get offset for specific item index
  const getItemOffset = useCallback(
    (index: number): number => {
      return itemOffsets[index] || 0;
    },
    [itemOffsets],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    visibleItems,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
    offsetY,
    totalHeight,
    onScroll: handleScroll,
    scrollToIndex,
    getItemOffset,
    isScrolling,
  };
}

// Image lazy loading hook with enhanced error handling
export function useLazyImage(
  src: string,
  options: LazyImageOptions = {},
): LazyImageResult {
  const { threshold = 0.1, rootMargin = "50px" } = options;
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const imgElement = imgRef.current;
    if (!imgElement) return;

    // Create intersection observer with error handling
    let observer: IntersectionObserver | null = null;

    try {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isLoaded) {
              setImageSrc(src);
              setIsLoaded(true);
              setError("");
            }
          });
        },
        { threshold, rootMargin },
      );

      observer.observe(imgElement);
      observerRef.current = observer;
    } catch (err) {
      // Handle observer creation error asynchronously
      setTimeout(() => {
        setError(`IntersectionObserver not supported: ${err}`);
      }, 0);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [src, threshold, rootMargin, isLoaded]);

  return {
    ref: imgRef,
    src: imageSrc,
    isLoaded,
    error,
  };
}

// Debounce hook with proper TypeScript types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Return properly typed debounced function
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  ) as T;
}

// Throttle hook with improved implementation
export function useThrottle<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number,
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Return throttled function with proper timing
  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            lastCallRef.current = Date.now();
            callbackRef.current(...args);
          },
          delay - (now - lastCallRef.current),
        );
      }
    },
    [delay],
  ) as T;
}

// Enhanced memo wrapper with better type safety
export function memo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean,
): React.ComponentType<P> {
  return React.memo(Component, areEqual);
}

// Performance monitoring utilities with enhanced metrics
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  // Start timing with automatic cleanup
  static startTiming(key: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }

      this.metrics.get(key)!.push(duration);

      // Keep only last 100 measurements to prevent memory leaks
      const measurements = this.metrics.get(key)!;
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }

  // Get comprehensive metrics for a key
  static getMetrics(key: string): PerformanceMetrics | null {
    const measurements = this.metrics.get(key);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const count = measurements.length;
    const sum = measurements.reduce((acc, val) => acc + val, 0);
    const average = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];

    // Calculate 95th percentile
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return {
      count,
      average,
      min,
      max,
      p95,
    };
  }

  // Get all metrics as a record
  static getAllMetrics(): Record<string, PerformanceMetrics> {
    const allMetrics: Record<string, PerformanceMetrics> = {};

    for (const key of this.metrics.keys()) {
      const metrics = this.getMetrics(key);
      if (metrics) {
        allMetrics[key] = metrics;
      }
    }

    return allMetrics;
  }

  // Clear all metrics data
  static clearMetrics(): void {
    this.metrics.clear();
  }

  // Enhanced logging with development checks
  static logMetrics(): void {
    if (process.env.NODE_ENV === "development") {
      console.group("🚀 Performance Metrics");

      const allMetrics = this.getAllMetrics();
      const entries = Object.entries(allMetrics);

      if (entries.length === 0) {
        console.log("No metrics recorded yet");
      } else {
        entries.forEach(([key, metrics]) => {
          console.group(`📊 ${key}`);
          console.log(`Count: ${metrics.count}`);
          console.log(`Average: ${metrics.average.toFixed(2)}ms`);
          console.log(`Min: ${metrics.min.toFixed(2)}ms`);
          console.log(`Max: ${metrics.max.toFixed(2)}ms`);
          console.log(`95th percentile: ${metrics.p95.toFixed(2)}ms`);
          console.groupEnd();
        });
      }

      console.groupEnd();
    }
  }
}

// Enhanced resource loading with better caching
export class ResourceLoader {
  private static cache = new Map<string, Promise<unknown>>();
  private static loadingPromises = new Map<string, Promise<unknown>>();
  private static cacheTimestamps = new Map<string, number>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Load resource with TTL-based caching and deduplication
  static async load<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number = this.CACHE_TTL,
  ): Promise<T> {
    const now = Date.now();
    const cachedTimestamp = this.cacheTimestamps.get(key);

    // Check if cached version is still valid
    if (this.cache.has(key) && cachedTimestamp && now - cachedTimestamp < ttl) {
      return this.cache.get(key)! as Promise<T>;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)! as Promise<T>;
    }

    // Create new loading promise
    const loadingPromise = loader();
    this.loadingPromises.set(key, loadingPromise);

    try {
      const result = await loadingPromise;
      this.cache.set(key, Promise.resolve(result));
      this.cacheTimestamps.set(key, now);
      return result;
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  // Enhanced preload with error handling
  static async preload(
    keys: string[],
    loader: (key: string) => Promise<void>,
    ttl?: number,
  ): Promise<void> {
    const promises = keys.map((key) =>
      this.load(key, () => loader(key), ttl).catch((error) => {
        console.warn(`Failed to preload resource ${key}:`, error);
      }),
    );

    await Promise.all(promises);
  }

  // Clear expired cache entries
  static clearExpiredCache(): void {
    const now = Date.now();

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  // Clear all cache data
  static clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
    this.cacheTimestamps.clear();
  }

  // Get enhanced cache status
  static getCacheStatus(): CacheStatus {
    this.clearExpiredCache(); // Clean up expired entries

    return {
      cached: this.cache.size,
      loading: this.loadingPromises.size,
    };
  }
}

// Bundle analysis with real data integration
export class BundleAnalyzer {
  // Analyze current bundle size with better recommendations
  static analyzeBundle(): BundleAnalysis {
    const recommendations: string[] = [];

    // Mock data - would integrate with webpack-bundle-analyzer
    const jsSize = "256 KB";
    const cssSize = "64 KB";
    const imageSize = "128 KB";

    const jsKb = parseFloat(jsSize);
    const cssKb = parseFloat(cssSize);
    const imageKb = parseFloat(imageSize);

    if (jsKb > 300) {
      recommendations.push(
        "Consider code splitting for large JavaScript bundles",
      );
      recommendations.push(
        "Use dynamic imports for route-based code splitting",
      );
    }

    if (cssKb > 100) {
      recommendations.push("Optimize CSS with purging and minification");
      recommendations.push("Consider CSS-in-JS for component-scoped styles");
    }

    if (imageKb > 200) {
      recommendations.push(
        "Optimize images with compression and next-gen formats",
      );
      recommendations.push("Implement responsive images with srcset");
    }

    const totalKb = jsKb + cssKb + imageKb;
    const totalSize = `${totalKb.toFixed(0)} KB`;

    return {
      jsSize,
      cssSize,
      imageSize,
      totalSize,
      recommendations,
    };
  }

  // Enhanced bundle monitoring
  static startBundleMonitoring(): void {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "📦 Bundle monitoring started - integrate with webpack-bundle-analyzer for detailed analysis",
      );

      // Monitor performance impact of bundle loading
      if ("PerformanceObserver" in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (
                entry.name.includes("bundle") ||
                entry.name.includes("chunk")
              ) {
                console.log(
                  `Bundle loaded: ${entry.name} (${entry.duration.toFixed(2)}ms)`,
                );
              }
            }
          });

          observer.observe({ entryTypes: ["measure"] });
        } catch (error) {
          console.warn("PerformanceObserver not supported:", error);
        }
      }
    }
  }
}

// Enhanced memory leak detection
export class MemoryLeakDetector {
  private static observers = new Set<() => void>();
  private static timers = new Set<NodeJS.Timeout>();
  private static intervals = new Set<NodeJS.Timeout>();
  private static eventListeners = new Map<Element, Map<string, () => void>>();

  // Track event listeners with element reference
  static trackEventListener(
    element: Element,
    event: string,
    add: () => void,
    remove: () => void,
  ): () => void {
    add();

    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, new Map());
    }

    this.eventListeners.get(element)!.set(event, remove);
    this.observers.add(remove);

    return () => {
      remove();
      this.observers.delete(remove);
      const elementListeners = this.eventListeners.get(element);
      if (elementListeners) {
        elementListeners.delete(event);
        if (elementListeners.size === 0) {
          this.eventListeners.delete(element);
        }
      }
    };
  }

  // Track timers with better management
  static trackTimer(timerId: NodeJS.Timeout): void {
    this.timers.add(timerId);
  }

  // Clear tracked timer
  static clearTrackedTimer(timerId: NodeJS.Timeout): void {
    clearTimeout(timerId);
    this.timers.delete(timerId);
  }

  // Track intervals
  static trackInterval(intervalId: NodeJS.Timeout): void {
    this.intervals.add(intervalId);
  }

  // Clear tracked interval
  static clearTrackedInterval(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    this.intervals.delete(intervalId);
  }

  // Get comprehensive leak statistics
  static detectLeaks(): MemoryLeakStats {
    return {
      leakedListeners: this.observers.size,
      leakedTimers: this.timers.size,
      leakedIntervals: this.intervals.size,
    };
  }

  // Enhanced cleanup with detailed logging
  static cleanup(): void {
    console.group("🧹 Memory Leak Cleanup");

    // Clean up event listeners
    let listenerIndex = 1;
    this.observers.forEach((remove) => {
      try {
        remove();
        console.log(`Cleaned up event listener ${listenerIndex}`);
        listenerIndex++;
      } catch (error) {
        console.warn(
          `Failed to cleanup event listener ${listenerIndex}:`,
          error,
        );
        listenerIndex++;
      }
    });
    this.observers.clear();

    // Clean up timers
    let timerIndex = 1;
    this.timers.forEach((timerId) => {
      try {
        clearTimeout(timerId);
        console.log(`Cleaned up timer ${timerIndex}`);
        timerIndex++;
      } catch (error) {
        console.warn(`Failed to cleanup timer ${timerIndex}:`, error);
        timerIndex++;
      }
    });
    this.timers.clear();

    // Clean up intervals
    let intervalIndex = 1;
    this.intervals.forEach((intervalId) => {
      try {
        clearInterval(intervalId);
        console.log(`Cleaned up interval ${intervalIndex}`);
        intervalIndex++;
      } catch (error) {
        console.warn(`Failed to cleanup interval ${intervalIndex}:`, error);
        intervalIndex++;
      }
    });
    this.intervals.clear();

    this.eventListeners.clear();
    console.log("Memory cleanup completed");
    console.groupEnd();
  }
}

// Enhanced performance utilities with better device detection
export const performanceUtils = {
  // Request idle callback with proper fallback
  requestIdleCallback: (
    callback: () => void,
    options?: { timeout?: number },
  ): number => {
    if ("requestIdleCallback" in globalThis) {
      return (
        globalThis as {
          requestIdleCallback: (
            callback: () => void,
            options?: { timeout?: number },
          ) => number;
        }
      ).requestIdleCallback(callback, options);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      return globalThis.setTimeout(callback, 1) as unknown as number;
    }
  },

  // Cancel idle callback with proper handling
  cancelIdleCallback: (id: number): void => {
    if ("cancelIdleCallback" in globalThis) {
      (
        globalThis as { cancelIdleCallback: (id: number) => void }
      ).cancelIdleCallback(id);
    } else {
      globalThis.clearTimeout(id as unknown as NodeJS.Timeout);
    }
  },

  // Enhanced slow connection detection
  isSlowConnection: (): boolean => {
    if (typeof navigator === "undefined") return false;

    const connection =
      (
        navigator as unknown as {
          connection?: {
            effectiveType?: string;
            type?: string;
            downlink?: number;
          };
          mozConnection?: {
            effectiveType?: string;
            type?: string;
            downlink?: number;
          };
          webkitConnection?: {
            effectiveType?: string;
            type?: string;
            downlink?: number;
          };
        }
      ).connection ||
      (
        navigator as unknown as {
          connection?: {
            effectiveType?: string;
            type?: string;
            downlink?: number;
          };
          mozConnection?: {
            effectiveType?: string;
            type?: string;
            downlink?: number;
          };
          webkitConnection?: {
            effectiveType?: string;
            type?: string;
            downlink?: number;
          };
        }
      ).mozConnection ||
      (
        navigator as unknown as {
          connection?: {
            effectiveType?: string;
            type?: string;
            downlink?: number;
          };
          mozConnection?: {
            effectiveType?: string;
            type?: string;
            downlink?: number;
          };
          webkitConnection?: {
            effectiveType?: string;
            type?: string;
            downlink?: number;
          };
        }
      ).webkitConnection;

    if (!connection) return false;

    const effectiveType = connection.effectiveType || connection.type;
    const downlink = connection.downlink;

    return (
      effectiveType === "slow-2g" ||
      effectiveType === "2g" ||
      effectiveType === "3g" ||
      (downlink !== undefined && downlink < 1)
    );
  },

  // Get device memory info with better typing
  getMemoryInfo: (): MemoryInfo | null => {
    if (typeof performance === "undefined" || !("memory" in performance)) {
      return null;
    }

    const memory = (
      performance as unknown as {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
    ).memory;

    return memory
      ? {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        }
      : null;
  },

  // Enhanced device-specific image optimization
  optimizeImageForDevice: (imageUrl: string): string => {
    if (typeof window === "undefined") return imageUrl;

    const isSlow = performanceUtils.isSlowConnection();
    const memoryInfo = performanceUtils.getMemoryInfo();
    const isLowMemory = memoryInfo && memoryInfo.used / memoryInfo.limit > 0.8;

    if (isSlow || isLowMemory) {
      // Return lower quality image for slow connections or low memory
      return imageUrl.replace(/(\.jpg|\.jpeg|\.png)$/i, (match) =>
        match.replace(".", "-low-quality."),
      );
    }

    return imageUrl;
  },
};

// Main performance module export with comprehensive types
const performanceModule = {
  useVirtualList,
  useLazyImage,
  useDebounce,
  useThrottle,
  memo,
  PerformanceMonitor,
  ResourceLoader,
  BundleAnalyzer,
  MemoryLeakDetector,
  performanceUtils,
};

export default performanceModule;
