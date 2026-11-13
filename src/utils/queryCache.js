const cache = new Map()
const TTL_MS = 5 * 60 * 1000 // 5 minutes
const STORAGE_PREFIX = 'query_cache:'

export function getCache(key) {
  const now = Date.now()

  // 1. Memory cache check
  if (cache.has(key)) {
    const entry = cache.get(key)
    if (now <= entry.expiry) {
      return entry.data
    }
    cache.delete(key)
  }

  // 2. Persistent storage fallback
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (now <= parsed.expiry) {
          cache.set(key, parsed)
          return parsed.data
        }
        window.sessionStorage.removeItem(STORAGE_PREFIX + key)
      }
    } catch {
      // Storage unavailable or disabled
    }
  }

  return null
}

export function setCache(key, data, customTtl = TTL_MS) {
  const entry = {
    data,
    expiry: Date.now() + customTtl,
  }

  cache.set(key, entry)

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry))
    } catch {
      // Storage full or quota exceeded
    }
  }
}

export function clearCache(prefix = '') {
  if (!prefix) {
    cache.clear()
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const keys = Object.keys(window.sessionStorage)
        for (const k of keys) {
          if (k.startsWith(STORAGE_PREFIX)) {
            window.sessionStorage.removeItem(k)
          }
        }
      } catch {}
    }
    return
  }

  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const keys = Object.keys(window.sessionStorage)
      for (const k of keys) {
        if (k.startsWith(STORAGE_PREFIX + prefix)) {
          window.sessionStorage.removeItem(k)
        }
      }
    } catch {}
  }
}
