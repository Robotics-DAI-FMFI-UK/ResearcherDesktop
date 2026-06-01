import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { getItem, updateItem, deleteItem, getItems, getFile, removeRelation } from '../../api/items'
import LinkModal from '../../components/LinkModal/LinkModal'
import { Icon } from '../../utils/icons'
import { avatarColor } from '../../utils/avatarColor'
import './ItemDetailPage.css'

export default function ItemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categories, onCategoriesChange } = useOutletContext()

  const [item, setItem] = useState(null)
  const [allItems, setAllItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [value, setValue] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)

  const titleRef = useRef(null)
  const descRef = useRef(null)

  async function fetchItem() {
    const { data } = await getItem(id)
    setItem(data)
  }

  async function fetchAllItems() {
    const { data } = await getItems()
    setAllItems(data)
  }

  useEffect(() => {
    fetchItem()
    fetchAllItems()
  }, [id])

  useEffect(() => {
    if (!item?.imagePath) { setImageUrl(null); return }
    let url
    getFile(item.imagePath)
      .then((r) => { url = URL.createObjectURL(r.data); setImageUrl(url) })
      .catch(() => setImageUrl(null))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [item?.imagePath])

  function startEdit(field) {
    setValue(field === 'title' ? item.title : (item.description || ''))
    setEditing(field)
    setTimeout(() => {
      if (field === 'title') { titleRef.current?.focus() }
      else { descRef.current?.focus() }
    }, 0)
  }

  async function save() {
    if (!editing) { return }
    await updateItem(id, {
      title: editing === 'title' ? value.trim() || item.title : item.title,
      description: editing === 'description' ? value.trim() : item.description,
      date: item.date,
      categoryId: item.categoryId,
    })
    setEditing(null)
    fetchItem()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && editing === 'title') { save() }
    if (e.key === 'Escape') { setEditing(null) }
  }

  async function confirmDelete() {
    setDeleteConfirm(false)
    await deleteItem(id)
    onCategoriesChange()
    navigate('/')
  }

  async function handleRelationsUpdated() {
    await fetchItem()
    await fetchAllItems()
  }

  if (!item) { return <p className="detail-loading">Loading…</p> }

  return (
    <div className="detail-layout">
      <div className="detail-main">
        <div className="detail-back-row">
          <button className="detail-back" onClick={() => navigate('/')}>← Back to list</button>
          <button className="detail-delete" onClick={() => setDeleteConfirm(true)}>Delete</button>
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
          {editing === 'title' ? (
            <input
              ref={titleRef}
              className="detail-title-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={save}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <h2 className="detail-title" onClick={() => startEdit('title')}>{item.title}</h2>
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
          <span>Uploaded {item.date ?? '—'}</span>
        </div>

        {item.filePath && (
          <div className="detail-file-card">
            <h3 className="detail-desc-label">Attached File</h3>
            <div className="detail-file-row">
              <span className="detail-file-name">{item.fileName}</span>
              <button
                className="detail-file-download"
                onClick={() => {
                  getFile(item.filePath).then((r) => {
                    const filename = item.fileName
                    const url = URL.createObjectURL(r.data)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = filename
                    a.click()
                    URL.revokeObjectURL(url)
                  })
                }}
              >
                Download
              </button>
            </div>
          </div>
        )}

        <div className="detail-desc-card">
          <h3 className="detail-desc-label">Description</h3>
          {editing === 'description' ? (
            <textarea
              ref={descRef}
              className="detail-desc-textarea"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={save}
              onKeyDown={handleKeyDown}
              rows={4}
            />
          ) : (
            <p
              className={`detail-desc-text ${!item.description ? 'placeholder' : ''}`}
              onClick={() => startEdit('description')}
            >
              {item.description || 'Click to add a description…'}
            </p>
          )}
        </div>
      </div>

      <aside className="detail-related">
        <div className="detail-related-header">
          <div className="detail-related-header-left">
            <h3 className="detail-related-title">Related Data</h3>
            {item.relatedItems.length > 0 && (
              <span className="detail-related-count">{item.relatedItems.length}</span>
            )}
          </div>
          <button className="detail-related-add" onClick={() => setLinkOpen(true)} title="Link data">
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
                  onClick={async () => {
                    await removeRelation(item.id, rel.id)
                    handleRelationsUpdated()
                  }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </aside>

      <LinkModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        currentItem={item}
        allItems={allItems}
        onUpdated={handleRelationsUpdated}
      />

      {deleteConfirm && (
        <div className="delete-modal-backdrop" onClick={() => setDeleteConfirm(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="delete-modal-title">Delete data?</h3>
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
