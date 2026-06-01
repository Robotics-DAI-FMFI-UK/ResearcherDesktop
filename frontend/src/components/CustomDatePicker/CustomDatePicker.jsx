import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './CustomDatePicker.css'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']

function formatDisplay(date) {
  if (!date) { return '' }
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

function formatManualInput(date) {
  if (!date) { return '' }
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${date.getFullYear()}`
}

function parseManualDate(str) {
  const s = str.trim()
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) {
    const [day, month, year] = s.split('.')
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(d) && d.getFullYear() === parseInt(year) &&
        d.getMonth() === parseInt(month) - 1 && d.getDate() === parseInt(day)) { return d }
  }
  return null
}

export default function CustomDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => value ? value.getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? value.getMonth() : new Date().getMonth())
  const [manualInput, setManualInput] = useState('')
  const [inputError, setInputError] = useState(false)
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 })
  const [dropUp, setDropUp] = useState(false)
  const triggerRef = useRef(null)
  const popupRef = useRef(null)
  const manualRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popupRef.current && !popupRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleToggle() {
    const next = !open
    if (next && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      const left = r.left + 280 > window.innerWidth ? r.right - 280 : r.left
      const spaceBelow = window.innerHeight - r.bottom
      const up = spaceBelow < 300
      setDropUp(up)
      setPopupPos(
        up
          ? { bottom: window.innerHeight - r.top + 4, left }
          : { top: r.bottom + 4, left }
      )
    }
    setOpen(next)
    if (next) {
      setManualInput(value ? formatManualInput(value) : '')
      setInputError(false)
      if (value) {
        setViewYear(value.getFullYear())
        setViewMonth(value.getMonth())
      }
      setTimeout(() => manualRef.current?.focus(), 50)
    }
  }

  function applyManualInput() {
    if (!manualInput.trim()) { setOpen(false); return }
    const parsed = parseManualDate(manualInput)
    if (parsed) {
      onChange(parsed)
      setViewYear(parsed.getFullYear())
      setViewMonth(parsed.getMonth())
      setOpen(false)
      setInputError(false)
    } else {
      setInputError(true)
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else { setViewMonth(m => m - 1) }
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else { setViewMonth(m => m + 1) }
  }

  function buildDays() {
    const first = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate()
    const cells = []
    for (let i = first - 1; i >= 0; i--) { cells.push({ day: daysInPrev - i, month: 'prev' }) }
    for (let d = 1; d <= daysInMonth; d++) { cells.push({ day: d, month: 'current' }) }
    while (cells.length % 7 !== 0) { cells.push({ day: cells.length - first - daysInMonth + 1, month: 'next' }) }
    return cells
  }

  const today = new Date()
  const cells = buildDays()

  function selectDay(day) {
    const picked = new Date(viewYear, viewMonth, day)
    onChange(picked)
    setOpen(false)
  }

  function isSelected(day) {
    return value && value.getFullYear() === viewYear && value.getMonth() === viewMonth && value.getDate() === day
  }

  function isToday(day) {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
  }

  return (
    <div className="cdp" ref={triggerRef}>
      <button
        type="button"
        className={`cdp-trigger ${open ? 'open' : ''}`}
        onClick={handleToggle}
      >
        <span className="cdp-icon">📅</span>
        <span className="cdp-value">{value ? formatDisplay(value) : 'Pick a date'}</span>
        <span className="cdp-arrow">▾</span>
      </button>

      {open && createPortal(
        <div
          ref={popupRef}
          className="cdp-popup"
          style={popupPos}
        >
          <div className="cdp-manual">
            <input
              ref={manualRef}
              className={`cdp-manual-input ${inputError ? 'error' : ''}`}
              value={manualInput}
              onChange={(e) => { setManualInput(e.target.value); setInputError(false) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyManualInput() }
                if (e.key === 'Escape') { setOpen(false) }
              }}
              placeholder="DD.MM.YYYY"
            />
            <button type="button" className="cdp-manual-apply" onClick={applyManualInput}>✓</button>
          </div>
          {inputError && <p className="cdp-manual-error">Invalid date format</p>}

          <div className="cdp-header">
            <button type="button" className="cdp-nav" onClick={prevMonth}>‹</button>
            <span className="cdp-month-label">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" className="cdp-nav" onClick={nextMonth}>›</button>
          </div>

          <div className="cdp-grid">
            {DAYS.map(d => (
              <span key={d} className="cdp-dayname">{d}</span>
            ))}
            {cells.map((cell, i) => (
              <button
                key={i}
                type="button"
                className={[
                  'cdp-day',
                  cell.month !== 'current' ? 'other' : '',
                  cell.month === 'current' && isSelected(cell.day) ? 'selected' : '',
                  cell.month === 'current' && isToday(cell.day) && !isSelected(cell.day) ? 'today' : '',
                ].join(' ')}
                onClick={() => cell.month === 'current' && selectDay(cell.day)}
              >
                {cell.day}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
