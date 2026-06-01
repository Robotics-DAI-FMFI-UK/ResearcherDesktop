import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './CustomDateTimePicker.css'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']
const MINUTES = [0, 15, 30, 45]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function formatDisplay(date) {
  if (!date) return ''
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}  ${h}:${m}`
}

function formatManualInput(date) {
  if (!date) return ''
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${dd}.${mm}.${date.getFullYear()} ${hh}:${min}`
}

function parseManualDateTime(str) {
  const s = str.trim()
  const match = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/)
  if (match) {
    const [, day, month, year, hour, minute] = match.map(Number)
    const d = new Date(year, month - 1, day, hour, minute, 0, 0)
    if (!isNaN(d) && d.getFullYear() === year && d.getMonth() === month - 1 &&
        d.getDate() === day && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return d
    }
  }
  return null
}

export default function CustomDateTimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => value ? value.getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? value.getMonth() : new Date().getMonth())
  const [selectedHour, setSelectedHour] = useState(() => value ? value.getHours() : 9)
  const [selectedMinute, setSelectedMinute] = useState(() => value ? value.getMinutes() : 0)
  const [manualInput, setManualInput] = useState('')
  const [inputError, setInputError] = useState(false)
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 })
  const [dropUp, setDropUp] = useState(false)
  const triggerRef = useRef(null)
  const popupRef = useRef(null)
  const manualRef = useRef(null)

  useEffect(() => {
    if (value) {
      setSelectedHour(value.getHours())
      setSelectedMinute(value.getMinutes())
    }
  }, [value])

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
    const parsed = parseManualDateTime(manualInput)
    if (parsed) {
      onChange(parsed)
      setViewYear(parsed.getFullYear())
      setViewMonth(parsed.getMonth())
      setSelectedHour(parsed.getHours())
      setSelectedMinute(parsed.getMinutes())
      setOpen(false)
      setInputError(false)
    } else {
      setInputError(true)
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function buildDays() {
    const first = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate()
    const cells = []
    for (let i = first - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, month: 'prev' })
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, month: 'current' })
    while (cells.length % 7 !== 0) cells.push({ day: cells.length - first - daysInMonth + 1, month: 'next' })
    return cells
  }

  function selectDay(day) {
    const picked = new Date(viewYear, viewMonth, day, selectedHour, selectedMinute, 0, 0)
    onChange(picked)
  }

  function selectHour(h) {
    setSelectedHour(h)
    const base = value || new Date(viewYear, viewMonth, 1)
    const picked = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, selectedMinute, 0, 0)
    onChange(picked)
  }

  function selectMinute(m) {
    setSelectedMinute(m)
    const base = value || new Date(viewYear, viewMonth, 1)
    const picked = new Date(base.getFullYear(), base.getMonth(), base.getDate(), selectedHour, m, 0, 0)
    onChange(picked)
    setOpen(false)
  }

  function isSelected(day) {
    return value && value.getFullYear() === viewYear && value.getMonth() === viewMonth && value.getDate() === day
  }

  function isToday(day) {
    const t = new Date()
    return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === day
  }

  const cells = buildDays()

  return (
    <div className="cdtp" ref={triggerRef}>
      <button type="button" className={`cdtp-trigger ${open ? 'open' : ''}`} onClick={handleToggle}>
        <span className="cdtp-icon">📅</span>
        <span className="cdtp-value">{value ? formatDisplay(value) : 'Pick date & time'}</span>
        <span className="cdtp-arrow">▾</span>
      </button>

      {open && createPortal(
        <div
          ref={popupRef}
          className="cdtp-popup"
          style={popupPos}
        >
          <div className="cdtp-manual">
            <input
              ref={manualRef}
              className={`cdtp-manual-input ${inputError ? 'error' : ''}`}
              value={manualInput}
              onChange={e => { setManualInput(e.target.value); setInputError(false) }}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); applyManualInput() }
                if (e.key === 'Escape') setOpen(false)
              }}
              placeholder="DD.MM.YYYY HH:MM"
            />
            <button type="button" className="cdtp-manual-apply" onClick={applyManualInput}>✓</button>
          </div>
          {inputError && <p className="cdtp-manual-error">Invalid format. Use DD.MM.YYYY HH:MM</p>}

          <div className="cdtp-header">
            <button type="button" className="cdtp-nav" onClick={prevMonth}>‹</button>
            <span className="cdtp-month-label">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" className="cdtp-nav" onClick={nextMonth}>›</button>
          </div>

          <div className="cdtp-grid">
            {DAYS.map(d => <span key={d} className="cdtp-dayname">{d}</span>)}
            {cells.map((cell, i) => (
              <button key={i} type="button"
                className={[
                  'cdtp-day',
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

          <div className="cdtp-time-section">
            <div className="cdtp-time-label">Hour</div>
            <div className="cdtp-hours-grid">
              {HOURS.map(h => (
                <button key={h} type="button"
                  className={`cdtp-time-btn${selectedHour === h ? ' selected' : ''}`}
                  onClick={() => selectHour(h)}
                >
                  {String(h).padStart(2, '0')}
                </button>
              ))}
            </div>
            <div className="cdtp-time-label">Minute</div>
            <div className="cdtp-minutes-row">
              {MINUTES.map(m => (
                <button key={m} type="button"
                  className={`cdtp-time-btn cdtp-time-btn--wide${selectedMinute === m ? ' selected' : ''}`}
                  onClick={() => selectMinute(m)}
                >
                  :{String(m).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
