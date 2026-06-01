import { useState } from 'react'
import { createCategory, updateCategory, deleteCategory } from '../../api/categories'
import { Icon } from '../../utils/icons'
import CategoryModal from '../CategoryModal/CategoryModal'
import './Sidebar.css'

export default function Sidebar({ categories, selectedId, onSelect, onCategoriesChange, mode }) {
  const [modal, setModal] = useState(null)
  const canEdit = mode !== 'BASIC'

  const totalCount = categories.reduce((sum, c) => sum + (c.itemCount || 0), 0)

  async function handleSave(data) {
    if (modal === 'create') {
      await createCategory(data)
    } else {
      await updateCategory(modal.id, data)
    }
    onCategoriesChange()
  }

  async function handleDelete(e, category) {
    e.stopPropagation()
    if (!window.confirm(`Delete "${category.name}"?`)) return
    await deleteCategory(category.id)
    if (selectedId === category.id) { onSelect(null) }
    onCategoriesChange()
  }

  function openEdit(e, category) {
    e.stopPropagation()
    setModal(category)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-label">Categories</span>
        {canEdit && (
          <button className="sidebar-add-btn" onClick={() => setModal('create')} title="New category">
            <Icon name="plus" size={12} />
          </button>
        )}
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

        {categories.map((cat) => (
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
              {canEdit && (
                <div className="sidebar-item-actions">
                  <button className="sidebar-icon-btn" onClick={(e) => openEdit(e, cat)} title="Edit"><Icon name="pencil" size={12} /></button>
                  <button className="sidebar-icon-btn delete" onClick={(e) => handleDelete(e, cat)} title="Delete">✕</button>
                </div>
              )}
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
    </aside>
  )
}
