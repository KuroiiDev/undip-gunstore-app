import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  Archive,
  Edit2,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import ShareButton from '../common/ShareButton'
import LazyImage from '../common/LazyImage'
import {
  useReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'
import {
  getReactionStats,
  getUserReaction,
  toggleReaction,
} from '../../utils/reviewReactions'

export default function GunDetail({ gun, onBack, onEdit, onDelete, onArchive }) {
  const images = Array.isArray(gun.images) && gun.images.length > 0
    ? gun.images
    : [gun.image_url || gun.image || '/guns/pistol.svg']
  const [selectedImgIndex, setSelectedImgIndex] = useState(0)
  const imgSrc = images[selectedImgIndex] || images[0] || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  const currentUserId = getUserIdentifier()

  // Reviews hook
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const { updateReview, loading: updating } = useUpdateReview()
  const { deleteReview, loading: deletingReview } = useDeleteReview()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Edit review state
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')

  // Reactions state trigger
  const [, setReactionTick] = useState(0)

  useEffect(() => {
    const handleReactionsUpdated = () => {
      setReactionTick((t) => t + 1)
    }
    window.addEventListener('armory_review_reactions_updated', handleReactionsUpdated)
    return () => window.removeEventListener('armory_review_reactions_updated', handleReactionsUpdated)
  }, [])

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_id: currentUserId,
      user_identifier: currentUserId,
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Review submitted!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  const handleStartEdit = (rev) => {
    setEditingReviewId(rev.id)
    setEditRating(rev.rating || 5)
    setEditComment(rev.comment || '')
  }

  const handleCancelEdit = () => {
    setEditingReviewId(null)
    setEditRating(5)
    setEditComment('')
  }

  const handleSaveEdit = async (reviewId) => {
    const res = await updateReview(gun.id, reviewId, {
      rating: editRating,
      comment: editComment.trim(),
    })
    if (res) {
      setEditingReviewId(null)
      refetchReviews()
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Delete this review?')) {
      const ok = await deleteReview(gun.id, reviewId)
      if (ok) {
        refetchReviews()
      }
    }
  }

  const handleReaction = (reviewId, type) => {
    toggleReaction(reviewId, currentUserId, type)
    setReactionTick((t) => t + 1)
  }

  const isOwnReview = (rev) => {
    if (!currentUserId) return false
    if (rev.user_id && String(rev.user_id) === String(currentUserId)) return true
    if (rev.user_identifier && (
      rev.user_identifier === currentUserId ||
      rev.user_identifier === `Operator ${String(currentUserId).substring(0, 8)}`
    )) {
      return true
    }
    return false
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <LazyImage className="detail-img" src={imgSrc} alt={gun.name} />
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImgIndex(idx)}
                  style={{
                    border: selectedImgIndex === idx ? '2px solid var(--brass)' : '1px solid var(--line)',
                    borderRadius: '4px',
                    padding: '2px',
                    background: '#fff',
                    cursor: 'pointer',
                    width: '54px',
                    height: '54px',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '2px' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            <ShareButton gun={gun} className="btn btn--outline" showLabel />
            {onArchive && (
              <button type="button" className="btn btn--outline" onClick={() => onArchive(gun)}>
                <Archive size={15} /> Archive
              </button>
            )}
            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => {
              const isOwn = isOwnReview(rev)
              const isEditing = editingReviewId === rev.id
              const reactionStats = getReactionStats(rev.id)
              const userReaction = getUserReaction(rev.id, currentUserId)

              return (
                <li key={rev.id} className="review-item">
                  <div className="review-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                      {isOwn && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                            background: 'var(--paper)',
                            border: '1px solid var(--line)',
                            borderRadius: '4px',
                            color: 'var(--steel)',
                            fontWeight: 600,
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>

                    {!isEditing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="review-stars-display">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < rev.rating ? 'var(--brass)' : 'none'}
                              stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                            />
                          ))}
                        </span>

                        {isOwn && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => handleStartEdit(rev)}
                              title="Edit review"
                              style={{ padding: '4px' }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => handleDeleteReview(rev.id)}
                              title="Delete review"
                              disabled={deletingReview}
                              style={{ padding: '4px', color: '#c0392b' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Edit mode vs Read mode */}
                  {isEditing ? (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="star-btn"
                            onClick={() => setEditRating(n)}
                            aria-label={`${n} star${n > 1 ? 's' : ''}`}
                          >
                            <Star
                              size={18}
                              fill={n <= editRating ? 'var(--brass)' : 'none'}
                              stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                            />
                          </button>
                        ))}
                      </div>

                      <textarea
                        className="review-input"
                        rows={2}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Edit your review..."
                      />

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleSaveEdit(rev.id)}
                          disabled={updating}
                        >
                          <Check size={14} /> Save
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={handleCancelEdit}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {rev.comment && <p className="review-comment">{rev.comment}</p>}

                      {/* Like & Dislike actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        {!isOwn ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReaction(rev.id, 'like')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: userReaction === 'like' ? 'rgba(39, 174, 96, 0.12)' : 'transparent',
                                border: `1px solid ${userReaction === 'like' ? '#27ae60' : 'var(--line)'}`,
                                color: userReaction === 'like' ? '#27ae60' : 'var(--steel)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: userReaction === 'like' ? 600 : 400,
                              }}
                              title="Like review"
                            >
                              <ThumbsUp size={13} />
                              <span>{reactionStats.likeCount}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReaction(rev.id, 'dislike')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: userReaction === 'dislike' ? 'rgba(192, 57, 43, 0.12)' : 'transparent',
                                border: `1px solid ${userReaction === 'dislike' ? '#c0392b' : 'var(--line)'}`,
                                color: userReaction === 'dislike' ? '#c0392b' : 'var(--steel)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: userReaction === 'dislike' ? 600 : 400,
                              }}
                              title="Dislike review"
                            >
                              <ThumbsDown size={13} />
                              <span>{reactionStats.dislikeCount}</span>
                            </button>
                          </>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--steel)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ThumbsUp size={12} /> {reactionStats.likeCount}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ThumbsDown size={12} /> {reactionStats.dislikeCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
