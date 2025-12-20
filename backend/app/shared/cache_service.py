"""
Caching service with multiple backend support
"""
from abc import ABC, abstractmethod
from typing import Any, Optional, Dict, List, Union
import asyncio
import json
import pickle
import time
from enum import Enum
import logging
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


class CacheBackend(str, Enum):
    """Available cache backends"""
    MEMORY = "memory"
    REDIS = "redis"
    FILE = "file"


class CacheEntry:
    """Represents a cache entry with metadata"""

    def __init__(self, key: str, value: Any, ttl: Optional[int] = None,
                 created_at: Optional[float] = None):
        self.key = key
        self.value = value
        self.ttl = ttl  # Time to live in seconds
        self.created_at = created_at or time.time()
        self.access_count = 0
        self.last_accessed = self.created_at

    @property
    def is_expired(self) -> bool:
        """Check if the entry has expired"""
        if self.ttl is None:
            return False
        return (time.time() - self.created_at) > self.ttl

    @property
    def expires_at(self) -> Optional[float]:
        """Get expiration timestamp"""
        if self.ttl is None:
            return None
        return self.created_at + self.ttl

    @property
    def age(self) -> float:
        """Get age of the entry in seconds"""
        return time.time() - self.created_at

    def touch(self):
        """Update last accessed time"""
        self.access_count += 1
        self.last_accessed = time.time()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "key": self.key,
            "value": self.value,
            "ttl": self.ttl,
            "created_at": self.created_at,
            "access_count": self.access_count,
            "last_accessed": self.last_accessed,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CacheEntry":
        """Create from dictionary"""
        entry = cls(
            key=data["key"],
            value=data["value"],
            ttl=data["ttl"],
            created_at=data["created_at"]
        )
        entry.access_count = data.get("access_count", 0)
        entry.last_accessed = data.get("last_accessed", entry.created_at)
        return entry


class BaseCache(ABC):
    """Abstract base class for cache implementations"""

    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        pass

    @abstractmethod
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL"""
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        pass

    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        pass

    @abstractmethod
    async def clear(self) -> int:
        """Clear all cache entries"""
        pass

    @abstractmethod
    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple values from cache"""
        pass

    @abstractmethod
    async def set_many(self, mapping: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set multiple values in cache"""
        pass

    @abstractmethod
    async def delete_many(self, keys: List[str]) -> int:
        """Delete multiple values from cache"""
        pass

    @abstractmethod
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        pass


class MemoryCache(BaseCache):
    """In-memory cache implementation"""

    def __init__(self, max_size: int = 1000, cleanup_interval: int = 60):
        self._cache: Dict[str, CacheEntry] = {}
        self._max_size = max_size
        self._cleanup_interval = cleanup_interval
        self._lock = asyncio.Lock()
        self._cleanup_task: Optional[asyncio.Task] = None

    async def _start_cleanup_task(self):
        """Start periodic cleanup task"""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())

    async def _periodic_cleanup(self):
        """Periodic cleanup of expired entries"""
        while True:
            try:
                await asyncio.sleep(self._cleanup_interval)
                await self._cleanup_expired()
                await self._enforce_size_limit()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cache cleanup: {e}")

    async def _cleanup_expired(self) -> int:
        """Remove expired entries"""
        async with self._lock:
            expired_keys = [
                key for key, entry in self._cache.items()
                if entry.is_expired
            ]
            for key in expired_keys:
                del self._cache[key]
            return len(expired_keys)

    async def _enforce_size_limit(self):
        """Enforce maximum cache size using LRU eviction"""
        async with self._lock:
            if len(self._cache) <= self._max_size:
                return

            # Sort by last accessed time (oldest first)
            entries = sorted(
                self._cache.items(),
                key=lambda x: x[1].last_accessed
            )

            # Remove oldest entries
            to_remove = len(self._cache) - self._max_size
            for key, _ in entries[:to_remove]:
                del self._cache[key]

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        async with self._lock:
            entry = self._cache.get(key)
            if entry is None or entry.is_expired:
                return None

            entry.touch()
            return entry.value

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL"""
        async with self._lock:
            await self._start_cleanup_task()

            entry = CacheEntry(key, value, ttl)
            self._cache[key] = entry

            # Enforce size limit
            if len(self._cache) > self._max_size:
                await self._enforce_size_limit()

            return True

    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        async with self._lock:
            entry = self._cache.get(key)
            return entry is not None and not entry.is_expired

    async def clear(self) -> int:
        """Clear all cache entries"""
        async with self._lock:
            count = len(self._cache)
            self._cache.clear()
            return count

    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple values from cache"""
        async with self._lock:
            result = {}
            for key in keys:
                entry = self._cache.get(key)
                if entry and not entry.is_expired:
                    entry.touch()
                    result[key] = entry.value
            return result

    async def set_many(self, mapping: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set multiple values in cache"""
        async with self._lock:
            await self._start_cleanup_task()

            for key, value in mapping.items():
                entry = CacheEntry(key, value, ttl)
                self._cache[key] = entry

            # Enforce size limit
            if len(self._cache) > self._max_size:
                await self._enforce_size_limit()

            return True

    async def delete_many(self, keys: List[str]) -> int:
        """Delete multiple values from cache"""
        async with self._lock:
            deleted = 0
            for key in keys:
                if key in self._cache:
                    del self._cache[key]
                    deleted += 1
            return deleted

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        async with self._lock:
            total_entries = len(self._cache)
            expired_entries = sum(1 for entry in self._cache.values() if entry.is_expired)

            if total_entries > 0:
                avg_age = sum(entry.age for entry in self._cache.values()) / total_entries
                avg_access_count = sum(entry.access_count for entry in self._cache.values()) / total_entries
            else:
                avg_age = 0
                avg_access_count = 0

            return {
                "backend": "memory",
                "total_entries": total_entries,
                "expired_entries": expired_entries,
                "valid_entries": total_entries - expired_entries,
                "max_size": self._max_size,
                "average_age_seconds": avg_age,
                "average_access_count": avg_access_count,
                "cleanup_interval": self._cleanup_interval,
            }


class RedisCache(BaseCache):
    """Redis cache implementation"""

    def __init__(self, redis_url: str = "redis://localhost:6379", **redis_kwargs):
        self.redis_url = redis_url
        self.redis_kwargs = redis_kwargs
        self._redis = None
        self._lock = asyncio.Lock()

    async def _get_redis(self):
        """Lazy initialization of Redis client"""
        async with self._lock:
            if self._redis is None:
                try:
                    import redis.asyncio as redis
                    self._redis = redis.from_url(self.redis_url, **self.redis_kwargs)
                except ImportError:
                    raise RuntimeError("redis package is required for RedisCache")
            return self._redis

    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis cache"""
        redis = await self._get_redis()
        try:
            data = await redis.get(key)
            if data is None:
                return None
            return pickle.loads(data)
        except Exception as e:
            logger.error(f"Error getting from Redis cache: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in Redis cache with optional TTL"""
        redis = await self._get_redis()
        try:
            data = pickle.dumps(value)
            if ttl:
                await redis.setex(key, ttl, data)
            else:
                await redis.set(key, data)
            return True
        except Exception as e:
            logger.error(f"Error setting Redis cache: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete value from Redis cache"""
        redis = await self._get_redis()
        try:
            result = await redis.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Error deleting from Redis cache: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis cache"""
        redis = await self._get_redis()
        try:
            return await redis.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking Redis cache existence: {e}")
            return False

    async def clear(self) -> int:
        """Clear all cache entries"""
        redis = await self._get_redis()
        try:
            await redis.flushdb()
            return 0  # Redis doesn't return count for flushdb
        except Exception as e:
            logger.error(f"Error clearing Redis cache: {e}")
            return 0

    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple values from Redis cache"""
        redis = await self._get_redis()
        try:
            values = await redis.mget(keys)
            result = {}
            for key, value in zip(keys, values):
                if value is not None:
                    result[key] = pickle.loads(value)
            return result
        except Exception as e:
            logger.error(f"Error getting multiple from Redis cache: {e}")
            return {}

    async def set_many(self, mapping: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set multiple values in Redis cache"""
        redis = await self._get_redis()
        try:
            data = {key: pickle.dumps(value) for key, value in mapping.items()}
            await redis.mset(data)
            if ttl:
                # Set expiration for each key
                for key in mapping.keys():
                    await redis.expire(key, ttl)
            return True
        except Exception as e:
            logger.error(f"Error setting multiple in Redis cache: {e}")
            return False

    async def delete_many(self, keys: List[str]) -> int:
        """Delete multiple values from Redis cache"""
        redis = await self._get_redis()
        try:
            result = await redis.delete(*keys)
            return result
        except Exception as e:
            logger.error(f"Error deleting multiple from Redis cache: {e}")
            return 0

    async def get_stats(self) -> Dict[str, Any]:
        """Get Redis cache statistics"""
        redis = await self._get_redis()
        try:
            info = await redis.info()
            return {
                "backend": "redis",
                "redis_url": self.redis_url,
                "connected_clients": info.get("connected_clients", 0),
                "used_memory": info.get("used_memory_human", "unknown"),
                "total_keys": await redis.dbsize(),
            }
        except Exception as e:
            logger.error(f"Error getting Redis stats: {e}")
            return {"backend": "redis", "error": str(e)}


class CacheService:
    """Main cache service with backend abstraction"""

    def __init__(self, backend: CacheBackend = CacheBackend.MEMORY, **backend_kwargs):
        self.backend_type = backend

        if backend == CacheBackend.MEMORY:
            self._cache = MemoryCache(**backend_kwargs)
        elif backend == CacheBackend.REDIS:
            self._cache = RedisCache(**backend_kwargs)
        else:
            raise ValueError(f"Unsupported cache backend: {backend}")

        # Common cache key prefixes
        self._prefixes = {
            "user": "user:",
            "document": "doc:",
            "search": "search:",
            "api": "api:",
            "token": "token:",
        }

    def _make_key(self, prefix: str, key: str) -> str:
        """Create a cache key with prefix"""
        if prefix in self._prefixes:
            return f"{self._prefixes[prefix]}{key}"
        return f"{prefix}:{key}"

    @asynccontextmanager
    async def cached(self, key: str, ttl: Optional[int] = None):
        """
        Context manager for caching function results

        Usage:
            async with cache.cached("my_key", ttl=300) as result:
                if result is None:
                    result = await expensive_operation()
                    return result
                return result
        """
        # Try to get from cache first
        cached_value = await self.get(key)
        if cached_value is not None:
            yield cached_value
            return

        # Execute the code and cache the result
        result = None
        try:
            yield None  # Let the caller set the result
        except GeneratorExit:
            pass
        finally:
            # This will be called with the result from the context
            if result is not None:
                await self.set(key, result, ttl)

    async def get(self, key: str, prefix: Optional[str] = None) -> Optional[Any]:
        """Get value from cache"""
        cache_key = self._make_key(prefix, key) if prefix else key
        return await self._cache.get(cache_key)

    async def set(self, key: str, value: Any, ttl: Optional[int] = None, prefix: Optional[str] = None) -> bool:
        """Set value in cache with optional TTL"""
        cache_key = self._make_key(prefix, key) if prefix else key
        return await self._cache.set(cache_key, value, ttl)

    async def delete(self, key: str, prefix: Optional[str] = None) -> bool:
        """Delete value from cache"""
        cache_key = self._make_key(prefix, key) if prefix else key
        return await self._cache.delete(cache_key)

    async def exists(self, key: str, prefix: Optional[str] = None) -> bool:
        """Check if key exists in cache"""
        cache_key = self._make_key(prefix, key) if prefix else key
        return await self._cache.exists(cache_key)

    async def clear(self) -> int:
        """Clear all cache entries"""
        return await self._cache.clear()

    async def get_many(self, keys: List[str], prefix: Optional[str] = None) -> Dict[str, Any]:
        """Get multiple values from cache"""
        cache_keys = [self._make_key(prefix, key) if prefix else key for key in keys]
        result = await self._cache.get_many(cache_keys)

        # Convert back to original keys
        if prefix:
            return {key: value for key, value in zip(keys, [result.get(cache_key) for cache_key in cache_keys])}
        return result

    async def set_many(self, mapping: Dict[str, Any], ttl: Optional[int] = None, prefix: Optional[str] = None) -> bool:
        """Set multiple values in cache"""
        cache_mapping = {self._make_key(prefix, key) if prefix else key: value
                        for key, value in mapping.items()}
        return await self._cache.set_many(cache_mapping, ttl)

    async def delete_many(self, keys: List[str], prefix: Optional[str] = None) -> int:
        """Delete multiple values from cache"""
        cache_keys = [self._make_key(prefix, key) if prefix else key for key in keys]
        return await self._cache.delete_many(cache_keys)

    # High-level caching methods for common use cases

    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached user data"""
        return await self.get(user_id, "user")

    async def set_user(self, user_id: str, user_data: Dict[str, Any], ttl: int = 3600) -> bool:
        """Cache user data"""
        return await self.set(user_id, user_data, ttl, "user")

    async def invalidate_user(self, user_id: str) -> bool:
        """Invalidate cached user data"""
        return await self.delete(user_id, "user")

    async def get_document(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get cached document data"""
        return await self.get(document_id, "document")

    async def set_document(self, document_id: str, document_data: Dict[str, Any], ttl: int = 1800) -> bool:
        """Cache document data"""
        return await self.set(document_id, document_data, ttl, "document")

    async def invalidate_document(self, document_id: str) -> bool:
        """Invalidate cached document data"""
        return await self.delete(document_id, "document")

    async def cache_api_response(self, endpoint: str, params: Dict[str, Any], response: Any, ttl: int = 300) -> bool:
        """Cache API response"""
        key = f"{endpoint}:{hash(json.dumps(params, sort_keys=True))}"
        return await self.set(key, response, ttl, "api")

    async def get_api_response(self, endpoint: str, params: Dict[str, Any]) -> Optional[Any]:
        """Get cached API response"""
        key = f"{endpoint}:{hash(json.dumps(params, sort_keys=True))}"
        return await self.get(key, "api")

    async def cache_search_results(self, query: str, results: List[Any], ttl: int = 600) -> bool:
        """Cache search results"""
        key = query.lower().strip()
        return await self.set(key, results, ttl, "search")

    async def get_search_results(self, query: str) -> Optional[List[Any]]:
        """Get cached search results"""
        key = query.lower().strip()
        return await self.get(key, "search")

    async def invalidate_search_cache(self, query: Optional[str] = None) -> int:
        """Invalidate search cache (all or specific query)"""
        if query:
            key = query.lower().strip()
            return int(await self.delete(key, "search"))
        else:
            # This is a simplified implementation - in practice you'd need to list all search keys
            return 0

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        stats = await self._cache.get_stats()
        stats["service"] = "CacheService"
        stats["backend_type"] = self.backend_type.value
        return stats

    async def shutdown(self):
        """Shutdown the cache service"""
        # Memory cache cleanup is handled automatically
        # Redis connections will be closed by the client
        pass
