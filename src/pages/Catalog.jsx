import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { RefreshCw, Plus, Loader, AlertCircle, PackageOpen } from 'lucide-react'
import { useGuns, useGunById } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import AdvancedFilter from '../components/common/AdvancedFilter'
import gunService from '../services/gunService'
import { clearCache } from '../utils/queryCache'
import { archiveGun, getArchivedGuns } from '../utils/archiveStorage'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
} from '../utils/helpers'

const GunDetail = lazy(() => import('../components/gun/GunDetail'))
const ConfirmModal = lazy(() => import('../components/modals/ConfirmModal'))

const PAGE_SIZE = 6
const FIXED_CATEGORIES = ['All', 'Pistol', 'Rifle', 'Shotgun', 'Submachine Gun']

export default function Catalog({ onNavigate }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [useLocal, setUseLocal] = useState(false)
  const [archivedIds, setArchivedIds] = useState(() => {
    return new Set(getArchivedGuns().map((item) => String(item.id)))
  })
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    const handleArchiveUpdate = () => {
      setArchivedIds(new Set(getArchivedGuns().map((item) => String(item.id))))
    }
    window.addEventListener('armory_archive_updated', handleArchiveUpdate)
    return () => window.removeEventListener('armory_archive_updated', handleArchiveUpdate)
  }, [])

  const categories = FIXED_CATEGORIES

  const handleSearch = (val) => {
    setSearch(val)
    setPage(1)
  }

  const handleCategory = (cat) => {
    setActiveCategory(cat)
    setPage(1)
  }

  const { guns: apiGuns, loading, error, refetch } = useGuns({
    search,
    category: activeCategory,
    limit: PAGE_SIZE + 10,
    offset: 0,
  })

  const handleRefetch = () => {
    clearCache('guns:')
    refetch()
  }

  const isLocal = useLocal || (error && apiGuns.length === 0)

  const activeApiGuns = useMemo(() => {
    return apiGuns.filter((g) => !archivedIds.has(String(g.id)))
  }, [apiGuns, archivedIds])

  const localFiltered = useMemo(() => {
    if (!isLocal) return []
    const enriched = GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
    return enriched
      .filter((g) => !archivedIds.has(String(g.id)))
      .filter(
        (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
      )
  }, [isLocal, search, activeCategory, archivedIds])

  const allFiltered = useMemo(() => {
    if (isLocal) {
      return sortItems(localFiltered, sortKey, sortOrder)
    }
    let result = activeApiGuns.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [isLocal, localFiltered, activeApiGuns, search, activeCategory, sortKey, sortOrder])

  const paginatedGuns = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return allFiltered.slice(start, start + PAGE_SIZE)
  }, [allFiltered, page])

  const hasNext = page * PAGE_SIZE < allFiltered.length

  const [selectedGun, setSelectedGun] = useState(null)
  const [autoOpened, setAutoOpened] = useState(false)

  const sharedGunId = useMemo(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('gun')
  }, [])

  const { gun: sharedGun } = useGunById(sharedGunId)

  useEffect(() => {
    if (sharedGun && !autoOpened) {
      setSelectedGun(sharedGun)
      setAutoOpened(true)
    }
  }, [sharedGun, autoOpened])

  const handleCloseDetail = () => {
    setSelectedGun(null)
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError('')
      await gunService.deleteGun(deleteTarget.id)
      setDeleteTarget(null)
      handleRefetch()
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  const handleArchiveGun = (gun) => {
    const ok = archiveGun(gun)
    if (ok) {
      setToastMsg(`"${gun.name}" berhasil diarsipkan.`)
      setTimeout(() => setToastMsg(''), 3000)
    }
  }

  if (selectedGun) {
    return (
      <Suspense fallback={<div className="state-box"><Loader size={28} className="spin" /><p>Loading…</p></div>}>
        <GunDetail
          gun={selectedGun}
          onBack={handleCloseDetail}
          onArchive={(g) => {
            handleArchiveGun(g)
            handleCloseDetail()
          }}
          onEdit={(g) => {
            handleCloseDetail()
            if (onNavigate) onNavigate('Edit', g)
          }}
          onDelete={(g) => {
            handleCloseDetail()
            setDeleteTarget(g)
          }}
        />
      </Suspense>
    )
  }

  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          A small armory of pistols, rifles, and shotguns. Every piece listed
          with its type, caliber, and price — nothing else.
        </p>
      </section>

      {toastMsg && (
        <div className="toast toast--success" style={{ marginBottom: '16px' }}>
          {toastMsg}
        </div>
      )}

      <section>
        <div className="list-head">
          <h2>Current stock</h2>
          <div className="list-head-right">
            <span className="count">
              {allFiltered.length} piece{allFiltered.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={handleRefetch}
              title="Refresh catalog"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>

        <AdvancedFilter
          search={search}
          onSearch={handleSearch}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={handleCategory}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => { setSortKey(key); setSortOrder(order) }}
        />

        {loading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && error && !useLocal && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={handleRefetch}>
                <RefreshCw size={16} /> Retry
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                View Local Catalog
              </button>
            </div>
          </div>
        )}

        {!loading && allFiltered.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No products match your search.</p>
          </div>
        )}

        {paginatedGuns.length > 0 && (
          <ul className="stock">
            {paginatedGuns.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                onSelect={setSelectedGun}
                onArchive={handleArchiveGun}
                onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onDelete={setDeleteTarget}
              />
            ))}
          </ul>
        )}

        <div
          className="flex items-center justify-center gap-4 my-6 py-4"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            margin: '24px 0',
            padding: '8px 0',
          }}
        >
          <button
            type="button"
            className="btn btn--outline btn--sm px-4 py-2 border rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Prev
          </button>
          <span className="text-sm font-semibold">
            Halaman {page}
          </span>
          <button
            type="button"
            className="btn btn--outline btn--sm px-4 py-2 border rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || loading}
          >
            Next
          </button>
        </div>

        {useLocal && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setUseLocal(false); handleRefetch() }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>

      <Suspense fallback={null}>
        <ConfirmModal
          open={!!deleteTarget}
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError('') }}
        />
      </Suspense>
      {deleteError && (
        <div className="toast toast--error">{deleteError}</div>
      )}
    </>
  )
}
