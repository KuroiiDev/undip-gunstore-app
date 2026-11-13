import { useState, useEffect, useCallback } from 'react'
import reviewService from '../services/reviewService'
import { getCache, setCache, clearCache } from '../utils/queryCache'

export function useReviews(gunId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReviews = useCallback(async () => {
    if (!gunId) {
      setLoading(false)
      return
    }

    const key = `reviews:${gunId}`
    const cached = getCache(key)
    if (cached) {
      setReviews(cached)
      setError(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await reviewService.getReviews(gunId)

      if (response.success) {
        const data = response.data || []
        setReviews(data)
        setCache(key, data)
      } else {
        setError(response.message || 'Failed to fetch reviews.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching reviews.')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [gunId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  return { reviews, loading, error, refetch: fetchReviews }
}

export function useCreateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const createReview = async (gunId, reviewData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await reviewService.createReview(gunId, reviewData)

      if (response.success) {
        clearCache(`reviews:${gunId}`)
        setSuccess(true)
        return response.data
      } else {
        setError(response.message || 'Failed to submit review.')
        return null
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting review.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createReview, loading, error, success }
}

export function useUpdateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const updateReview = async (gunId, reviewId, reviewData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await reviewService.updateReview(reviewId, reviewData)

      if (response.success) {
        clearCache(`reviews:${gunId}`)
        return response.data
      } else {
        setError(response.message || 'Failed to update review.')
        return null
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating review.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { updateReview, loading, error }
}

export function useDeleteReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const deleteReview = async (gunId, reviewId) => {
    try {
      setLoading(true)
      setError(null)

      const response = await reviewService.deleteReview(reviewId)

      if (response.success) {
        clearCache(`reviews:${gunId}`)
        return true
      } else {
        setError(response.message || 'Failed to delete review.')
        return false
      }
    } catch (err) {
      setError(err.message || 'An error occurred while deleting review.')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { deleteReview, loading, error }
}
