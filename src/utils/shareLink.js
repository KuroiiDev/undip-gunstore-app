/**
 * Utility functions for sharing gun catalog items.
 */

/**
 * Builds the shareable URL for a specific gun ID.
 * @param {string|number} id
 * @returns {string}
 */
export function buildShareUrl(id) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/?gun=${encodeURIComponent(id)}`
}

/**
 * Shares a gun item via Web Share API if supported, or copies the URL to the clipboard.
 * Returns 'shared', 'copied', or 'cancelled'. Re-throws other errors.
 *
 * @param {Object} gun
 * @returns {Promise<'shared' | 'copied' | 'cancelled'>}
 */
export async function shareGun(gun) {
  if (!gun || gun.id === undefined || gun.id === null) {
    throw new Error('Invalid gun data for sharing.')
  }

  const url = buildShareUrl(gun.id)
  const title = gun.name ? `${gun.name} - Bore & Barrel` : 'Bore & Barrel Armory'
  const text = gun.description || `Check out ${gun.name || 'this piece'} on Bore & Barrel.`

  // 1. Try Web Share API
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      if (err.name === 'AbortError') {
        return 'cancelled'
      }
      throw err
    }
  }

  // 2. Fallback to Clipboard API
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(url)
    return 'copied'
  }

  throw new Error('Sharing is not supported on this device/browser.')
}

