import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useItems } from '../../hooks/useItems'
import { useKeywords } from '../../hooks/useKeywords'
import CustomSelect from '../CustomSelect/CustomSelect'
import CustomDatePicker from '../CustomDatePicker/CustomDatePicker'
import MultiSelect from '../MultiSelect/MultiSelect'
import '../CategoryModal/CategoryModal.css'
import './UploadModal.css'

function isoToDate(str) {
  return str ? new Date(str + 'T00:00:00') : null
}

function dateToIso(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function DynamicField({ field, value, onChange }) {
  if (field.fieldType === 'TEXT') {
    return (
      <input
        className="modal-input"
        value={value || ''}
        onChange={(e) => onChange(field.id, e.target.value)}
        placeholder={field.name}
      />
    )
  }
  if (field.fieldType === 'NUMBER') {
    return (
      <input
        className="modal-input"
        type="number"
        value={value || ''}
        onChange={(e) => onChange(field.id, e.target.value)}
        placeholder={field.name}
      />
    )
  }
  if (field.fieldType === 'DATE') {
    return (
      <CustomDatePicker
        value={isoToDate(value)}
        onChange={(date) => onChange(field.id, dateToIso(date))}
      />
    )
  }
  if (field.fieldType === 'DROPDOWN') {
    return (
      <CustomSelect
        options={(field.options || []).map((o) => ({ value: o, label: o }))}
        value={value || ''}
        onChange={(v) => onChange(field.id, v)}
        placeholder="— select —"
      />
    )
  }
  if (field.fieldType === 'CHECKBOX') {
    return (
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={(e) => onChange(field.id, e.target.checked ? 'true' : 'false')}
        />
        <span>{field.name}</span>
      </label>
    )
  }
  return null
}

export default function UploadModal({ open, onClose, onCreated, categories, selectedCategoryId }) {
  const { createItem, uploadImage, addFile } = useItems()
  const { keywords: allKeywords, createKeyword } = useKeywords()
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date())
  const [fieldValues, setFieldValues] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [attachedFile, setAttachedFile] = useState(null)
  const [selectedKeywordIds, setSelectedKeywordIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      const cid = selectedCategoryId || categories[0]?.id || ''
      setCategoryId(cid)
      setTitle('')
      setDate(new Date())
      setFieldValues({})
      setImageFile(null)
      setImagePreview(null)
      setAttachedFile(null)
      setSelectedKeywordIds([])
      setError('')
    }
  }, [open, selectedCategoryId, categories])

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  )

  const categoryFields = selectedCategory?.fields || []

  const suggestedKeywords = useMemo(() => {
    if (!categoryId) return []
    const candidates = new Set()

    if (selectedCategory?.name) candidates.add(selectedCategory.name.trim())
    if (title.trim()) {
      title.split(/[\s,]+/).forEach((w) => { if (w.length >= 3) candidates.add(w) })
    }
    categoryFields.forEach((field) => {
      const val = fieldValues[field.id]
      if (!val) return
      if (field.fieldType === 'DROPDOWN') candidates.add(val.trim())
      if (field.fieldType === 'TEXT') {
        val.split(/[\s,]+/).forEach((w) => { if (w.length >= 3) candidates.add(w) })
      }
      if (field.fieldType === 'NUMBER') candidates.add(String(val))
      if (field.fieldType === 'DATE') candidates.add(val)
      if (field.fieldType === 'CHECKBOX' && val === 'true') candidates.add(field.name)
    })

    const seen = new Set()
    const results = []
    for (const candidate of candidates) {
      const lower = candidate.toLowerCase()
      if (seen.has(lower)) continue
      seen.add(lower)
      const existing = allKeywords.find((k) => k.name.toLowerCase() === lower)
      if (existing) {
        if (!selectedKeywordIds.includes(existing.id))
          results.push({ id: existing.id, name: existing.name, isNew: false })
      } else {
        results.push({ id: null, name: candidate, isNew: true })
      }
    }
    return results
  }, [categoryId, selectedCategory, title, fieldValues, categoryFields, allKeywords, selectedKeywordIds])

  function handleCategoryChange(newId) {
    setCategoryId(newId)
    setFieldValues({})
  }

  function setFieldValue(fieldId, value) {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }))
  }

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

  async function handleCreateKeyword(name) {
    return createKeyword(name)
  }

  async function handleSuggestionClick(suggestion) {
    if (suggestion.isNew) {
      const kw = await handleCreateKeyword(suggestion.name)
      if (kw) setSelectedKeywordIds((prev) => [...prev, kw.id])
    } else {
      setSelectedKeywordIds((prev) => [...prev, suggestion.id])
    }
  }

  function toIsoDate(d) {
    if (!d) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!categoryId) { return }
    setLoading(true)
    setError('')
    try {
      const fvPayload = Object.entries(fieldValues)
        .filter(([, v]) => v !== '' && v != null)
        .map(([fieldId, value]) => ({ fieldId, value }))

      const { data: created } = await createItem({
        title: title.trim(),
        categoryId,
        date: toIsoDate(date),
        fieldValues: fvPayload,
        keywordIds: selectedKeywordIds,
      })
      if (imageFile) { await uploadImage(created.id, imageFile) }
      if (attachedFile) { await addFile(created.id, attachedFile) }
      onCreated()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) { return null }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  return createPortal(
    <div className="modal-overlay">
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">New Item</h2>

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
              <input type="file" onChange={handleFileChange} />
              <span className="upload-area-icon">📄</span>
              <span className="upload-area-label">
                {attachedFile ? attachedFile.name : 'Attach file'}
              </span>
            </label>
          </div>

          <div className="modal-field">
            <label className="modal-label">Category</label>
            <CustomSelect
              options={categoryOptions}
              value={categoryId}
              onChange={handleCategoryChange}
            />
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
            <label className="modal-label">Date</label>
            <CustomDatePicker value={date} onChange={setDate} />
          </div>

          {categoryFields.map((field) => (
            <div key={field.id} className="modal-field">
              <label className="modal-label">{field.name}</label>
              <DynamicField
                field={field}
                value={fieldValues[field.id]}
                onChange={setFieldValue}
              />
            </div>
          ))}

          <div className="modal-field">
            <label className="modal-label">Keywords</label>
            <MultiSelect
              allKeywords={allKeywords}
              selectedIds={selectedKeywordIds}
              onChange={setSelectedKeywordIds}
              onCreateKeyword={handleCreateKeyword}
            />
          </div>

          {suggestedKeywords.length > 0 && (
            <div className="modal-field">
              <label className="modal-label">Suggested keywords</label>
              <div className="suggested-keywords">
                {suggestedKeywords.map((s) => (
                  <button
                    key={s.isNew ? `new:${s.name}` : s.id}
                    type="button"
                    className={`suggested-chip${s.isNew ? ' suggested-chip--new' : ''}`}
                    onClick={() => handleSuggestionClick(s)}
                  >
                    {s.isNew ? `+ ${s.name}` : s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

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
