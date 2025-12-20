"""
Metrics and monitoring utilities for the RAG platform
"""
import time
import psutil
import logging
from typing import Dict, Any, Optional, List, Callable
from functools import wraps
from datetime import datetime
from collections import defaultdict, deque
import threading

logger = logging.getLogger(__name__)


class MetricsCollector:
    """Simple metrics collection system"""

    def __init__(self):
        self.counters: Dict[str, int] = defaultdict(int)
        self.gauges: Dict[str, float] = {}
        self.histograms: Dict[str, List[float]] = defaultdict(list)
        self.timers: Dict[str, List[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def increment_counter(self, name: str, value: int = 1):
        """Increment a counter"""
        with self._lock:
            self.counters[name] += value

    def set_gauge(self, name: str, value: float):
        """Set a gauge value"""
        with self._lock:
            self.gauges[name] = value

    def record_histogram(self, name: str, value: float):
        """Record a value in a histogram"""
        with self._lock:
            self.histograms[name].append(value)
            # Keep only last 1000 values
            if len(self.histograms[name]) > 1000:
                self.histograms[name] = self.histograms[name][-1000:]

    def record_timer(self, name: str, duration: float):
        """Record a timer duration"""
        with self._lock:
            self.timers[name].append(duration)
            # Keep only last 1000 values
            if len(self.timers[name]) > 1000:
                self.timers[name] = self.timers[name][-1000:]

    def get_metrics(self) -> Dict[str, Any]:
        """Get all metrics"""
        with self._lock:
            metrics = {
                "counters": dict(self.counters),
                "gauges": dict(self.gauges),
                "histograms": {},
                "timers": {}
            }

            # Calculate histogram statistics
            for name, values in self.histograms.items():
                if values:
                    metrics["histograms"][name] = {
                        "count": len(values),
                        "min": min(values),
                        "max": max(values),
                        "avg": sum(values) / len(values)
                    }

            # Calculate timer statistics
            for name, values in self.timers.items():
                if values:
                    metrics["timers"][name] = {
                        "count": len(values),
                        "min": min(values),
                        "max": max(values),
                        "avg": sum(values) / len(values),
                        "total": sum(values)
                    }

            return metrics

    def reset(self):
        """Reset all metrics"""
        with self._lock:
            self.counters.clear()
            self.gauges.clear()
            self.histograms.clear()
            self.timers.clear()


class PerformanceMonitor:
    """Performance monitoring utilities"""

    def __init__(self):
        self.metrics = MetricsCollector()

    def time_function(self, func_name: str):
        """Decorator to time function execution"""
        def decorator(func: Callable):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    duration = time.time() - start_time
                    self.metrics.record_timer(f"function.{func_name}", duration)
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    self.metrics.record_timer(f"function.{func_name}.error", duration)
                    raise e

            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    duration = time.time() - start_time
                    self.metrics.record_timer(f"function.{func_name}", duration)
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    self.metrics.record_timer(f"function.{func_name}.error", duration)
                    raise e

            if hasattr(func, '__call__') and hasattr(func, '__wrapped__'):
                # Already wrapped
                return func
            elif hasattr(func, '__call__'):
                import asyncio
                if asyncio.iscoroutinefunction(func):
                    return async_wrapper
                else:
                    return sync_wrapper
            else:
                return func

        return decorator

    def get_system_metrics(self) -> Dict[str, Any]:
        """Get system performance metrics"""
        try:
            return {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "memory_used": psutil.virtual_memory().used,
                "memory_total": psutil.virtual_memory().total,
                "disk_usage": psutil.disk_usage('/').percent,
                "network_connections": len(psutil.net_connections()),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
            return {"error": str(e)}

    def get_application_metrics(self) -> Dict[str, Any]:
        """Get application-specific metrics"""
        return self.metrics.get_metrics()


# Global metrics collector
metrics_collector = MetricsCollector()
performance_monitor = PerformanceMonitor()


def increment_counter(name: str, value: int = 1):
    """Increment a global counter"""
    metrics_collector.increment_counter(name, value)


def set_gauge(name: str, value: float):
    """Set a global gauge"""
    metrics_collector.set_gauge(name, value)


def record_histogram(name: str, value: float):
    """Record a value in a global histogram"""
    metrics_collector.record_histogram(name, value)


def time_function(name: str):
    """Decorator to time function execution globally"""
    return performance_monitor.time_function(name)
