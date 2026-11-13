import { Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { shareGun } from '../../utils/shareLink'

export default function ShareButton({ gun, className, showLabel = false }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!gun || (gun.id === undefined && !gun.name)) {
    return null
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    try {
      const result = await shareGun(gun)
      if (result === 'copied') {
        setCopied(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          setCopied(false)
        }, 2000)
      }
    } catch (err) {
      console.error('Failed to share:', err)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        className={className || 'card-act-btn'}
        onClick={handleShare}
        aria-label={`Share ${gun.name || 'product'}`}
        title={`Share ${gun.name || 'product'}`}
      >
        <Share2 size={16} />
        {showLabel && <span style={{ marginLeft: '6px' }}>Share</span>}
      </button>

      {copied && (
        <span
          className="share-tooltip"
          role="status"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '6px',
            backgroundColor: 'var(--ink, #18222c)',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            zIndex: 60,
            pointerEvents: 'none',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
          }}
        >
          Link disalin!
        </span>
      )}
    </div>
  )
}
