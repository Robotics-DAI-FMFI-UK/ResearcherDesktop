import { useState, useRef } from 'react'
import './CategoryDetail.css'

export default function CategoryDetail({ category, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const descRef = useRef(null)

  function startEdit() {
    setValue(category.description || '')
    setEditing(true)
    setTimeout(() => descRef.current?.focus(), 0)
  }

  async function save() {
    try {
      await onUpdate(category.id, {
        name: category.name,
        icon: category.icon,
        description: value.trim(),
      })
    } finally {
      setEditing(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() }
    if (e.key === 'Escape') { setEditing(false) }
  }

  return (
    <div className="category-detail">
      {editing ? (
        <textarea
          ref={descRef}
          className="category-detail-textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          rows={3}
        />
      ) : (
        <p
          className={`category-detail-description ${!category.description ? 'placeholder' : ''}`}
          onClick={startEdit}
        >
          {category.description || 'Click to add a description…'}
        </p>
      )}
    </div>
  )
}
