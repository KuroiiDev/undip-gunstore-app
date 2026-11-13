import { useState } from 'react'
import { useInView } from '../../hooks/useInView'

export default function LazyImage({ src, alt, className, width, height, style }) {
  const { ref, inView } = useInView()
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const fallback = '/guns/pistol.svg'

  return (
    <div
      ref={ref}
      className={`lazy-img-wrap${loaded ? ' lazy-img-wrap--loaded' : ''}`}
      style={{ width, height, ...style }}
    >
      {inView && (
        <img
          className={className}
          src={error ? fallback : src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true) }}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />
      )}
    </div>
  )
}
