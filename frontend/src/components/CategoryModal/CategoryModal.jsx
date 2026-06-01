import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon, ICON_NAMES } from '../../utils/icons'
import './CategoryModal.css'

export default function CategoryModal({ category, onSave, onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('folder')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (category) {
      setName(category.name)
      setDescription(category.description || '')
      setIcon(category.icon || 'folder')
    } else {
      setName('')
      setDescription('')
      setIcon('folder')
    }
  }, [category])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { return }
    setLoading(true)
    setError('')
    try {
      await onSave({ name: name.trim(), description: description.trim(), icon })
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
        <h2 className="modal-title">{category ? 'Edit Category' : 'New Category'}</h2>

        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">Name</label>
            <input
              className="modal-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
              required
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Icon</label>
            <div className="icon-picker">
              {ICON_NAMES.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`icon-picker-btn ${icon === n ? 'selected' : ''}`}
                  onClick={() => setIcon(n)}
                  title={n}
                >
                  <Icon name={n} size={15} />
                </button>
              ))}
            </div>
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
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
