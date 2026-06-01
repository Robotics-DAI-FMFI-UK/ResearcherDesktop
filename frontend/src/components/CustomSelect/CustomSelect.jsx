import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './CustomSelect.css'

export default function CustomSelect({ options, value, onChange, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClick(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleToggle() {
    if (!open) {
      const rect = triggerRef.current.getBoundingClientRect()
      const dropdownHeight = 220
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight

      setDropdownStyle(openUpward
        ? { bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width }
        : { top: rect.bottom + 4, left: rect.left, width: rect.width }
      )
    }
    setOpen((v) => !v)
  }

  return (
    <div className="cselect">
      <button
        ref={triggerRef}
        type="button"
        className={`cselect-trigger ${open ? 'open' : ''}`}
        onClick={handleToggle}
      >
        <span className="cselect-value">{selected ? selected.label : placeholder}</span>
        <span className="cselect-arrow">▾</span>
      </button>

      {open && createPortal(
        <div ref={dropdownRef} className="cselect-dropdown" style={dropdownStyle}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`cselect-option ${o.value === value ? 'selected' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false) }}
            >
              <span className="cselect-check">{o.value === value ? '✓' : ''}</span>
              {o.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
