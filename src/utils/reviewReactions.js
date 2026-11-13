const REACTIONS_KEY = 'armory_review_reactions'

export const getReactions = () => {
  try {
    const raw = localStorage.getItem(REACTIONS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const getReactionStats = (reviewId) => {
  const all = getReactions()
  const reviewData = all[reviewId] || { likes: [], dislikes: [] }
  return {
    likeCount: reviewData.likes ? reviewData.likes.length : 0,
    dislikeCount: reviewData.dislikes ? reviewData.dislikes.length : 0,
    likes: reviewData.likes || [],
    dislikes: reviewData.dislikes || [],
  }
}

export const getUserReaction = (reviewId, userId) => {
  if (!reviewId || !userId) return null
  const stats = getReactionStats(reviewId)
  if (stats.likes.includes(userId)) return 'like'
  if (stats.dislikes.includes(userId)) return 'dislike'
  return null
}

export const toggleReaction = (reviewId, userId, reactionType) => {
  if (!reviewId || !userId || (reactionType !== 'like' && reactionType !== 'dislike')) {
    return getReactionStats(reviewId)
  }

  try {
    const all = getReactions()
    if (!all[reviewId]) {
      all[reviewId] = { likes: [], dislikes: [] }
    }

    const currentLikes = new Set(all[reviewId].likes || [])
    const currentDislikes = new Set(all[reviewId].dislikes || [])

    if (reactionType === 'like') {
      if (currentLikes.has(userId)) {
        currentLikes.delete(userId)
      } else {
        currentLikes.add(userId)
        currentDislikes.delete(userId)
      }
    } else if (reactionType === 'dislike') {
      if (currentDislikes.has(userId)) {
        currentDislikes.delete(userId)
      } else {
        currentDislikes.add(userId)
        currentLikes.delete(userId)
      }
    }

    all[reviewId] = {
      likes: Array.from(currentLikes),
      dislikes: Array.from(currentDislikes),
    }

    localStorage.setItem(REACTIONS_KEY, JSON.stringify(all))
    window.dispatchEvent(new Event('armory_review_reactions_updated'))
    return getReactionStats(reviewId)
  } catch {
    return getReactionStats(reviewId)
  }
}
