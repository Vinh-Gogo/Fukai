/**
 * Performance monitoring and optimization utilities
 */

import React from 'react'

// Performance measurement utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private measurements: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startMeasure(name: string): () => void {
    if (typeof performance === 'undefined') {
      return () => {}
    }

    const start = performance.now()
    return () => {
      const end = performance.now()
      const duration = end - start
      this.measurements.set(name, duration)

      // Log slow operations
      if (duration > 16.67) { // More than one frame at 60fps
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
      }
    }
  }

  measure<T>(name: string, fn: () => T): T {
    const endMeasure = this.startMeasure(name)
    try {
      return fn()
    } finally {
      endMeasure()
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const endMeasure = this.startMeasure(name)
    try {
      return await fn()
    } finally {
      endMeasure()
    }
  }

  getMeasurements(): Record<string, number> {
    return Object.fromEntries(this.measurements)
  }

  clearMeasurements(): void {
    this.measurements.clear()
  }
}

// Global performance monitor instance
export const perfMonitor = PerformanceMonitor.getInstance()

// Optimized memo with shallow comparison
export const memo = React.memo

// Optimized useCallback with dependencies
export const useOptimizedCallback = React.useCallback

// Optimized useMemo with performance tracking
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  name?: string
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const result = React.useMemo(() => {
    if (name) {
      return perfMonitor.measure(name, factory)
    }
    return factory()
  }, [factory, name, ...deps])

  return result
}

// Optimized useEffect with cleanup
export const useOptimizedEffect = React.useEffect

// Debounce utility for performance
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Throttle utility for performance
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = React.useState(false)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      options
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

// Resource preloading utilities
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Memory usage monitoring
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

export function getMemoryUsage(): {
  used: number
  total: number
  limit: number
} | null {
  const performanceWithMemory = performance as PerformanceWithMemory
  if (typeof performance === 'undefined' || !performanceWithMemory.memory) {
    return null
  }

  const memory = performanceWithMemory.memory
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    limit: memory.jsHeapSizeLimit,
  }
}

// Performance observer for long tasks
export function observeLongTasks(callback: (duration: number) => void): () => void {
  if (typeof PerformanceObserver === 'undefined') {
    return () => {}
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) { // Tasks longer than 50ms
        callback(entry.duration)
      }
    }
  })

  observer.observe({ entryTypes: ['longtask'] })

  return () => observer.disconnect()
}
