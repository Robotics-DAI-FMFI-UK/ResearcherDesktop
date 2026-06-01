import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createItem, uploadImage, uploadFile } from '../../api/items'
import CustomSelect from '../CustomSelect/CustomSelect'
import CustomDatePicker from '../CustomDatePicker/CustomDatePicker'
import '../CategoryModal/CategoryModal.css'
import './UploadModal.css'

export default function UploadModal({ open, onClose, onCreated, categories, selectedCategoryId }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date())
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [attachedFile, setAttachedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setCategoryId(selectedCategoryId || categories[0]?.id || '')
      setTitle('')
      setDescription('')
      setDate(new Date())
      setImageFile(null)
      setImagePreview(null)
      setAttachedFile(null)
      setError('')
    }
  }, [open, selectedCategoryId, categories])

  if (!open) { return null }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) { return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) { return }
    setAttachedFile(file)
  }

  function toIsoDate(d) {
    return d.toISOString().slice(0, 10)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!categoryId) { return }
    setLoading(true)
    setError('')
    try {
      const { data: created } = await createItem({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        date: toIsoDate(date),
      })
      if (imageFile) { await uploadImage(created.id, imageFile) }
      if (attachedFile) { await uploadFile(created.id, attachedFile) }
      onCreated()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Upload Data</h2>

        {error && <p className="modal-error">{error}</p>}

        <form className="upload-form" onSubmit={handleSubmit}>

          <div className="upload-media-row">
            <label className="upload-area">
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview
                ? <img className="upload-area-preview" src={imagePreview} alt="preview" />
                : <>
                    <span className="upload-area-icon">📷</span>
                    <span className="upload-area-label">Add image</span>
                  </>
              }
            </label>

            <label className="upload-area">
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
              <span className="upload-area-icon">📄</span>
              <span className="upload-area-label">
                {attachedFile ? attachedFile.name : 'Attach file'}
              </span>
            </label>
          </div>

          <div className="modal-field">
            <label className="modal-label">Name</label>
            <input
              className="modal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Category</label>
            <CustomSelect
              options={categoryOptions}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Date</label>
            <CustomDatePicker value={date} onChange={setDate} />
          </div>

          <div className="modal-field">
            <label className="modal-label">Description</label>
            <textarea
              className="modal-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
