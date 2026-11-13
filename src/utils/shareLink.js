/**
 * Builds the shareable URL for a specific gun ID or slug.
 * @param {string|number} id
 * @returns {string}
 */
export function buildShareUrl(id) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  return `${origin}${pathname}?gun=${encodeURIComponent(id)}`
}

/**
 *
 * @param {Object} gun
 * @returns {Promise<'shared' | 'copied' | 'cancelled'>}
 */
export async function shareGun(gun) {
  const targetId = gun?.id ?? gun?.name
  if (targetId === undefined || targetId === null) {
    throw new Error('Invalid gun data for sharing.')
  }

  const url = buildShareUrl(targetId)
  const title = gun.name ? `${gun.name} - Ammu-Nation & Bore Barrel` : 'Tactical Armory Catalog'
  const text = gun.description || `Check out ${gun.name || 'this piece'} on the Armory catalog.`

  // 1. Try Web Share API (mobile / supported browsers)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      if (err.name === 'AbortError') {
        return 'cancelled'
      }
      // If Web Share failed for non-abort reasons, fallback to clipboard
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

  // 3. Fallback for older browsers / insecure context
  if (typeof document !== 'undefined') {
    const textArea = document.createElement('textarea')
    textArea.value = url
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      textArea.remove()
      return 'copied'
    } catch {
      textArea.remove()
    }
  }

  throw new Error('Sharing is not supported on this device/browser.')
}
