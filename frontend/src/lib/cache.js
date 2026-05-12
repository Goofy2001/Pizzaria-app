const CACHE_KEY_PREFIX = 'pizzeria_cache__'

/**
 * Get a cached API response if valid (within TTL).
 * @param {string} endpoint - the cache key/endpoint name
 * @param {number} ttl - time-to-live in milliseconds (default 5 min)
 * @returns {any|null}
 */
function getCached(endpoint, ttl = 5 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${endpoint}`)
    if (!raw) return null

    const { data, timestamp } = JSON.parse(raw)
    const age = Date.now() - timestamp
    if (age > ttl) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${endpoint}`)
      return null
    }

    return data
  } catch (_) {
    return null
  }
}

/**
 * Store an API response in cache.
 * @param {string} endpoint - the cache key/endpoint name
 * @param {any} data - the response data to cache
 */
function setCache(endpoint, data) {
  try {
    localStorage.setItem(
      `${CACHE_KEY_PREFIX}${endpoint}`,
      JSON.stringify({
        data,
        timestamp: Date.now()
      })
    )
  } catch (_) {
    // ignore storage quota exceeded
  }
}

/**
 * Clear a specific cached endpoint or all cache.
 * @param {string|null} endpoint - endpoint to clear; if null, clears all
 */
function clearCache(endpoint = null) {
  try {
    if (!endpoint) {
      // Clear all pizzeria cache
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(CACHE_KEY_PREFIX)
      )
      keys.forEach((k) => localStorage.removeItem(k))
    } else {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${endpoint}`)
    }
  } catch (_) {
    // ignore
  }
}

export { getCached, setCache, clearCache }
