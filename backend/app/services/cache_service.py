"""Cache service supporting Redis with graceful in-memory TTL fallback."""

import json
import logging
import time
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

try:
    import redis.asyncio as aioredis
    _redis_available = True
except ImportError:
    _redis_available = False
    aioredis = None


class CacheService:
    """Hybrid cache: attempts Redis first; falls back to in-memory TTL dictionary."""

    def __init__(self):
        self._memory_cache: dict[str, tuple[float, str]] = {}
        self._redis_client = None
        self._redis_connected = False

    async def get_redis_client(self):
        """Lazily initialize Redis connection."""
        if not settings.REDIS_ENABLED or not _redis_available:
            return None

        if self._redis_client is None:
            try:
                self._redis_client = aioredis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=2.0,
                )
                # Quick ping to verify connectivity
                await self._redis_client.ping()
                self._redis_connected = True
                logger.info("Redis cache connected successfully at %s", settings.REDIS_URL)
            except Exception as e:
                logger.warning("Redis connection failed (%s), using in-memory cache", e)
                self._redis_connected = False
                self._redis_client = None

        return self._redis_client

    async def get(self, key: str) -> Any | None:
        """Get cached JSON-deserialized object by key."""
        # Try Redis first
        client = await self.get_redis_client()
        if client is not None:
            try:
                val = await client.get(key)
                if val is not None:
                    return json.loads(val)
            except Exception as e:
                logger.debug("Redis get error for %s: %s", key, e)

        # Fallback to memory cache
        if key in self._memory_cache:
            expires_at, val_str = self._memory_cache[key]
            if time.time() < expires_at:
                return json.loads(val_str)
            else:
                del self._memory_cache[key]

        return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        """Set JSON-serializable value in cache with TTL."""
        try:
            val_str = json.dumps(value, default=str)
        except Exception as e:
            logger.error("JSON serialization failed for cache key %s: %s", key, e)
            return False

        # Try Redis first
        client = await self.get_redis_client()
        if client is not None:
            try:
                await client.set(key, val_str, ex=ttl_seconds)
                return True
            except Exception as e:
                logger.debug("Redis set error for %s: %s", key, e)

        # Store in memory cache
        expires_at = time.time() + ttl_seconds
        self._memory_cache[key] = (expires_at, val_str)

        # Cleanup expired items in memory if cache grows large
        if len(self._memory_cache) > 2000:
            now = time.time()
            self._memory_cache = {
                k: v for k, v in self._memory_cache.items() if v[0] > now
            }

        return True

    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        client = await self.get_redis_client()
        if client is not None:
            try:
                await client.delete(key)
            except Exception:
                pass

        if key in self._memory_cache:
            del self._memory_cache[key]
        return True

    async def is_redis_alive(self) -> bool:
        """Check if Redis is actively responsive."""
        client = await self.get_redis_client()
        if client is None:
            return False
        try:
            return bool(await client.ping())
        except Exception:
            return False


cache_service = CacheService()
