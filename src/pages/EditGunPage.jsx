import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Loader,
  X,
} from 'lucide-react'
import gunService from '../services/gunService'
import uploadService from '../services/uploadService'
import ConfirmModal from '../components/modals/ConfirmModal'
import {
  saveDraft,
  loadDraft,
  deleteDraft,
  hasDraft,
  getDraftTimestamp,
  formatDraftTime,
} from '../utils/draftStorage'

export default function EditGunPage({ gun, gunId, onBack, onSuccess }) {
  const targetId = gunId || gun?.id

  const [loading, setLoading] = useState(!gun)
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState({
    name: gun?.name || '',
    type: gun?.type || (gun?.category === 'makanan' ? 'Pistol' : 'Rifle'),
    caliber: gun?.caliber || '9mm',
    category: gun?.category || 'makanan',
    difficulty: gun?.difficulty || 'mudah',
    price: gun?.price ?? gun?.cook_time ?? 599,
    description: gun?.description || '',
    servings: gun?.servings || 1,
    is_featured: Boolean(gun?.is_featured),
  })

  // Multi-image state
  const initialImages = Array.isArray(gun?.images) && gun.images.length > 0
    ? gun.images
    : (gun?.image_url || gun?.image ? [gun.image_url || gun.image] : ['/guns/pistol.svg'])

  const [imagesList, setImagesList] = useState(initialImages)
  const [specs, setSpecs] = useState(
    gun?.ingredients && gun.ingredients.length > 0
      ? gun.ingredients.map((ing) => ({
          name: ing.name || '',
          quantity: ing.quantity || '',
        }))
      : [
          { name: 'Platform', quantity: gun?.type || 'Pistol' },
          { name: 'Caliber', quantity: gun?.caliber || '9mm' },
        ],
  )

  const [steps, setSteps] = useState(
    gun?.steps && gun.steps.length > 0
      ? gun.steps.map((st) => (typeof st === 'string' ? st : st.instruction || ''))
      : ['Standard manufacturer maintenance and cleaning protocol.'],
  )

  const [showDraftModal, setShowDraftModal] = useState(() => hasDraft(targetId))
  const [draftTimestamp, setDraftTimestamp] = useState(() => getDraftTimestamp(targetId))
  const [showConfirmBack, setShowConfirmBack] = useState(false)

  useEffect(() => {
    async function fetchGun() {
      if (gun) return
      try {
        setLoading(true)
        setError('')
        const res = await gunService.getGunById(targetId)
        if (res.success && res.data) {
          const data = res.data
          setFormData({
            name: data.name || '',
            type: data.type || (data.category === 'makanan' ? 'Pistol' : 'Rifle'),
            caliber: data.caliber || '9mm',
            category: data.category || 'makanan',
            difficulty: data.difficulty || 'mudah',
            price: data.price ?? data.cook_time ?? 599,
            description: data.description || '',
            servings: data.servings || 1,
            is_featured: Boolean(data.is_featured),
          })

          const fetchedImgs = Array.isArray(data.images) && data.images.length > 0
            ? data.images
            : [data.image_url || data.image || '/guns/pistol.svg']
          setImagesList(fetchedImgs)

          if (data.ingredients && data.ingredients.length > 0) {
            setSpecs(data.ingredients.map((ing) => ({
              name: ing.name || '',
              quantity: ing.quantity || '',
            })))
          } else {
            setSpecs([
              { name: 'Platform', quantity: data.type || 'Pistol' },
              { name: 'Caliber', quantity: data.caliber || '9mm' },
            ])
          }

          if (data.steps && data.steps.length > 0) {
            setSteps(data.steps.map((st) => (typeof st === 'string' ? st : st.instruction || '')))
          } else {
            setSteps(['Standard manufacturer maintenance and cleaning protocol.'])
          }
        } else {
          setError('Hardware record could not be loaded.')
        }
      } catch (err) {
        setError(err.message || 'Failed to load hardware record from server.')
      } finally {
        setLoading(false)
      }
    }

    if (targetId) {
      fetchGun()
    }
  }, [targetId, gun])

  const handleLoadDraft = () => {
    const draft = loadDraft(targetId)
    if (draft) {
      if (draft.formData) setFormData(draft.formData)
      if (draft.specs) setSpecs(draft.specs)
      if (draft.steps) setSteps(draft.steps)
      if (Array.isArray(draft.imagesList)) {
        setImagesList(draft.imagesList)
      }
      setShowDraftModal(false)
      setSuccessMsg('Saved draft restored.')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleDiscardDraft = () => {
    deleteDraft(targetId)
    setShowDraftModal(false)
    setDraftTimestamp(null)
  }

  const handleSaveDraft = useCallback(() => {
    const draftData = {
      formData,
      specs,
      steps,
      imagesList,
    }
    const saved = saveDraft(draftData, targetId)
    if (saved) {
      const ts = getDraftTimestamp(targetId)
      setDraftTimestamp(ts)
      setSuccessMsg(`Draft saved (${formatDraftTime(ts)})`)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }, [formData, specs, steps, imagesList, targetId])

  // Handle image upload / selection (multiple files)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const newImgs = []

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 5MB limit.`)
        return
      }
      if (!allowed.includes(file.type)) {
        setError('Allowed formats: .jpg, .jpeg, .png, .webp')
        return
      }
      newImgs.push(URL.createObjectURL(file))
    }

    setImagesList((prev) => [...prev, ...newImgs])
    setError('')
  }

  const handleRemoveImage = (index) => {
    setImagesList((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.length > 0 ? updated : ['/guns/pistol.svg']
    })
  }

  const handleSpecChange = (index, field, value) => {
    setSpecs((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const addSpec = () => setSpecs((prev) => [...prev, { name: '', quantity: '' }])
  const removeSpec = (index) => {
    if (specs.length <= 1) return
    setSpecs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleStepChange = (index, value) => {
    setSteps((prev) => {
      const copy = [...prev]
      copy[index] = value
      return copy
    })
  }

  const addStep = () => setSteps((prev) => [...prev, ''])
  const removeStep = (index) => {
    if (steps.length <= 1) return
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Model designation is required.')
      return
    }

    const cleanSpecs = specs
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        quantity: s.quantity.trim() || 'Standard',
      }))

    if (cleanSpecs.length === 0) {
      setError('Please provide at least one specification.')
      return
    }

    const cleanSteps = steps
      .filter((s) => s.trim())
      .map((s) => s.trim())

    if (cleanSteps.length === 0) {
      setError('Please provide at least one maintenance step.')
      return
    }

    const finalImages = imagesList.length > 0 ? imagesList : ['/guns/pistol.svg']

    const payload = {
      name: formData.name.trim(),
      type: formData.type || (formData.category === 'minuman' ? 'Rifle' : 'Pistol'),
      caliber: formData.caliber || '9mm',
      price: Number(formData.price) || 500,
      category: formData.category || 'makanan',
      description: formData.description.trim() || `${formData.type} caliber ${formData.caliber}.`,
      image_url: finalImages[0],
      images: finalImages,
      prep_time: 15,
      cook_time: Number(formData.price) || 500,
      servings: Number(formData.servings) || 1,
      difficulty: formData.difficulty || 'mudah',
      is_featured: Boolean(formData.is_featured),
      ingredients: cleanSpecs,
      steps: cleanSteps,
    }

    try {
      setUpdating(true)
      const res = await gunService.updateGun(targetId, payload)
      if (res.success || res.data) {
        deleteDraft(targetId)
        if (onSuccess) {
          onSuccess(res.data)
        } else if (onBack) {
          onBack()
        }
      } else {
        throw new Error(res.message || 'Failed to update record on server.')
      }
    } catch (err) {
      setError(err.message || 'Error occurred while updating record.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="state-box">
        <Loader size={32} className="spin" />
        <p>Retrieving hardware specifications…</p>
      </div>
    )
  }

  return (
    <div className="entry-page">
      <div className="entry-header">
        <button
          type="button"
          className="detail-back"
          onClick={() => setShowConfirmBack(true)}
        >
          <ArrowLeft size={18} /> Cancel &amp; Return
        </button>

        <div className="entry-header-actions">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleSaveDraft}
            title="Save draft"
          >
            <FileText size={14} /> Save Draft
          </button>
        </div>
      </div>

      <section className="masthead">
        <h1 className="display">Modify Hardware Record</h1>
        <p className="lede">
          Update registry specifications, operational caliber, or visual imagery for {formData.name || 'this unit'}.
        </p>
      </section>

      {error && (
        <div className="toast toast--error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {successMsg && (
        <div className="toast toast--success">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="entry-form">
        {/* Imagery Section */}
        <div className="card-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 className="card-box-title" style={{ margin: 0 }}>Visual Asset ({imagesList.length} Gambar)</h2>
            <label className="btn btn--outline btn--sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Tambah Gambar
              <input
                id="edit-gun-image"
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden-file-input"
              />
            </label>
          </div>

          <p className="card-box-desc" style={{ marginBottom: '14px' }}>
            Kamu dapat mengunggah lebih dari satu gambar per katalog. Gambar pertama akan menjadi foto utama.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
            {imagesList.map((img, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  height: '110px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: idx === 0 ? '2px solid var(--brass)' : '1px solid var(--line)',
                  background: 'var(--paper)',
                }}
              >
                <img
                  src={img}
                  alt={`Asset ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {idx === 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      background: 'var(--brass)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 5px',
                      borderRadius: '2px',
                    }}
                  >
                    UTAMA
                  </span>
                )}
                {imagesList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Hapus gambar ini"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Core fields */}
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="edit-name" className="form-label">
              Model Designation <span className="req">*</span>
            </label>
            <input
              id="edit-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. M4A1 Carbine"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-type" className="form-label">
              Classification
            </label>
            <select
              id="edit-type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-select"
            >
              <option value="Pistol">Pistol</option>
              <option value="Rifle">Rifle</option>
              <option value="Shotgun">Shotgun</option>
              <option value="Submachine Gun">Submachine Gun</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="edit-caliber" className="form-label">
              Operating Caliber <span className="req">*</span>
            </label>
            <input
              id="edit-caliber"
              type="text"
              name="caliber"
              value={formData.caliber}
              onChange={handleChange}
              placeholder="e.g. 5.56x45mm NATO, 9x19mm Parabellum"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-price" className="form-label">
              Unit Price (USD) <span className="req">*</span>
            </label>
            <input
              id="edit-price"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="850"
              className="form-input"
              min="0"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="edit-desc" className="form-label">
            Operational History / Armory Description
          </label>
          <textarea
            id="edit-desc"
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Field reports, reliability notes, recommended mission profiles..."
            className="form-textarea"
          />
        </div>

        {/* Technical Specifications */}
        <div className="card-box">
          <div className="card-box-header">
            <div>
              <h2 className="card-box-title">Technical Specifications</h2>
              <p className="card-box-desc">
                Mechanical constraints, material composition, barrel length, capacity.
              </p>
            </div>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={addSpec}
            >
              <Plus size={14} /> Add Spec
            </button>
          </div>

          <div className="repeater-list">
            {specs.map((spec, idx) => (
              <div key={idx} className="repeater-row">
                <input
                  type="text"
                  placeholder="Parameter (e.g. Weight)"
                  value={spec.name}
                  onChange={(e) => handleSpecChange(idx, 'name', e.target.value)}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Metric (e.g. 3.2 kg)"
                  value={spec.quantity}
                  onChange={(e) => handleSpecChange(idx, 'quantity', e.target.value)}
                  className="form-input"
                />
                <button
                  type="button"
                  className="btn btn--outline btn--sm repeater-remove"
                  onClick={() => removeSpec(idx)}
                  disabled={specs.length <= 1}
                  title="Remove spec"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Protocol */}
        <div className="card-box">
          <div className="card-box-header">
            <div>
              <h2 className="card-box-title">Maintenance &amp; Inspection Steps</h2>
              <p className="card-box-desc">
                Disassembly, lubrication schedule, and safety verification protocol.
              </p>
            </div>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={addStep}
            >
              <Plus size={14} /> Add Step
            </button>
          </div>

          <div className="repeater-list">
            {steps.map((st, idx) => (
              <div key={idx} className="repeater-row repeater-row--step">
                <span className="step-num">{idx + 1}.</span>
                <textarea
                  rows="2"
                  placeholder={`Step ${idx + 1} instruction...`}
                  value={st}
                  onChange={(e) => handleStepChange(idx, e.target.value)}
                  className="form-textarea"
                />
                <button
                  type="button"
                  className="btn btn--outline btn--sm repeater-remove"
                  onClick={() => removeStep(idx)}
                  disabled={steps.length <= 1}
                  title="Remove step"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="entry-submit-bar">
          <button
            type="submit"
            className="btn btn--primary btn--lg"
            disabled={updating}
          >
            {updating ? (
              <>
                <Loader size={18} className="spin" /> Updating Catalog…
              </>
            ) : (
              <>
                <Save size={18} /> Commit Hardware Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirm Back Modal */}
      <ConfirmModal
        open={showConfirmBack}
        title="Discard Unsaved Changes?"
        message="Any modifications not committed to the catalog will be lost unless saved to draft."
        confirmLabel="Leave Editor"
        onConfirm={() => {
          setShowConfirmBack(false)
          if (onBack) onBack()
        }}
        onCancel={() => setShowConfirmBack(false)}
      />

      {/* Draft Restoration Modal */}
      <ConfirmModal
        open={showDraftModal}
        title="Restore Saved Edit Draft?"
        message={`An unfinished draft saved on ${formatDraftTime(draftTimestamp)} was discovered.`}
        confirmLabel="Restore Draft"
        cancelLabel="Discard Draft"
        onConfirm={handleLoadDraft}
        onCancel={handleDiscardDraft}
      />
    </div>
  )
}
