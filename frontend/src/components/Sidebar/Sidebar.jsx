import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../utils/icons'
import CategoryModal from '../CategoryModal/CategoryModal'
import './Sidebar.css'

export default function Sidebar({ categories, selectedId, onSelect, onCreate, onUpdate, onDelete }) {
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const totalCount = categories.reduce((sum, c) => sum + (c.itemCount || 0), 0)

  async function handleSave(data) {
    if (modal === 'create') {
      await onCreate(data)
    } else {
      await onUpdate(modal.id, data)
    }
    setModal(null)
  }

  function handleDelete(e, category) {
    e.stopPropagation()
    setDeleteTarget(category)
  }

  async function confirmDelete() {
    await onDelete(deleteTarget.id)
    if (selectedId === deleteTarget.id) { onSelect(null) }
    setDeleteTarget(null)
  }

  function openEdit(e, category) {
    e.stopPropagation()
    setModal(category)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-label">Categories</span>
        <button className="sidebar-add-btn" onClick={() => setModal('create')} title="New category">
          <Icon name="plus" size={12} />
        </button>
      </div>

      <ul className="sidebar-list">
        <li
          className={`sidebar-item ${selectedId === null ? 'active' : ''}`}
          onClick={() => onSelect(null)}
        >
          <div className="sidebar-item-left">
            <span className="sidebar-item-icon sidebar-item-icon--all">
              <Icon name="layers" size={14} />
            </span>
            <span className="sidebar-item-name">All Data</span>
          </div>
          <div className="sidebar-item-right">
            <span className="sidebar-item-count">{totalCount}</span>
          </div>
        </li>

        {[...categories].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })).map((cat) => (
          <li
            key={cat.id}
            className={`sidebar-item ${selectedId === cat.id ? 'active' : ''}`}
            onClick={() => onSelect(cat.id)}
          >
            <div className="sidebar-item-left">
              <span className="sidebar-item-icon">
                <Icon name={cat.icon || 'folder'} size={14} />
              </span>
              <span className="sidebar-item-name">{cat.name}</span>
            </div>
            <div className="sidebar-item-right">
              <span className="sidebar-item-count">{cat.itemCount || 0}</span>
              <div className="sidebar-item-actions">
                <button className="sidebar-icon-btn" onClick={(e) => openEdit(e, cat)} title="Edit"><Icon name="pencil" size={12} /></button>
                <button className="sidebar-icon-btn delete" onClick={(e) => handleDelete(e, cat)} title="Delete">✕</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {modal && (
        <CategoryModal
          category={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && createPortal(
        <div className="delete-modal-backdrop">
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="delete-modal-title">Delete category?</h3>
            <p className="delete-modal-body">
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? All items in this category will also be deleted.
            </p>
            <div className="delete-modal-actions">
              <button className="delete-modal-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="delete-modal-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  )
}
