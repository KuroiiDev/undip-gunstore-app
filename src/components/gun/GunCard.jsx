import FavoriteButton from '../common/FavoriteButton'
import ShareButton from '../common/ShareButton'
import LazyImage from '../common/LazyImage'
import { Archive } from 'lucide-react'
import { useInView } from '../../hooks/useInView'
import { formatPrice, truncate } from '../../utils/helpers'

export default function GunCard({ gun, onSelect, onEdit, onDelete, onArchive }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  const { ref: cardRef, inView: cardInView } = useInView()

  return (
    <li className="card" ref={cardRef}>
      {cardInView && (
        <>
          <button
            type="button"
            className="card-btn"
            onClick={() => onSelect(gun)}
            aria-label={`View ${gun.name}`}
          >
            <LazyImage
              className="card-img"
              src={imgSrc}
              alt={gun.name}
              width={240}
              height={180}
            />

            <span className="name display">{gun.name}</span>

            <span className="type">
              {category}
              {caliber ? ` · ${caliber}` : ''}
            </span>

            {gun.description && (
              <span className="card-desc">{truncate(gun.description, 72)}</span>
            )}

            <span className="price">{formatPrice(price)}</span>
          </button>

          <div className="card-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            <ShareButton gun={gun} />

            {onArchive && (
              <button
                type="button"
                className="card-act-btn"
                onClick={(e) => { e.stopPropagation(); onArchive(gun) }}
                aria-label={`Archive ${gun.name}`}
                title="Archive"
              >
                <Archive size={14} />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                className="card-act-btn"
                onClick={(e) => { e.stopPropagation(); onEdit(gun) }}
                aria-label={`Edit ${gun.name}`}
                title="Edit"
              >
                ✏️
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                className="card-act-btn card-act-btn--danger"
                onClick={(e) => { e.stopPropagation(); onDelete(gun) }}
                aria-label={`Delete ${gun.name}`}
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        </>
      )}
    </li>
  )
}
