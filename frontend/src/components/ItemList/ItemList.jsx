import { useState, useEffect, useCallback } from 'react'
import { getItems } from '../../api/items'
import { Icon } from '../../utils/icons'
import ItemCard from '../ItemCard/ItemCard'
import UploadModal from '../UploadModal/UploadModal'
import './ItemList.css'

export default function ItemList({ selectedId, categories, onCategoriesChange }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchItems = useCallback(async (searchValue = '') => {
    setLoading(true)
    try {
      const params = {}
      if (selectedId) { params.categoryId = selectedId }
      if (searchValue.trim()) { params.search = searchValue.trim() }
      const { data } = await getItems(params)
      setItems(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  useEffect(() => {
    setSearch('')
    fetchItems('')
  }, [selectedId])

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(search), 300)
    return () => clearTimeout(timer)
  }, [search, fetchItems])

  return (
    <div className="item-list">
      <div className="item-list-toolbar">
        <div className="search-bar">
          <span className="search-icon"><Icon name="search" size={15} /></span>
          <input
            className="search-input"
            placeholder="Search all data…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <button className="upload-btn" onClick={() => setUploadOpen(true)}>
          <Icon name="plus" size={14} />
          Upload
        </button>
      </div>

      {loading ? (
        <p className="item-list-status">Loading…</p>
      ) : items.length === 0 ? (
        <div className="item-list-empty">
          <p className="item-list-empty-title">No data found</p>
          <p className="item-list-empty-sub">Try adjusting your search or category selection.</p>
        </div>
      ) : (
        <div className="item-grid">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onDeleted={() => { fetchItems(search); onCategoriesChange?.() }}
            />
          ))}
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onCreated={() => { fetchItems(search); onCategoriesChange?.() }}
        categories={categories}
        selectedCategoryId={selectedId}
      />
    </div>
  )
}
