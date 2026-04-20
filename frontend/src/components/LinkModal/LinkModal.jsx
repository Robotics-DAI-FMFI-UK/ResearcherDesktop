import { useState } from 'react'
import { createPortal } from 'react-dom'
import { addRelation, removeRelation } from '../../api/items'
import { avatarColor } from '../../utils/avatarColor'
import './LinkModal.css'

export default function LinkModal({ open, onClose, currentItem, allItems, onUpdated }) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(null)

  if (!open) { return null }

  const linkedIds = new Set(currentItem.relatedItems.map((r) => r.id))

  const filtered = allItems.filter(
    (i) =>
      i.id !== currentItem.id &&
      (i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.categoryName || '').toLowerCase().includes(search.toLowerCase()))
  )

  async function toggle(item) {
    setLoading(item.id)
    try {
      if (linkedIds.has(item.id)) {
        await removeRelation(currentItem.id, item.id)
      } else {
        await addRelation(currentItem.id, item.id)
      }
      await onUpdated()
    } finally {
      setLoading(null)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal link-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Link Related Data</h2>

        <div className="link-modal-search">
          <input
            className="modal-input"
            placeholder="Search data…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="link-modal-list">
          {filtered.length === 0 ? (
            <p className="link-modal-empty">No matching data found.</p>
          ) : (
            filtered.map((item) => {
              const linked = linkedIds.has(item.id)
              const color = avatarColor(item.categoryName)
              return (
                <button
                  key={item.id}
                  className={`link-modal-item ${linked ? 'linked' : ''}`}
                  onClick={() => toggle(item)}
                  disabled={loading === item.id}
                >
                  <div className="link-modal-avatar" style={{ background: color }}>
                    {item.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="link-modal-item-info">
                    <span className="link-modal-item-title">{item.title}</span>
                    <span className="link-modal-item-meta">{item.categoryName} · {item.date ?? '—'}</span>
                  </div>
                  <span className={`link-modal-item-icon ${linked ? 'linked' : ''}`}>
                    {linked ? '✓' : '+'}
                  </span>
                </button>
              )
            })
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
