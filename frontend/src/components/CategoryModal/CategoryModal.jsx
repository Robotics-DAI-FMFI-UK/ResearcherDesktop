import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon, ICON_NAMES } from '../../utils/icons'
import CustomSelect from '../CustomSelect/CustomSelect'
import './CategoryModal.css'

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'DROPDOWN', label: 'Dropdown' },
  { value: 'CHECKBOX', label: 'Checkbox' },
]

function FieldEditor({ field, index, onChange, onRemove }) {
  const [optionInput, setOptionInput] = useState('')

  function addOption() {
    const opt = optionInput.trim()
    if (!opt) { return }
    const existing = field.options || []
    if (!existing.includes(opt)) {
      onChange(index, { ...field, options: [...existing, opt] })
    }
    setOptionInput('')
  }

  function removeOption(opt) {
    onChange(index, { ...field, options: (field.options || []).filter((o) => o !== opt) })
  }

  return (
    <div className="field-editor">
      <div className="field-editor-row">
        <div className="field-type-select">
          <CustomSelect
            options={FIELD_TYPES}
            value={field.fieldType}
            onChange={(v) => onChange(index, { ...field, fieldType: v, options: [] })}
          />
        </div>
        <input
          className="modal-input field-name-input"
          placeholder="Field name"
          value={field.name}
          onChange={(e) => onChange(index, { ...field, name: e.target.value })}
          maxLength={100}
        />
        <button type="button" className="field-remove-btn" onClick={() => onRemove(index)} title="Remove field">✕</button>
      </div>

      {field.fieldType === 'DROPDOWN' && (
        <div className="field-options">
          {(field.options || []).length > 0 && (
            <div className="field-options-chips">
              {(field.options || []).map((opt) => (
                <span key={opt} className="option-chip">
                  {opt}
                  <button type="button" onClick={() => removeOption(opt)}>✕</button>
                </span>
              ))}
            </div>
          )}
          <div className="field-option-add">
            <input
              className="modal-input"
              placeholder="Add option and press Enter…"
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addOption() }
              }}
            />
            <button type="button" className="btn-secondary option-add-btn" onClick={addOption}>Add</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CategoryModal({ category, onSave, onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('folder')
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (category) {
      setName(category.name)
      setDescription(category.description || '')
      setIcon(category.icon || 'folder')
      setFields((category.fields || []).map((f) => ({ ...f })))
    } else {
      setName('')
      setDescription('')
      setIcon('folder')
      setFields([])
    }
  }, [category])

  function addField() {
    setFields((prev) => [...prev, { name: '', fieldType: 'TEXT', options: [], sortOrder: prev.length }])
  }

  function updateField(index, updated) {
    setFields((prev) => prev.map((f, i) => (i === index ? updated : f)))
  }

  function removeField(index) {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { return }
    setLoading(true)
    setError('')
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        icon,
        fields: fields.map((f, i) => ({ ...f, sortOrder: i })),
      })
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="modal-overlay">
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
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
            <label className="modal-label">Description</label>
            <textarea
              className="modal-input modal-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
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
            <div className="fields-header">
              <label className="modal-label">Fields</label>
              <button type="button" className="field-add-btn" onClick={addField}>+ Add field</button>
            </div>
            {fields.length === 0 && (
              <p className="fields-empty">No fields defined. Items will only have a title.</p>
            )}
            <div className="fields-list">
              {fields.map((f, i) => (
                <FieldEditor key={i} field={f} index={i} onChange={updateField} onRemove={removeField} />
              ))}
            </div>
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
