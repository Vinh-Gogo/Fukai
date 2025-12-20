import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { memo, perfMonitor, getMemoryUsage, observeLongTasks, useOptimizedMemo } from '@/lib/performance'
import { Card, CardHeader, CardTitle, CardContent } from './Card'
import { Button } from './Button'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: {
    used: number
    total: number
    limit: number
  } | null
  longTasks: number
  measurements: Record<string, number>
}

interface PerformanceDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export const PerformanceDashboard = memo<PerformanceDashboardProps>(({
  isOpen,
  onClose
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: null,
    longTasks: 0,
    measurements: {}
  })

  const [isMonitoring, setIsMonitoring] = useState(false)
  const monitoringRef = useRef(false)

  // Memoize formatted metrics for performance
  const formattedMetrics = useOptimizedMemo(() => {
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatTime = (ms: number) => {
      if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`
      if (ms < 1000) return `${ms.toFixed(2)}ms`
      return `${(ms / 1000).toFixed(2)}s`
    }

    return {
      memory: metrics.memoryUsage ? {
        used: formatBytes(metrics.memoryUsage.used),
        total: formatBytes(metrics.memoryUsage.total),
        limit: formatBytes(metrics.memoryUsage.limit),
        percentage: ((metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100).toFixed(1)
      } : null,
      renderTime: formatTime(metrics.renderTime),
      measurements: Object.entries(metrics.measurements).map(([name, time]) => ({
        name,
        time: formatTime(time),
        isSlow: time > 16.67 // Slower than 60fps
      }))
    }
  }, [metrics])

  // Start performance monitoring
  useEffect(() => {
    if (!isOpen) {
      monitoringRef.current = false
      return
    }

    if (monitoringRef.current) return

    monitoringRef.current = true

    // Update metrics periodically
    const interval = setInterval(() => {
      if (!monitoringRef.current) return
      setMetrics(prev => ({
        ...prev,
        memoryUsage: getMemoryUsage(),
        measurements: perfMonitor.getMeasurements(),
        renderTime: performance.now() // Approximate render time
      }))
    }, 1000)

    // Monitor long tasks
    const cleanupLongTasks = observeLongTasks((duration) => {
      if (!monitoringRef.current) return
      setMetrics(prev => ({
        ...prev,
        longTasks: prev.longTasks + 1
      }))
    })

    return () => {
      monitoringRef.current = false
      clearInterval(interval)
      cleanupLongTasks()
    }
  }, [isOpen])

  // Update monitoring state separately to avoid setState in effect
  useLayoutEffect(() => {
    setIsMonitoring(monitoringRef.current)
  }, [isOpen])

  // Clear measurements
  const clearMeasurements = () => {
    perfMonitor.clearMeasurements()
    setMetrics(prev => ({
      ...prev,
      measurements: {},
      longTasks: 0
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Dashboard</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={clearMeasurements}>
                Clear Measurements
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Memory Usage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {formattedMetrics.memory ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used:</span>
                      <span>{formattedMetrics.memory.used}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total:</span>
                      <span>{formattedMetrics.memory.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Limit:</span>
                      <span>{formattedMetrics.memory.limit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          parseFloat(formattedMetrics.memory.percentage) > 80
                            ? 'bg-red-500'
                            : parseFloat(formattedMetrics.memory.percentage) > 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${formattedMetrics.memory.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-center text-gray-600">
                      {formattedMetrics.memory.percentage}%
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Memory monitoring not available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Render Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current render:</span>
                    <span>{formattedMetrics.renderTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Long tasks:</span>
                    <span>{metrics.longTasks}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Long tasks ({'>'}50ms): {metrics.longTasks}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total measurements:</span>
                    <span>{formattedMetrics.measurements.length}</span>
                  </div>
                    <div className="flex justify-between text-sm">
                      <span>Slow operations:</span>
                      <span>
                        {formattedMetrics.measurements.filter((m) => m.isSlow).length}
                      </span>
                    </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Operations taking {'>'}16.67ms
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Measurements */}
          {formattedMetrics.measurements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Detailed Measurements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {formattedMetrics.measurements.map((measurement, index) => (
                    <div
                      key={index}
                      className={`flex justify-between p-2 rounded text-sm ${
                        measurement.isSlow
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="font-mono">{measurement.name}</span>
                      <span className="font-mono">{measurement.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance Optimization Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Use React.memo for components that re-render frequently</li>
                <li>• Memoize expensive calculations with useMemo</li>
                <li>• Use useCallback for event handlers passed to child components</li>
                <li>• Implement virtual scrolling for large lists</li>
                <li>• Lazy load components and routes</li>
                <li>• Optimize images and use modern formats (WebP)</li>
                <li>• Minimize bundle size with code splitting</li>
                <li>• Use service workers for caching and offline functionality</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
})

PerformanceDashboard.displayName = 'PerformanceDashboard'
