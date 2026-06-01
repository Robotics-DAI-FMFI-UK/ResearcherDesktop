import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useItems } from '../../hooks/useItems'
import { useKeywords } from '../../hooks/useKeywords'
import { Icon } from '../../utils/icons'
import MultiSelect from '../MultiSelect/MultiSelect'
import ItemCard from '../ItemCard/ItemCard'
import UploadModal from '../UploadModal/UploadModal'
import '../CategoryModal/CategoryModal.css'
import './ItemList.css'

function SearchModal({ allKeywords, filters, onApply, onClose }) {
  const [text, setText] = useState(filters.text || '')
  const [andIds, setAndIds] = useState(filters.andKeywordIds || [])
  const [orIds,  setOrIds]  = useState(filters.orKeywordIds  || [])
  const [notIds, setNotIds] = useState(filters.notKeywordIds || [])

  function handleApply() {
    onApply({ text, andKeywordIds: andIds, orKeywordIds: orIds, notKeywordIds: notIds })
    onClose()
  }

  function handleClear() {
    onClose()
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Search & Filter</h2>
        <div className="modal-form">
          <div className="modal-field">
            <label className="modal-label">Text</label>
            <input
              className="modal-input"
              placeholder="Search by title or description…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApply() } }}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">AND — must have all</label>
            <MultiSelect allKeywords={allKeywords} selectedIds={andIds} onChange={setAndIds} />
          </div>

          <div className="modal-field">
            <label className="modal-label">OR — must have any</label>
            <MultiSelect allKeywords={allKeywords} selectedIds={orIds} onChange={setOrIds} />
          </div>

          <div className="modal-field">
            <label className="modal-label">NOT — must have none</label>
            <MultiSelect allKeywords={allKeywords} selectedIds={notIds} onChange={setNotIds} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClear}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleApply}>Apply</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function ItemList({ selectedId, categories, onCategoriesChange, uploadOpen, onOpenUpload, onCloseUpload, refreshSignal }) {
  const { items, loading, fetchItems: hookFetchItems } = useItems()
  const { keywords: allKeywords } = useKeywords()
  const [filters, setFilters] = useState({ text: '', andKeywordIds: [], orKeywordIds: [], notKeywordIds: [] })
  const [searchOpen, setSearchOpen] = useState(false)
  const filtersRef = useRef(filters)

  const fetchItems = useCallback(async (f) => {
    const params = {}
    if (selectedId) { params.categoryId = selectedId }
    if (f?.text?.trim()) { params.search = f.text.trim() }
    if (f?.andKeywordIds?.length > 0) { params.andKeywords = f.andKeywordIds.join(',') }
    if (f?.orKeywordIds?.length  > 0) { params.orKeywords  = f.orKeywordIds.join(',') }
    if (f?.notKeywordIds?.length > 0) { params.notKeywords = f.notKeywordIds.join(',') }
    await hookFetchItems(params)
  }, [selectedId, hookFetchItems])

  useEffect(() => { filtersRef.current = filters }, [filters])

  useEffect(() => {
    const defaultFilters = { text: '', andKeywordIds: [], orKeywordIds: [], notKeywordIds: [] }
    setFilters(defaultFilters)
    fetchItems(defaultFilters)
  }, [selectedId])

  useEffect(() => {
    if (refreshSignal > 0) { fetchItems(filtersRef.current) }
  }, [refreshSignal, fetchItems])

  function handleApplyFilters(newFilters) {
    setFilters(newFilters)
    fetchItems(newFilters)
  }

  function removeFilterChip(patch) {
    const f = { ...filters, ...patch }
    setFilters(f)
    fetchItems(f)
  }

  const hasFilters = !!filters.text || filters.andKeywordIds.length > 0 || filters.orKeywordIds.length > 0 || filters.notKeywordIds.length > 0
  const activeCount = (filters.text ? 1 : 0) + filters.andKeywordIds.length + filters.orKeywordIds.length + filters.notKeywordIds.length

  return (
    <div className="item-list">
      <div className="item-list-toolbar">
        <button
          className={`search-btn ${hasFilters ? 'active' : ''}`}
          onClick={() => setSearchOpen(true)}
        >
          <Icon name="search" size={14} />
          Search
          {hasFilters && <span className="search-btn-badge">{activeCount}</span>}
        </button>
      </div>

      {hasFilters && (
        <div className="item-list-filter-chips">
          {filters.text && (
            <span className="filter-chip">
              "{filters.text}"
              <button type="button" onClick={() => removeFilterChip({ text: '' })}>✕</button>
            </span>
          )}
          {filters.andKeywordIds.map((kwId) => {
            const kw = allKeywords.find((k) => k.id === kwId)
            return kw ? (
              <span key={kwId} className="filter-chip">
                AND: {kw.name}
                <button
                  type="button"
                  onClick={() => removeFilterChip({ andKeywordIds: filters.andKeywordIds.filter((x) => x !== kwId) })}
                >✕</button>
              </span>
            ) : null
          })}
          {filters.orKeywordIds.map((kwId) => {
            const kw = allKeywords.find((k) => k.id === kwId)
            return kw ? (
              <span key={kwId} className="filter-chip">
                OR: {kw.name}
                <button
                  type="button"
                  onClick={() => removeFilterChip({ orKeywordIds: filters.orKeywordIds.filter((x) => x !== kwId) })}
                >✕</button>
              </span>
            ) : null
          })}
          {filters.notKeywordIds.map((kwId) => {
            const kw = allKeywords.find((k) => k.id === kwId)
            return kw ? (
              <span key={kwId} className="filter-chip">
                NOT: {kw.name}
                <button
                  type="button"
                  onClick={() => removeFilterChip({ notKeywordIds: filters.notKeywordIds.filter((x) => x !== kwId) })}
                >✕</button>
              </span>
            ) : null
          })}
          <button
            type="button"
            className="filter-chip-clear"
            onClick={() => handleApplyFilters({ text: '', andKeywordIds: [], orKeywordIds: [], notKeywordIds: [] })}
          >
            Clear all
          </button>
        </div>
      )}

      {loading ? (
        <p className="item-list-status">Loading…</p>
      ) : items.length === 0 ? (
        <div className="item-list-empty">
          {hasFilters ? (
            <>
              <p className="item-list-empty-title">No data found</p>
              <p className="item-list-empty-sub">Try adjusting your search or filter selection.</p>
            </>
          ) : (
            <>
              <p className="item-list-empty-title">No items yet</p>
              <p className="item-list-empty-sub">Add your first item to get started.</p>
              <button className="upload-btn item-list-empty-action" onClick={onOpenUpload}>
                <Icon name="plus" size={14} />
                New item
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="item-grid">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onDeleted={() => { fetchItems(filters); onCategoriesChange?.() }}
            />
          ))}
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={onCloseUpload}
        onCreated={() => { fetchItems(filters); onCategoriesChange?.() }}
        categories={categories}
        selectedCategoryId={selectedId}
      />

      {searchOpen && (
        <SearchModal
          allKeywords={allKeywords}
          filters={filters}
          onApply={handleApplyFilters}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  )
}
