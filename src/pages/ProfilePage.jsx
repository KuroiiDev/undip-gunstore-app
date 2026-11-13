import { useState, useEffect } from 'react'
import {
  Shield,
  Copy,
  Check,
  Save,
  Heart,
  FileText,
  Camera,
  Play,
  Edit3,
  X,
  Trash2,
  ExternalLink,
  Users,
  MapPin,
  Phone,
  Clock,
  Info,
  Archive,
  RotateCcw,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import {
  getAllDraftIds,
  loadDraft,
  deleteDraft,
  formatDraftTime,
  getDraftTimestamp,
} from '../utils/draftStorage'
import {
  getArchivedGuns,
  restoreGun,
  permanentlyDeleteGun,
} from '../utils/archiveStorage'

const members = [
  { name: 'Maitsam Kadzim', nim: '21120124140161' },
  { name: 'Rafi Nurulhuda', nim: '21120124130053' },
  { name: 'Gotara Parasdya Abimanyu', nim: '21120124140157' },
  { name: 'Faiz Alif Rahmawan', nim: '21120124130063' },
]

export default function ProfilePage({ onReplaySplash, onNavigate }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)

  const { favorites } = useFavorites()
  const [drafts, setDrafts] = useState([])
  const [archives, setArchives] = useState([])

  const loadDraftsList = () => {
    try {
      const ids = getAllDraftIds()
      const list = ids.map((id) => {
        const data = loadDraft(id)
        const ts = getDraftTimestamp(id) || data?.savedAt
        return {
          id,
          name: data?.name || (id === 'create' ? 'New Hardware Draft' : `Hardware #${id}`),
          type: data?.type || data?.category || 'Hardware',
          price: data?.price ?? data?.cook_time ?? 0,
          savedAt: ts,
          data,
        }
      })
      setDrafts(list)
    } catch {
      setDrafts([])
    }
  }

  const loadArchivesList = () => {
    setArchives(getArchivedGuns())
  }

  useEffect(() => {
    loadDraftsList()
    loadArchivesList()

    const handleArchiveUpdate = () => {
      loadArchivesList()
    }
    window.addEventListener('armory_archive_updated', handleArchiveUpdate)
    return () => window.removeEventListener('armory_archive_updated', handleArchiveUpdate)
  }, [])

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Avatar image must be under 2MB.')
      setTimeout(() => setFeedback(''), 3000)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      userService.updateAvatar(base64)
      setFeedback('Avatar updated.')
      setTimeout(() => setFeedback(''), 3000)
    }
    reader.readAsDataURL(file)
  }

  const handleOpenEdit = () => {
    setUsername(profile.username || 'Shooter')
    setBio(profile.bio || '')
    setShowEditModal(true)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    const updated = {
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      avatar,
    }
    const result = userService.saveUserProfile(updated)
    if (result.success) {
      setProfile(result.data)
      setShowEditModal(false)
      setFeedback('Profile successfully updated.')
      setTimeout(() => setFeedback(''), 3000)
    } else {
      setFeedback('Failed to save profile.')
    }
  }

  const handleDeleteDraft = (draftId, e) => {
    e.stopPropagation()
    deleteDraft(draftId)
    loadDraftsList()
    setFeedback('Draft deleted.')
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleOpenDraft = (draft) => {
    if (!onNavigate) return
    if (draft.id === 'create') {
      onNavigate('Create')
    } else {
      onNavigate('Edit', { id: draft.id, ...draft.data })
    }
  }

  const handleRestoreArchive = (item, e) => {
    e.stopPropagation()
    restoreGun(item.id)
    loadArchivesList()
    setFeedback(`"${item.name}" berhasil dipulihkan ke katalog.`)
    setTimeout(() => setFeedback(''), 3000)
  }

  const handlePermanentDeleteArchive = (item, e) => {
    e.stopPropagation()
    if (window.confirm(`Hapus permanen "${item.name}" dari arsip?`)) {
      permanentlyDeleteGun(item.id)
      loadArchivesList()
      setFeedback(`"${item.name}" dihapus secara permanen.`)
      setTimeout(() => setFeedback(''), 3000)
    }
  }

  return (
    <div className="profile-page">
      <section className="masthead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">
            Operator credentials, procurement statistics, drafts, arsip katalog, and armory information.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleOpenEdit}
          >
            <Edit3 size={14} /> Edit Profile
          </button>
          {onReplaySplash && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onReplaySplash}
              title="Replay introductory splash animation"
            >
              <Play size={14} /> Replay Intro
            </button>
          )}
        </div>
      </section>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="avatar-wrap">
              {avatar ? (
                <img src={avatar} alt={profile.username} className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  <Shield size={36} stroke="var(--brass)" />
                </div>
              )}
              <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
                <Camera size={14} />
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden-file-input"
                />
              </label>
            </div>

            <div className="profile-identity">
              <h2 className="display">{profile.username || 'Shooter'}</h2>
              <div className="profile-id-row">
                <span className="mono-badge">{profile.userId}</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={handleCopyId}
                  title="Copy User ID to clipboard"
                >
                  {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
                </button>
              </div>
              {profile.bio && (
                <p style={{ marginTop: '8px', color: 'var(--steel)', fontSize: '0.9rem', maxWidth: '500px' }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleOpenEdit}
            style={{ alignSelf: 'flex-start' }}
          >
            <Edit3 size={14} /> Edit Profil
          </button>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Drafts</div>
          </div>
          <div className="stat-item">
            <Archive size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{archives.length}</div>
            <div className="stat-label">Arsip Katalog</div>
          </div>
        </div>
      </div>

      {/* SECTION: Catalog Archives */}
      <section className="profile-section-card" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '4px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Archive size={20} stroke="var(--brass)" />
            <h2 className="section-title" style={{ margin: 0 }}>Arsip Katalog</h2>
          </div>
          <span className="count">{archives.length} item</span>
        </div>

        {archives.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--paper)', borderRadius: '4px', color: 'var(--steel)' }}>
            <p style={{ margin: 0 }}>Belum ada katalog yang diarsipkan.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {archives.map((item) => (
              <li
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  background: 'var(--paper)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong style={{ fontSize: '1rem' }}>{item.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--steel)' }}>
                    {item.type || item.category || 'Hardware'} {item.caliber ? `• ${item.caliber}` : ''} {item.price ? `• $${item.price}` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={(e) => handleRestoreArchive(item, e)}
                    title="Pulihkan katalog ke list utama"
                    style={{ color: 'var(--brass)', borderColor: 'var(--brass)' }}
                  >
                    <RotateCcw size={14} /> Pulihkan
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={(e) => handlePermanentDeleteArchive(item, e)}
                    title="Hapus permanen dari arsip"
                    style={{ color: '#c0392b', borderColor: 'rgba(192, 57, 43, 0.3)' }}
                  >
                    <Trash2 size={14} /> Hapus Permanen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SECTION: Catalog Drafts */}
      <section className="profile-section-card" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '4px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} stroke="var(--brass)" />
            <h2 className="section-title" style={{ margin: 0 }}>List Katalog Draft</h2>
          </div>
          <span className="count">{drafts.length} draft</span>
        </div>

        {drafts.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--paper)', borderRadius: '4px', color: 'var(--steel)' }}>
            <p style={{ margin: 0 }}>Belum ada katalog yang disimpan di draft.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {drafts.map((draft) => (
              <li
                key={draft.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  background: 'var(--paper)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong style={{ fontSize: '1rem' }}>{draft.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--steel)' }}>
                    {draft.type} {draft.price > 0 && `• $${draft.price}`} • Disimpan {formatDraftTime(draft.savedAt)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => handleOpenDraft(draft)}
                    title="Lanjutkan edit draft ini"
                  >
                    <ExternalLink size={14} /> Buka
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    title="Hapus draft"
                    style={{ color: '#c0392b', borderColor: 'rgba(192, 57, 43, 0.3)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SECTION: About Us */}
      <section className="profile-section-card" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '4px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Info size={20} stroke="var(--brass)" />
          <h2 className="section-title" style={{ margin: 0 }}>About — Bore &amp; Barrel</h2>
        </div>
        <p style={{ color: 'var(--steel)', lineHeight: 1.6, marginTop: 0 }}>
          Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced from the bench — no markup theatre, no filler.
        </p>

        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', padding: '18px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Users size={18} stroke="var(--brass)" />
            <strong style={{ fontSize: '1.1rem' }}>Kelompok 13 — Shift 02</strong>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {members.map((m) => (
              <li
                key={m.nim}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                }}
              >
                <span
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--ink)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                  }}
                >
                  {m.name.charAt(0)}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{m.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--steel)', fontFamily: 'monospace' }}>{m.nim}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SECTION: Contact */}
      <section className="profile-section-card" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '4px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <MapPin size={20} stroke="var(--brass)" />
          <h2 className="section-title" style={{ margin: 0 }}>Contact &amp; Armory Location</h2>
        </div>
        <p style={{ color: 'var(--steel)', lineHeight: 1.6, marginTop: 0 }}>
          Come by the shop for hardware maintenance, inspections, or consultations.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'var(--paper)', borderRadius: '4px', border: '1px solid var(--line)' }}>
            <MapPin size={18} stroke="var(--brass)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--steel)' }}>Address</strong>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>123 Range Road</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'var(--paper)', borderRadius: '4px', border: '1px solid var(--line)' }}>
            <Clock size={18} stroke="var(--brass)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--steel)' }}>Operating Hours</strong>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Tue - Sat: 10:00 - 18:00</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'var(--paper)', borderRadius: '4px', border: '1px solid var(--line)' }}>
            <Phone size={18} stroke="var(--brass)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--steel)' }}>Telephone</strong>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>(555) 010-0100</div>
            </div>
          </div>
        </div>
      </section>

      {/* POP-UP MODAL: Edit Profile */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="modal__title" style={{ margin: 0 }}>Edit Armorer Profile</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="modal-prof-name" className="form-label">
                  Callsign / Operator Alias
                </label>
                <input
                  id="modal-prof-name"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Operator Delta, Master Gunsmith"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-prof-bio" className="form-label">
                  Armory Notes / Station Bio
                </label>
                <textarea
                  id="modal-prof-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Qualifications, preferred calibers, unit assignment..."
                  rows={4}
                  className="form-textarea"
                />
              </div>

              <div className="modal__actions" style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
