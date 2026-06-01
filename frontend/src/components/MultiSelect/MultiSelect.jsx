import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './MultiSelect.css'

export default function MultiSelect({ allKeywords, selectedIds, onChange, onCreateKeyword, placeholder = 'Add keyword…' }) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const selectedKeywords = allKeywords.filter((k) => selectedIds.includes(k.id))
  const filteredOptions = allKeywords.filter(
    (k) => !selectedIds.includes(k.id) && k.name.toLowerCase().includes(input.toLowerCase())
  )
  const canCreate =
    !!onCreateKeyword &&
    input.trim().length > 0 &&
    !allKeywords.find((k) => k.name.toLowerCase() === input.trim().toLowerCase())

  useEffect(() => {
    function handleClick(e) {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function openDropdown() {
    const rect = inputRef.current.getBoundingClientRect()
    const dropdownHeight = 220
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight
    setDropdownStyle(
      openUpward
        ? { bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width }
        : { top: rect.bottom + 4, left: rect.left, width: rect.width }
    )
    setOpen(true)
  }

  function selectKeyword(kw) {
    onChange([...selectedIds, kw.id])
    setInput('')
  }

  function deselectKeyword(id) {
    onChange(selectedIds.filter((x) => x !== id))
  }

  async function createNew() {
    const name = input.trim()
    if (!name || !onCreateKeyword) { return }
    const newKw = await onCreateKeyword(name)
    if (newKw) { onChange([...selectedIds, newKw.id]) }
    setInput('')
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredOptions.length > 0) { selectKeyword(filteredOptions[0]); setOpen(false) }
      else if (canCreate) { createNew() }
    }
    if (e.key === 'Escape') { setOpen(false) }
  }

  const showDropdown = open && (filteredOptions.length > 0 || canCreate)

  return (
    <div className="multiselect">
      {selectedKeywords.length > 0 && (
        <div className="multiselect-chips">
          {selectedKeywords.map((k) => (
            <span key={k.id} className="multiselect-chip">
              {k.name}
              <button type="button" onClick={() => deselectKeyword(k.id)}>✕</button>
            </span>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        className="multiselect-input"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={openDropdown}
        onClick={openDropdown}
        onKeyDown={handleKeyDown}
      />
      {showDropdown && createPortal(
        <div ref={dropdownRef} className="multiselect-dropdown" style={{ position: 'fixed', ...dropdownStyle }}>
          {filteredOptions.map((k) => (
            <button
              key={k.id}
              type="button"
              className="multiselect-option"
              onMouseDown={() => { selectKeyword(k); setOpen(false) }}
            >
              {k.name}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              className="multiselect-option multiselect-create"
              onMouseDown={createNew}
            >
              Create "{input.trim()}"
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
