"""
Retry and timeout utilities for the RAG platform
"""
import asyncio
import time
from typing import Any, Callable, Optional, Type, Union, Dict, List
from functools import wraps
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class RetryError(Exception):
    """Exception raised when all retry attempts fail"""

    def __init__(self, message: str, attempts: int, last_exception: Exception):
        self.message = message
        self.attempts = attempts
        self.last_exception = last_exception
        super().__init__(f"{message} (after {attempts} attempts)")


class RetryConfig:
    """Configuration for retry behavior"""

    def __init__(self, max_attempts: int = 3, initial_delay: float = 1.0,
                 backoff_factor: float = 2.0, max_delay: float = 60.0,
                 jitter: bool = True, exceptions: tuple = (Exception,)):
        self.max_attempts = max_attempts
        self.initial_delay = initial_delay
        self.backoff_factor = backoff_factor
        self.max_delay = max_delay
        self.jitter = jitter
        self.exceptions = exceptions


class RetryUtils:
    """Retry utility functions"""

    @staticmethod
    def calculate_delay(attempt: int, config: RetryConfig) -> float:
        """Calculate delay for retry attempt"""
        delay = config.initial_delay * (config.backoff_factor ** (attempt - 1))

        # Apply maximum delay
        delay = min(delay, config.max_delay)

        # Add jitter to prevent thundering herd
        if config.jitter:
            import random
            delay *= (0.5 + random.random() * 0.5)

        return delay

    @staticmethod
    async def retry_async(func: Callable, *args, config: Optional[RetryConfig] = None, **kwargs) -> Any:
        """Retry an async function"""
        if config is None:
            config = RetryConfig()

        last_exception = None

        for attempt in range(1, config.max_attempts + 1):
            try:
                return await func(*args, **kwargs)
            except config.exceptions as e:
                last_exception = e

                if attempt == config.max_attempts:
                    break

                delay = RetryUtils.calculate_delay(attempt, config)
                logger.warning(f"Attempt {attempt} failed, retrying in {delay:.2f}s: {e}")
                await asyncio.sleep(delay)

        # At this point, last_exception should never be None since we only reach here after all attempts failed
        assert last_exception is not None, "last_exception should not be None when raising RetryError"
        raise RetryError(
            f"Function failed after {config.max_attempts} attempts",
            config.max_attempts,
            last_exception
        )

    @staticmethod
    def retry_sync(func: Callable, *args, config: Optional[RetryConfig] = None, **kwargs) -> Any:
        """Retry a synchronous function"""
        if config is None:
            config = RetryConfig()

        last_exception = None

        for attempt in range(1, config.max_attempts + 1):
            try:
                return func(*args, **kwargs)
            except config.exceptions as e:
                last_exception = e

                if attempt == config.max_attempts:
                    break

                delay = RetryUtils.calculate_delay(attempt, config)
                logger.warning(f"Attempt {attempt} failed, retrying in {delay:.2f}s: {e}")
                time.sleep(delay)

        # At this point, last_exception should never be None since we only reach here after all attempts failed
        assert last_exception is not None, "last_exception should not be None when raising RetryError"
        raise RetryError(
            f"Function failed after {config.max_attempts} attempts",
            config.max_attempts,
            last_exception
        )

    @staticmethod
    def retry_decorator(config: RetryConfig = None):
        """Decorator for retrying functions"""
        def decorator(func: Callable) -> Callable:
            if config is None:
                retry_config = RetryConfig()
            else:
                retry_config = config

            if asyncio.iscoroutinefunction(func):
                @wraps(func)
                async def async_wrapper(*args, **kwargs):
                    return await RetryUtils.retry_async(func, *args, config=retry_config, **kwargs)
                return async_wrapper
            else:
                @wraps(func)
                def sync_wrapper(*args, **kwargs):
                    return RetryUtils.retry_sync(func, *args, config=retry_config, **kwargs)
                return sync_wrapper

        return decorator


class TimeoutUtils:
    """Timeout utility functions"""

    @staticmethod
    async def timeout_async(func: Callable, timeout: float, *args, **kwargs) -> Any:
        """Execute async function with timeout"""
        try:
            return await asyncio.wait_for(func(*args, **kwargs), timeout=timeout)
        except asyncio.TimeoutError:
            raise TimeoutError(f"Function timed out after {timeout} seconds")

    @staticmethod
    def timeout_decorator(timeout: float):
        """Decorator for adding timeout to functions"""
        def decorator(func: Callable) -> Callable:
            if asyncio.iscoroutinefunction(func):
                @wraps(func)
                async def async_wrapper(*args, **kwargs):
                    return await TimeoutUtils.timeout_async(func, timeout, *args, **kwargs)
                return async_wrapper
            else:
                # For sync functions, we can't really timeout them easily
                # This is a placeholder that just calls the function
                @wraps(func)
                def sync_wrapper(*args, **kwargs):
                    return func(*args, **kwargs)
                return sync_wrapper

        return decorator


class CircuitBreaker:
    """Circuit breaker pattern implementation"""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 60.0,
                 expected_exception: Type[Exception] = Exception):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open

    def _can_attempt_reset(self) -> bool:
        """Check if we can attempt to reset the circuit"""
        if self.last_failure_time is None:
            return True

        elapsed = time.time() - self.last_failure_time
        return elapsed >= self.recovery_timeout

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        if self.state == "open":
            if self._can_attempt_reset():
                self.state = "half-open"
            else:
                raise Exception("Circuit breaker is open")

        try:
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)

            # Success - reset failure count if in half-open state
            if self.state == "half-open":
                self.state = "closed"
                self.failure_count = 0

            return result

        except self.expected_exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.failure_count >= self.failure_threshold:
                self.state = "open"

            raise e

    def get_state(self) -> Dict[str, Any]:
        """Get current circuit breaker state"""
        return {
            "state": self.state,
            "failure_count": self.failure_count,
            "last_failure_time": self.last_failure_time,
            "can_attempt_reset": self._can_attempt_reset()
        }


# Convenience functions and decorators
def retry(config: RetryConfig = None):
    """Retry decorator"""
    return RetryUtils.retry_decorator(config)


def timeout(seconds: float):
    """Timeout decorator"""
    return TimeoutUtils.timeout_decorator(seconds)


async def with_retry(func: Callable, max_attempts: int = 3, *args, **kwargs) -> Any:
    """Execute function with retry"""
    config = RetryConfig(max_attempts=max_attempts)
    return await RetryUtils.retry_async(func, *args, config=config, **kwargs)


def with_timeout(func: Callable, timeout_seconds: float, *args, **kwargs) -> Any:
    """Execute function with timeout"""
    return TimeoutUtils.timeout_async(func, timeout_seconds, *args, **kwargs)
