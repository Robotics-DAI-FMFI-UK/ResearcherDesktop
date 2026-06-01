import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useItem } from '../../hooks/useItem'
import { useItems } from '../../hooks/useItems'
import { useKeywords } from '../../hooks/useKeywords'
import { useCalendar } from '../../hooks/useCalendar'
import LinkModal from '../../components/LinkModal/LinkModal'
import CustomSelect from '../../components/CustomSelect/CustomSelect'
import CustomDatePicker from '../../components/CustomDatePicker/CustomDatePicker'
import CustomDateTimePicker from '../../components/CustomDateTimePicker/CustomDateTimePicker'
import MultiSelect from '../../components/MultiSelect/MultiSelect'
import { Icon } from '../../utils/icons'
import { avatarColor } from '../../utils/avatarColor'
import './ItemDetailPage.css'

function isoToDate(str) {
  if (!str) { return null }
  const d = new Date(str + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function dateToIso(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function FieldValueDisplay({ fv, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  function startEdit() {
    setValue(fv.value || '')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function save() {
    setEditing(false)
    if (value !== (fv.value || '')) {
      await onSave(fv.fieldId, value)
    }
  }

  if (fv.fieldType === 'CHECKBOX') {
    return (
      <label className="detail-field-checkbox">
        <input
          type="checkbox"
          checked={fv.value === 'true'}
          onChange={(e) => onSave(fv.fieldId, e.target.checked ? 'true' : 'false')}
        />
        <span>{fv.value === 'true' ? 'Yes' : 'No'}</span>
      </label>
    )
  }

  if (fv.fieldType === 'DROPDOWN') {
    return (
      <CustomSelect
        options={(fv.options || []).map((o) => ({ value: o, label: o }))}
        value={fv.value || ''}
        onChange={(v) => onSave(fv.fieldId, v)}
        placeholder="— select —"
      />
    )
  }

  if (fv.fieldType === 'DATE') {
    return (
      <CustomDatePicker
        value={isoToDate(fv.value)}
        onChange={(date) => onSave(fv.fieldId, dateToIso(date))}
      />
    )
  }

  if (editing) {
    if (fv.fieldType === 'TEXT') {
      return (
        <textarea
          ref={inputRef}
          className="detail-field-textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() }
            if (e.key === 'Escape') { setEditing(false) }
          }}
          rows={3}
        />
      )
    }
    return (
      <input
        ref={inputRef}
        className="detail-field-input"
        type={fv.fieldType === 'NUMBER' ? 'number' : 'text'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); save() }
          if (e.key === 'Escape') { setEditing(false) }
        }}
      />
    )
  }

  const displayValue = fv.value || null

  return (
    <p
      className={`detail-field-value ${!displayValue ? 'placeholder' : ''}`}
      onClick={startEdit}
    >
      {displayValue || 'Click to fill in…'}
    </p>
  )
}

function AddLinkModal({ onSave, onClose }) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url.trim()) { return }
    await onSave(url.trim(), name.trim() || null, description.trim() || null)
    onClose()
  }

  return createPortal(
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Link</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">URL</label>
            <input
              className="modal-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              autoFocus
              required
            />
          </div>
          <div className="modal-field">
            <label className="modal-label">Name <span className="modal-label-optional">(optional)</span></label>
            <input
              className="modal-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
            />
          </div>
          <div className="modal-field">
            <label className="modal-label">Description <span className="modal-label-optional">(optional)</span></label>
            <input
              className="modal-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

function AddCommentModal({ onSave, onClose }) {
  const [text, setText] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) { return }
    await onSave(text.trim())
    onClose()
  }

  return createPortal(
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Comment</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <textarea
              className="modal-input modal-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }}
              rows={4}
              autoFocus
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

function CommentRow({ comment, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(comment.text)

  async function save() {
    if (!text.trim()) return
    await onSave(comment.id, text.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="detail-comment-row detail-comment-row--editing">
        <textarea
          className="detail-comment-edit-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() }
            if (e.key === 'Escape') setEditing(false)
          }}
          autoFocus
        />
        <div className="detail-comment-edit-actions">
          <button type="button" className="btn-primary" onClick={save}>Save</button>
          <button type="button" className="btn-secondary" onClick={() => { setText(comment.text); setEditing(false) }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-comment-row">
      <p className="detail-comment-text" onClick={() => setEditing(true)} title="Click to edit">{comment.text}</p>
      <button type="button" className="detail-comment-delete" onClick={() => onDelete(comment.id)}>✕</button>
    </div>
  )
}

export default function ItemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categories, onCategoriesChange } = useOutletContext()

  const {
    item, refetch,
    updateItem, deleteItem,
    addFile, deleteFile, getFile,
    addComment, deleteComment, updateComment,
    addLink, deleteLink,
    addRelation, removeRelation,
  } = useItem(id)
  const { items: allItems, fetchItems: fetchAllItems } = useItems()
  const { keywords: allKeywords, createKeyword } = useKeywords()
  const { createEvent } = useCalendar()

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [relationsOpen, setRelationsOpen] = useState(false)
  const [addLinkOpen, setAddLinkOpen] = useState(false)
  const [addCommentOpen, setAddCommentOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarDT, setCalendarDT] = useState(null)
  const [calendarEndDT, setCalendarEndDT] = useState(null)
  const [calendarSaving, setCalendarSaving] = useState(false)
  const [calendarError, setCalendarError] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const fileInputRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => { fetchAllItems({}) }, [id, fetchAllItems])

  useEffect(() => {
    if (!item?.imagePath) { setImageUrl(null); return }
    let url
    getFile(item.imagePath)
      .then((r) => { url = URL.createObjectURL(r.data); setImageUrl(url) })
      .catch(() => setImageUrl(null))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [item?.imagePath])

  function startEditTitle() {
    setTitleValue(item.title)
    setEditingTitle(true)
    setTimeout(() => titleRef.current?.focus(), 0)
  }

  async function saveTitle() {
    setEditingTitle(false)
    const newTitle = titleValue.trim() || item.title
    if (newTitle === item.title) { return }
    await updateItem({
      title: newTitle,
      date: item.date,
      categoryId: item.categoryId,
      fieldValues: (item.fieldValues || []).map((fv) => ({ fieldId: fv.fieldId, value: fv.value })),
      keywordIds: (item.keywords || []).map((k) => k.id),
    })
  }

  async function saveFieldValue(fieldId, value) {
    const updatedFieldValues = (item.fieldValues || []).map((fv) =>
      fv.fieldId === fieldId ? { fieldId: fv.fieldId, value } : { fieldId: fv.fieldId, value: fv.value }
    )
    try {
      await updateItem({
        title: item.title,
        date: item.date,
        categoryId: item.categoryId,
        fieldValues: updatedFieldValues,
        keywordIds: (item.keywords || []).map((k) => k.id),
      })
    } catch (err) {
      console.error('Failed to save field:', err?.response?.data || err)
    }

    if (item.categoryName?.toLowerCase().includes('conference')) {
      const changedField = (item.fieldValues || []).find(fv => fv.fieldId === fieldId)
      const fieldNameLower = changedField?.fieldName?.toLowerCase() || ''
      const isStartOrEnd = fieldNameLower.includes('start') || fieldNameLower.includes('end') || fieldNameLower.includes('deadline')
      if (isStartOrEnd) {
        const merged = (item.fieldValues || []).map(fv => ({ ...fv, value: fv.fieldId === fieldId ? value : fv.value }))
        const startFv = merged.find(fv => fv.fieldName?.toLowerCase().includes('start'))
        const endFv = merged.find(fv => fv.fieldName?.toLowerCase().includes('end') || fv.fieldName?.toLowerCase().includes('deadline'))
        if (startFv?.value && endFv?.value) {
          createEvent({ summary: item.title, startDateTime: startFv.value, endDateTime: endFv.value, allDay: true }).catch(() => {})
        }
      }
    }
  }

  async function saveKeywords(newIds) {
    await updateItem({
      title: item.title,
      date: item.date,
      categoryId: item.categoryId,
      fieldValues: (item.fieldValues || []).map((fv) => ({ fieldId: fv.fieldId, value: fv.value })),
      keywordIds: newIds,
    })
  }

  async function handleAttachFile(e) {
    const file = e.target.files[0]
    if (!file) { return }
    await addFile(file)
    e.target.value = ''
  }

  async function handleDeleteFile(fileId) {
    await deleteFile(fileId)
  }

  function downloadFile(f) {
    getFile(f.filePath).then((r) => {
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = f.fileName
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  async function handleAddLink(url, name, description) {
    await addLink(url, name, description)
  }

  async function handleDeleteLink(linkId) {
    await deleteLink(linkId)
  }

  async function handleAddComment(text) {
    await addComment(text)
  }

  async function handleDeleteComment(commentId) {
    await deleteComment(commentId)
  }

  async function confirmDelete() {
    setDeleteConfirm(false)
    await deleteItem()
    onCategoriesChange()
    navigate('/')
  }

  function openCalendarModal() {
    const initial = item.date ? new Date(item.date + 'T12:00:00') : new Date()
    initial.setHours(12, 0, 0, 0)
    const end = new Date(initial)
    end.setHours(13, 0, 0, 0)
    setCalendarDT(initial)
    setCalendarEndDT(end)
    setCalendarError('')
    setCalendarOpen(true)
  }

  async function handleAddToCalendar() {
    if (!calendarDT) { return }
    setCalendarSaving(true)
    setCalendarError('')
    try {
      const pad = (n) => String(n).padStart(2, '0')
      const toIso = (dt) =>
        `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`
      const payload = { summary: item.title, startDateTime: toIso(calendarDT), allDay: false }
      if (calendarEndDT) { payload.endDateTime = toIso(calendarEndDT) }
      await createEvent(payload)
      setCalendarOpen(false)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || ''
      setCalendarError('Failed to add event. ' + (msg || 'Make sure Google Calendar is connected.'))
    } finally {
      setCalendarSaving(false)
    }
  }

  async function handleRelationsUpdated() {
    await refetch()
    await fetchAllItems({})
  }

  const suggestedKeywords = useMemo(() => {
    if (!item) return []
    const selectedIds = new Set((item.keywords || []).map(k => k.id))
    const candidates = new Set()

    if (item.categoryName) candidates.add(item.categoryName.trim())

    ;(item.fieldValues || []).forEach(fv => {
      const val = fv.value
      if (!val) return
      if (fv.fieldType === 'DROPDOWN') candidates.add(val.trim())
      else if (fv.fieldType === 'TEXT') {
        val.split(/[\s,]+/).forEach(w => { if (w.length >= 3) candidates.add(w) })
      }
      else if (fv.fieldType === 'NUMBER') candidates.add(String(val))
      else if (fv.fieldType === 'DATE') candidates.add(val)
      else if (fv.fieldType === 'CHECKBOX' && val === 'true') candidates.add(fv.fieldName)
    })

    const seen = new Set()
    const results = []
    for (const candidate of candidates) {
      const lower = candidate.toLowerCase()
      if (seen.has(lower)) continue
      seen.add(lower)
      const existing = allKeywords.find(k => k.name.toLowerCase() === lower)
      if (existing) {
        if (!selectedIds.has(existing.id)) results.push({ id: existing.id, name: existing.name, isNew: false })
      } else {
        results.push({ id: null, name: candidate, isNew: true })
      }
    }
    return results
  }, [item, allKeywords])

  async function handleSuggestionClick(s) {
    const currentIds = (item.keywords || []).map(k => k.id)
    if (s.isNew) {
      const kw = await createKeyword(s.name)
      if (kw) await saveKeywords([...currentIds, kw.id])
    } else {
      await saveKeywords([...currentIds, s.id])
    }
  }

  if (!item) { return <p className="detail-loading">Loading…</p> }

  const fieldValues = item.fieldValues || []
  const half = Math.ceil(fieldValues.length / 2)
  const leftFields = fieldValues.slice(0, half)
  const rightFields = fieldValues.slice(half)

  return (
    <div className="detail-layout">
      <div className="detail-main">
        <div className="detail-back-row">
          <button className="detail-back" onClick={() => navigate('/')}>← Back to list</button>
          <div className="detail-back-row-right">
            <button className="detail-calendar-btn" onClick={openCalendarModal} title="Add to Google Calendar">
              <Icon name="calendar" size={13} />
              Add to Calendar
            </button>
            <button className="detail-delete" onClick={() => setDeleteConfirm(true)}>Delete</button>
          </div>
        </div>

        {imageUrl
          ? <img className="detail-image-actual" src={imageUrl} alt={item.title} />
          : (
            <div
              className="detail-image-header"
              style={{ background: avatarColor(item.categoryName) }}
            >
              <h2 className="detail-image-heading">{item.title}</h2>
            </div>
          )
        }

        <div className="detail-title-row">
          {editingTitle ? (
            <input
              ref={titleRef}
              className="detail-title-input"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { saveTitle() }
                if (e.key === 'Escape') { setEditingTitle(false) }
              }}
            />
          ) : (
            <h2 className="detail-title" onClick={startEditTitle}>{item.title}</h2>
          )}
        </div>

        <div className="detail-subtitle">
          <button
            className="detail-category-link"
            onClick={() => navigate(`/?categoryId=${item.categoryId}`)}
          >
            {item.categoryName}
          </button>
          <span className="detail-dot">•</span>
          <span>{item.date ?? '—'}</span>
        </div>

        {fieldValues.length > 0 && (
          <div className="detail-fields-card">
            <div className="detail-fields-col">
              {leftFields.map((fv) => (
                <div key={fv.fieldId} className="detail-field-row">
                  <span className="detail-field-label">{fv.fieldName}</span>
                  <div className="detail-field-content">
                    <FieldValueDisplay fv={fv} onSave={saveFieldValue} />
                  </div>
                </div>
              ))}
            </div>
            {rightFields.length > 0 && (
              <div className="detail-fields-col">
                {rightFields.map((fv) => (
                  <div key={fv.fieldId} className="detail-field-row">
                    <span className="detail-field-label">{fv.fieldName}</span>
                    <div className="detail-field-content">
                      <FieldValueDisplay fv={fv} onSave={saveFieldValue} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="detail-section-card">
          <div className="detail-section-header">
            <h3 className="detail-desc-label">Files</h3>
            <button
              className="detail-section-add"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <Icon name="plus" size={12} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleAttachFile}
            />
          </div>
          {(item.files || []).length === 0 ? (
            <p className="detail-files-empty">No files attached.</p>
          ) : (
            <div className="detail-files-list">
              {(item.files || []).map((f) => (
                <div key={f.id} className="detail-file-row">
                  <span className="detail-file-name">{f.fileName}</span>
                  <div className="detail-file-actions">
                    <button className="detail-file-download" onClick={() => downloadFile(f)}>Download</button>
                    <button className="detail-file-remove" onClick={() => handleDeleteFile(f.id)} title="Remove">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-section-card">
          <div className="detail-section-header">
            <h3 className="detail-desc-label">Links</h3>
            <button className="detail-section-add" onClick={() => setAddLinkOpen(true)} title="Add link">
              <Icon name="plus" size={12} />
            </button>
          </div>
          {(item.links || []).length === 0 ? (
            <p className="detail-files-empty">No links yet.</p>
          ) : (
            <div className="detail-links-list">
              {(item.links || []).map((l) => (
                <div key={l.id} className="detail-link-row">
                  <div className="detail-link-info">
                    <a href={l.url} target="_blank" rel="noreferrer" className="detail-link-url">
                      {l.name || l.url}
                    </a>
                    {l.description && <span className="detail-link-desc">{l.description}</span>}
                  </div>
                  <button
                    className="detail-file-remove"
                    onClick={() => handleDeleteLink(l.id)}
                    title="Remove"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-section-card">
          <div className="detail-section-header">
            <h3 className="detail-desc-label">Comments</h3>
            <button className="detail-section-add" onClick={() => setAddCommentOpen(true)} title="Add comment">
              <Icon name="plus" size={12} />
            </button>
          </div>
          {(item.comments || []).length === 0 ? (
            <p className="detail-files-empty">No comments yet.</p>
          ) : (
            <div className="detail-comments-list">
              {(item.comments || []).map(c => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  onSave={updateComment}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="detail-related">
        <div className="detail-keywords-section">
          <h3 className="detail-related-title" style={{ marginBottom: '0.6rem' }}>Keywords</h3>
          <MultiSelect
            allKeywords={allKeywords}
            selectedIds={(item.keywords || []).map((k) => k.id)}
            onChange={saveKeywords}
            onCreateKeyword={createKeyword}
            placeholder="Add keyword…"
          />
          {suggestedKeywords.length > 0 && (
            <div className="detail-keyword-suggestions">
              <span className="detail-keyword-suggestions-label">Suggested:</span>
              <div className="suggested-keywords">
                {suggestedKeywords.map(s => (
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
        </div>

        <div className="detail-related-divider" />

        <div className="detail-related-header">
          <div className="detail-related-header-left">
            <h3 className="detail-related-title">Related Data</h3>
            {item.relatedItems.length > 0 && (
              <span className="detail-related-count">{item.relatedItems.length}</span>
            )}
          </div>
          <button className="detail-related-add" onClick={() => setRelationsOpen(true)} title="Link data">
            <Icon name="plus" size={14} />
          </button>
        </div>

        {item.relatedItems.length === 0 ? (
          <p className="detail-related-empty">No linked data yet. Click + to add links.</p>
        ) : (
          <div className="detail-related-list">
            {item.relatedItems.map((rel) => (
              <div key={rel.id} className="detail-related-item">
                <button
                  className="detail-related-item-main"
                  onClick={() => navigate(`/items/${rel.id}`)}
                >
                  <div
                    className="detail-related-avatar"
                    style={{ background: avatarColor(rel.categoryName) }}
                  >
                    {rel.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="detail-related-info">
                    <span className="detail-related-name">{rel.title}</span>
                    <span className="detail-related-cat">{rel.categoryName}</span>
                  </div>
                </button>
                <button
                  className="detail-related-unlink"
                  title="Remove link"
                  onClick={() => removeRelation(rel.id)}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </aside>

      <LinkModal
        open={relationsOpen}
        onClose={() => setRelationsOpen(false)}
        currentItem={item}
        allItems={allItems}
        onUpdated={handleRelationsUpdated}
      />

      {addLinkOpen && (
        <AddLinkModal
          onSave={handleAddLink}
          onClose={() => setAddLinkOpen(false)}
        />
      )}

      {addCommentOpen && (
        <AddCommentModal
          onSave={handleAddComment}
          onClose={() => setAddCommentOpen(false)}
        />
      )}

      {calendarOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 className="modal-title">Add to Calendar</h2>
            <p className="modal-subtitle">{item.title}</p>
            <div className="modal-field" style={{ marginTop: '1rem' }}>
              <label className="modal-label">Start</label>
              <CustomDateTimePicker value={calendarDT} onChange={setCalendarDT} />
            </div>
            <div className="modal-field">
              <label className="modal-label">End</label>
              <CustomDateTimePicker value={calendarEndDT} onChange={setCalendarEndDT} />
            </div>
            {calendarError && <p className="modal-error">{calendarError}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setCalendarOpen(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleAddToCalendar} disabled={calendarSaving}>
                {calendarSaving ? '…' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteConfirm && (
        <div className="delete-modal-backdrop">
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="delete-modal-title">Delete item?</h3>
            <p className="delete-modal-body">
              Are you sure you want to delete <strong>"{item.title}"</strong>? This action cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button className="delete-modal-cancel" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              <button className="delete-modal-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
