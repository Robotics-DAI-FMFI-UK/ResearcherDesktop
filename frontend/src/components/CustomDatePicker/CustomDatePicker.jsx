import { useState, useRef, useEffect } from 'react'
import './CustomDatePicker.css'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']

function formatDisplay(date) {
  if (!date) { return '' }
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export default function CustomDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => value ? value.getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? value.getMonth() : new Date().getMonth())
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false) }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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

    for (let i = first - 1; i >= 0; i--) {
      cells.push({ day: daysInPrev - i, month: 'prev' })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: 'current' })
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: cells.length - first - daysInMonth + 1, month: 'next' })
    }
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
    return value
      && value.getFullYear() === viewYear
      && value.getMonth() === viewMonth
      && value.getDate() === day
  }

  function isToday(day) {
    return today.getFullYear() === viewYear
      && today.getMonth() === viewMonth
      && today.getDate() === day
  }

  return (
    <div className="cdp" ref={ref}>
      <button
        type="button"
        className={`cdp-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className="cdp-icon">📅</span>
        <span className="cdp-value">{value ? formatDisplay(value) : 'Pick a date'}</span>
        <span className="cdp-arrow">▾</span>
      </button>

      {open && (
        <div className="cdp-popup">
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
        </div>
      )}
    </div>
  )
}
