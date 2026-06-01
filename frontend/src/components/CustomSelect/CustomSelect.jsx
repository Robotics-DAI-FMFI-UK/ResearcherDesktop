import { useState, useRef, useEffect } from 'react'
import './CustomSelect.css'

export default function CustomSelect({ options, value, onChange, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false) }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="cselect" ref={ref}>
      <button
        type="button"
        className={`cselect-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cselect-value">{selected ? selected.label : placeholder}</span>
        <span className="cselect-arrow">▾</span>
      </button>

      {open && (
        <div className="cselect-dropdown">
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
        </div>
      )}
    </div>
  )
}
