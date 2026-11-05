const cache = new Map()
const TTL_MS = 60 * 1000 // 60 seconds

/**
 * Retrieve cached data by key.
 * If expired, deletes the cache entry and returns null.
 */
export function getCache(key) {
  if (!cache.has(key)) return null

  const entry = cache.get(key)
  const now = Date.now()

  if (now > entry.expiry) {
    cache.delete(key)
    return null
  }

  return entry.data
}

/**
 * Store data in cache with a 60-second TTL.
 */
export function setCache(key, data) {
  cache.set(key, {
    data,
    expiry: Date.now() + TTL_MS,
  })
}

/**
 * Clear cache entries. If prefix is provided, removes all keys starting with prefix.
 * If prefix is empty string (default), removes all entries.
 */
export function clearCache(prefix = '') {
  if (!prefix) {
    cache.clear()
    return
  }

  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

