import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { deleteItem, getFile } from '../../api/items'
import { avatarColor } from '../../utils/avatarColor'
import './ItemCard.css'
import '../CategoryModal/CategoryModal.css'

export default function ItemCard({ item, onDeleted }) {
  const navigate = useNavigate()
  const color = avatarColor(item.categoryName)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)

  useEffect(() => {
    if (!item.imagePath) {
      return
    }
    let url
    getFile(item.imagePath)
      .then((r) => {
        url = URL.createObjectURL(r.data)
        setImageUrl(url)
      })
      .catch(() => {})
    return () => {
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [item.imagePath])

  async function handleDelete(e) {
    e.stopPropagation()
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    setConfirmOpen(false)
    await deleteItem(item.id)
    onDeleted?.()
  }

  return (
    <>
      <div className="item-card" onClick={() => navigate(`/items/${item.id}`)}>
        <div className="item-card-top">
          {imageUrl ? (
            <img className="item-card-avatar item-card-avatar-img" src={imageUrl} alt={item.title} />
          ) : (
            <div className="item-card-avatar" style={{ background: color }}>
              {item.title.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="item-card-meta">
            <h3 className="item-card-title">{item.title}</h3>
            <span className="item-card-category">{item.categoryName}</span>
          </div>
          <button
            className="item-card-delete"
            onClick={handleDelete}
            title="Delete"
            aria-label="Delete item"
          >✕</button>
        </div>

        {item.description && (
          <p className="item-card-description">{item.description}</p>
        )}

        <div className="item-card-footer">
          <span>{item.date ?? '—'}</span>
          {item.relatedItems?.length > 0 && (
            <span className="item-card-linked">{item.relatedItems.length} linked</span>
          )}
        </div>
      </div>

      {confirmOpen && createPortal(
        <div className="delete-modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="delete-modal-title">Delete data?</h3>
            <p className="delete-modal-body">
              Are you sure you want to delete <strong>"{item.title}"</strong>? This action cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button className="delete-modal-cancel" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="delete-modal-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
