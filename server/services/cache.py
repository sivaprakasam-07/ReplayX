"""
Simple in-memory caching layer for expensive queries.
Cache duration: 10-15 seconds to balance freshness and performance.
"""
from datetime import datetime, timedelta
from typing import Any, Optional, Dict

_cache: Dict[str, tuple[Any, datetime]] = {}
CACHE_TTL_SECONDS = 12  # 12 seconds - short TTL for demo freshness


def get_cache(key: str) -> Optional[Any]:
    """Get value from cache if not expired."""
    if key not in _cache:
        return None
    
    value, timestamp = _cache[key]
    age = (datetime.utcnow() - timestamp).total_seconds()
    
    if age > CACHE_TTL_SECONDS:
        del _cache[key]
        return None
    
    return value


def set_cache(key: str, value: Any) -> None:
    """Set value in cache with current timestamp."""
    _cache[key] = (value, datetime.utcnow())


def clear_cache(key: str = None) -> None:
    """Clear cache entry or entire cache."""
    if key is None:
        _cache.clear()
    elif key in _cache:
        del _cache[key]


def cache_key(endpoint: str, **params) -> str:
    """Generate cache key from endpoint and parameters."""
    params_str = "|".join(f"{k}={v}" for k, v in sorted(params.items()))
    return f"{endpoint}:{params_str}"
