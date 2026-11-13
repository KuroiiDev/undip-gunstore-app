import { useCallback, useEffect, useState } from 'react'
import GUNS_LOCAL from '../data/guns'
import gunService from '../services/gunService'
import { getCache, setCache } from '../utils/queryCache'


export function useGuns(params = {}) {
  const [guns, setGuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  // Serialise params so the effect re-runs when they change.
  const paramKey = JSON.stringify(params)

  const fetchGuns = useCallback(async () => {
    const key = `guns:${paramKey}`
    const cached = getCache(key)
    if (cached) {
      setGuns(cached.data || [])
      setPagination(cached.pagination || null)
      setError(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await gunService.getGuns(params)

      if (response.success) {
        const data = response.data || []
        const pagination = response.pagination || null
        setGuns(data)
        setPagination(pagination)
        setCache(key, { data, pagination })
      } else {
        setError(response.message || 'Failed to fetch products.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching products.')
      setGuns([])
    } finally {
      setLoading(false)
    }
  }, [paramKey, params])

  useEffect(() => {
    fetchGuns()
  }, [fetchGuns])

  return { guns, loading, error, pagination, refetch: fetchGuns }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its ID or fallback to local static data.
//
// Returns { gun, loading, error, refetch }.
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const [gun, setGun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGun = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }

    // 1. Check local catalog first if matching by ID or name
    const foundLocal = GUNS_LOCAL.find(
      (g) => String(g.id) === String(id) || g.name?.toLowerCase() === String(id).toLowerCase()
    )

    try {
      setLoading(true)
      setError(null)

      const response = await gunService.getGunById(id)

      if (response.success && response.data) {
        setGun(response.data)
      } else if (foundLocal) {
        setGun(foundLocal)
      } else {
        setError(response.message || 'Product not found.')
      }
    } catch (err) {
      if (foundLocal) {
        setGun(foundLocal)
        setError(null)
      } else {
        setError(err.message || 'Failed to load product details.')
        setGun(null)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchGun()
  }, [fetchGun])

  return { gun, loading, error, refetch: fetchGun }
}
