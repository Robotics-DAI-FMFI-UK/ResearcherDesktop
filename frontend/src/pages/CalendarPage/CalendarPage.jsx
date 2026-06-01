import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { useCalendar } from '../../hooks/useCalendar'
import { Icon } from '../../utils/icons'
import CustomDatePicker from '../../components/CustomDatePicker/CustomDatePicker'
import CustomDateTimePicker from '../../components/CustomDateTimePicker/CustomDateTimePicker'
import '../../components/CategoryModal/CategoryModal.css'
import './CalendarPage.css'
import { deleteCalendarEvent } from '../../api/calendar'

const HOUR_HEIGHT = 56
const START_HOUR = 4
const HOUR_SLOTS = Array.from({ length: 24 }, (_, i) => (START_HOUR + i) % 24)
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const COLOR_MAP = {
  '1': { bg: '#EEF0FF', color: '#4A5CF2' },
  '2': { bg: '#E8F5F0', color: '#2B8A6E' },
  '3': { bg: '#F6ECF2', color: '#6E2E5C' },
  '4': { bg: '#FDE8EF', color: '#C94070' },
  '5': { bg: '#FDF5E0', color: '#B07A10' },
  '6': { bg: '#FEF0E0', color: '#C05E15' },
  '7': { bg: '#E0F0FF', color: '#1A7AB0' },
  '8': { bg: '#EAE6FF', color: '#3730A3' },
  '9': { bg: '#E6F4EC', color: '#1A6B3A' },
  '10': { bg: '#FFE6E9', color: '#B02B3A' },
}
const COLOR_OPTIONS = [3, 2, 7, 5, 10]

function getColor(colorId) {
  return COLOR_MAP[String(colorId)] || { bg: '#E8F5F0', color: '#2B8A6E' }
}

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toLocalDT(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatTime(dateStr) {
  if (!dateStr || !dateStr.includes('T')) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return '' }
}

function formatHourLabel(h) {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function isToday(date) {
  const t = new Date()
  return date.getFullYear() === t.getFullYear() && date.getMonth() === t.getMonth() && date.getDate() === t.getDate()
}

function isAllDayEvent(event) {
  return event.start && !event.start.includes('T')
}

function getMonthDays(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const start = new Date(firstDay)
  start.setDate(start.getDate() - start.getDay())
  const days = []
  const cur = new Date(start)
  while (cur <= lastDay || cur.getDay() !== 0 || days.length < 35) {
    days.push({ date: new Date(cur), isCurrentMonth: cur.getMonth() === month })
    cur.setDate(cur.getDate() + 1)
    if (days.length >= 42) break
  }
  return days
}

function getWeekDays(date) {
  const sunday = new Date(date)
  sunday.setDate(sunday.getDate() - sunday.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(d.getDate() + i)
    return d
  })
}

function eventTop(event) {
  try {
    const d = new Date(event.start)
    let h = d.getHours()
    if (h < START_HOUR) h += 24
    return Math.max(0, (h + d.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT)
  } catch { return 0 }
}

function eventHeight(event) {
  try {
    const start = new Date(event.start)
    const end = new Date(event.end || event.start)
    return Math.max(22, ((end - start) / 3600000) * HOUR_HEIGHT)
  } catch { return HOUR_HEIGHT }
}

function DayView({ date, events, onAddEvent, onEventClick, onDeleteEvent }) {
  const dayName = DAYS_LONG[date.getDay()]
  const monthName = MONTHS[date.getMonth()]
  const sorted = [...events].sort((a, b) => {
    if (isAllDayEvent(a) && !isAllDayEvent(b)) return -1
    if (!isAllDayEvent(a) && isAllDayEvent(b)) return 1
    return (a.start || '').localeCompare(b.start || '')
  })

  return (
    <div className="cal-day-view">
      <div className="cal-day-view-header">
        <span className="cal-day-view-title">
          {dayName}, {monthName} {date.getDate()}, {date.getFullYear()}
        </span>
        {onAddEvent && (
          <button className="cal-new-btn" onClick={onAddEvent} style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
            <Icon name="plus" size={13} /> Add Event
          </button>
        )}
      </div>
      <div className="cal-day-view-list">
        {sorted.length === 0 ? (
          <div className="cal-day-view-empty">No events for this day</div>
        ) : sorted.map((e, i) => {
          const c = getColor(e.colorId)
          return (
            <div key={i} className="cal-day-view-event" style={{ borderLeftColor: c.color, background: c.bg, cursor: onEventClick ? 'pointer' : 'default' }}
              onClick={() => onEventClick && onEventClick(e)}
            >
              <span className="cal-day-view-time">
                {isAllDayEvent(e) ? 'All day' : `${formatTime(e.start)}${e.end ? `–${formatTime(e.end)}` : ''}`}
              </span>
              <div className="cal-day-view-event-body" style={{ flex: 1, minWidth: 0 }}>
                <div className="cal-day-view-event-title" style={{ color: c.color }}>{e.summary || '(no title)'}</div>
                {e.description && <div className="cal-day-view-event-desc">{e.description}</div>}
                {e.location && <div className="cal-day-view-event-loc">{e.location}</div>}
              </div>
              {onDeleteEvent && (
                <button className="cal-day-event-delete-btn" title="Delete event"
                  onClick={ev => { ev.stopPropagation(); onDeleteEvent(e) }}
                >✕</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function parseEventDate(str) {
  if (!str) return new Date()
  const s = (str && typeof str === 'object') ? (str.dateTime || str.date || '') : str
  return new Date(s.includes('T') ? s : s + 'T00:00:00')
}

function EventModal({ event, initialDate, onSave, onDelete, onClose }) {
  const isEdit = !!event
  const editAllDay = isEdit ? isAllDayEvent(event) : false
  const parsedStart = isEdit ? parseEventDate(event.start) : null
  const parsedEnd = isEdit ? parseEventDate(event.end) : null

  const initDate = initialDate || (isEdit ? parsedStart : new Date())
  const initHour = new Date(initDate)
  if (!isEdit) initHour.setHours(9, 0, 0, 0)

  const [summary, setSummary] = useState(isEdit ? (event.summary || '') : '')
  const [allDay, setAllDay] = useState(editAllDay)
  const [startDT, setStartDT] = useState(() => isEdit && !editAllDay ? parsedStart : (() => { const d = new Date(initHour); return d })())
  const [endDT, setEndDT] = useState(() => isEdit && !editAllDay ? parsedEnd : (() => { const d = new Date(initHour); d.setHours(10); return d })())
  const [startDate, setStartDate] = useState(isEdit && editAllDay ? parsedStart : initDate)
  const [endDate, setEndDate] = useState(isEdit && editAllDay ? parsedEnd : initDate)
  const [location, setLocation] = useState(isEdit ? (event.location || '') : '')
  const [colorId, setColorId] = useState(isEdit ? (Number(event.colorId) || 3) : 3)
  const [description, setDescription] = useState(isEdit ? (event.description || '') : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!summary.trim()) return
    setLoading(true)
    setError('')
    try {
      const payload = {
        summary: summary.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        colorId,
        allDay,
      }
      if (allDay) {
        payload.startDateTime = toDateStr(startDate)
        payload.endDateTime = endDate ? toDateStr(endDate) : toDateStr(startDate)
      } else {
        payload.startDateTime = toLocalDT(startDT) + ':00Z'
        payload.endDateTime = endDT ? toLocalDT(endDT) + ':00Z' : undefined
      }
      if (isEdit) await deleteCalendarEvent(event.id)
      await onSave(payload)
      onClose()
    } catch {
      setError(isEdit ? 'Failed to save event.' : 'Failed to create event.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="modal-overlay">
      <div className="modal cal-add-modal">
        <h2 className="modal-title">{isEdit ? 'Edit Event' : 'New Event'}</h2>
        {error && <p className="modal-error">{error}</p>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">Title</label>
            <input className="modal-input" value={summary} onChange={e => setSummary(e.target.value)} autoFocus required />
          </div>

          <div className="cal-allday-toggle-row">
            <Icon name="clock" size={13} />
            <span className="modal-label" style={{ margin: 0 }}>All-day</span>
            <button type="button" className={`cal-toggle ${allDay ? 'cal-toggle--on' : ''}`} onClick={() => setAllDay(v => !v)}>
              <span className="cal-toggle-thumb" />
            </button>
          </div>

          <div className="cal-datetime-row">
            <div className="modal-field">
              <label className="modal-label">Start</label>
              {allDay
                ? <CustomDatePicker value={startDate} onChange={setStartDate} />
                : <CustomDateTimePicker value={startDT} onChange={setStartDT} />
              }
            </div>
            <div className="modal-field">
              <label className="modal-label">End <span className="modal-label-optional">(optional)</span></label>
              {allDay
                ? <CustomDatePicker value={endDate} onChange={setEndDate} />
                : <CustomDateTimePicker value={endDT} onChange={setEndDT} />
              }
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Location <span className="modal-label-optional">(optional)</span></label>
            <input className="modal-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Add location" />
          </div>

          <div className="modal-field">
            <label className="modal-label">Color</label>
            <div className="cal-color-picker">
              {COLOR_OPTIONS.map(id => {
                const c = getColor(id)
                return (
                  <button key={id} type="button"
                    className={`cal-color-dot ${colorId === id ? 'cal-color-dot--selected' : ''}`}
                    style={{ background: c.color }}
                    onClick={() => setColorId(id)}
                  />
                )
              })}
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Description <span className="modal-label-optional">(optional)</span></label>
            <textarea className="modal-input modal-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="modal-actions">
            {isEdit && (
              <button type="button" className="btn-danger" style={{ marginRight: 'auto' }}
                onClick={() => onDelete(event.id)}>Delete</button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '…' : isEdit ? 'Save' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { connected, setConnected, events, loading, fetchEvents, getAuthUrl, createEvent } = useCalendar()
  const [view, setView] = useState(() => searchParams.get('view') || 'month')
  const [currentDate, setCurrentDate] = useState(() => {
    const y = parseInt(searchParams.get('year')) || new Date().getFullYear()
    const m = parseInt(searchParams.get('month')) || new Date().getMonth()
    const d = parseInt(searchParams.get('day')) || 1
    return new Date(y, m, d)
  })
  const [newEventOpen, setNewEventOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [authError, setAuthError] = useState(false)
  const [monthDropOpen, setMonthDropOpen] = useState(false)
  const [yearInput, setYearInput] = useState(() => new Date().getFullYear().toString())
  const [viewingEvent, setViewingEvent] = useState(null)
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState(null)
  const monthBtnRef = useRef(null)

  useEffect(() => {
    setYearInput(currentDate.getFullYear().toString())
  }, [currentDate])

  useEffect(() => {
    if (searchParams.get('error')) setAuthError(true)
  }, [])

  useEffect(() => {
    setSearchParams(
      { view, year: currentDate.getFullYear(), month: currentDate.getMonth(), day: currentDate.getDate() },
      { replace: true }
    )
  }, [view, currentDate])

  useEffect(() => {
    if (!connected) return
    const y = currentDate.getFullYear(), m = currentDate.getMonth()
    let from, to
    if (view === 'month') {
      from = new Date(y, m - 1, 20).toISOString()
      to = new Date(y, m + 2, 10).toISOString()
    } else if (view === 'week') {
      const week = getWeekDays(currentDate)
      from = week[0].toISOString()
      const last = new Date(week[6]); last.setDate(last.getDate() + 1)
      to = last.toISOString()
    } else {
      from = new Date(y, m, currentDate.getDate()).toISOString()
      to = new Date(y, m, currentDate.getDate() + 1).toISOString()
    }
    fetchEvents({ from, to })
  }, [currentDate, view, connected])

  async function handleConnect() {
    try {
      const authUrl = await getAuthUrl()
      window.location.href = authUrl
    } catch {}
  }

  function refetchCurrentView() {
    const y = currentDate.getFullYear(), m = currentDate.getMonth()
    let from, to
    if (view === 'month') {
      from = new Date(y, m - 1, 20).toISOString()
      to = new Date(y, m + 2, 10).toISOString()
    } else if (view === 'week') {
      const week = getWeekDays(currentDate)
      from = week[0].toISOString()
      const last = new Date(week[6]); last.setDate(last.getDate() + 1)
      to = last.toISOString()
    } else {
      from = new Date(y, m, currentDate.getDate()).toISOString()
      to = new Date(y, m, currentDate.getDate() + 1).toISOString()
    }
    fetchEvents({ from, to })
  }

  async function handleCreateEvent(payload) {
    await createEvent(payload)
    refetchCurrentView()
  }

  async function handleDeleteEvent(eventId) {
    await deleteCalendarEvent(eventId)
    setViewingEvent(null)
    setDeleteConfirmEvent(null)
    refetchCurrentView()
  }

  function navigate(dir) {
    const d = new Date(currentDate)
    if (view === 'month') { d.setDate(1); d.setMonth(d.getMonth() + dir) }
    else if (view === 'week') { d.setDate(d.getDate() + dir * 7) }
    else { d.setDate(d.getDate() + dir) }
    setCurrentDate(d)
  }

  function openNewEvent(date) {
    setSelectedDate(date || null)
    setNewEventOpen(true)
  }

  function getEventsForDay(date) {
    const ds = toDateStr(date)
    return events.filter(e => {
      const start = (e.start || '').slice(0, 10)
      if (!start) return false
      if (isAllDayEvent(e)) {
        const end = (e.end || '').slice(0, 10)
        return ds >= start && (end ? ds < end : ds === start)
      }
      return start === ds
    })
  }

  function applyYear() {
    if (/^\d{4}$/.test(yearInput)) {
      const y = parseInt(yearInput)
      setCurrentDate(new Date(y, currentDate.getMonth(), 1))
    } else {
      setYearInput(currentDate.getFullYear().toString())
    }
  }

  const monthDays = getMonthDays(currentDate)
  const weekDays = getWeekDays(currentDate)

  function getMonthDropPos() {
    if (!monthBtnRef.current) return {}
    const r = monthBtnRef.current.getBoundingClientRect()
    return { top: r.bottom + 4, left: r.left }
  }

  return (
    <div className="calendar-page">
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <input
            className="cal-year-input"
            value={yearInput}
            onChange={e => setYearInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyYear() } }}
            onBlur={() => setYearInput(currentDate.getFullYear().toString())}
            maxLength={4}
          />
          <button ref={monthBtnRef} className="cal-month-btn" onClick={() => setMonthDropOpen(v => !v)}>
            {MONTHS[currentDate.getMonth()]}
            <span className="cal-month-btn-arrow">▾</span>
          </button>
          {monthDropOpen && createPortal(
            <>
              <div className="cal-month-drop-overlay" onClick={() => setMonthDropOpen(false)} />
              <div className="cal-month-drop" style={getMonthDropPos()}>
                {MONTHS.map((m, i) => (
                  <button key={i}
                    className={`cal-month-drop-item${i === currentDate.getMonth() ? ' active' : ''}`}
                    onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), i, 1)); setMonthDropOpen(false) }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>,
            document.body
          )}
          <button className="cal-nav-btn" onClick={() => navigate(-1)}><Icon name="chevron-left" size={16} /></button>
          <button className="cal-nav-btn" onClick={() => navigate(1)}><Icon name="chevron-right" size={16} /></button>
          <button className="cal-today-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
        </div>
        <div className="cal-toolbar-right">
          <div className="cal-view-toggle">
            <button className={`cal-view-btn ${view === 'month' ? 'cal-view-btn--active' : ''}`} onClick={() => setView('month')}>Month</button>
            <button className={`cal-view-btn ${view === 'week' ? 'cal-view-btn--active' : ''}`} onClick={() => setView('week')}>Week</button>
            <button className={`cal-view-btn ${view === 'day' ? 'cal-view-btn--active' : ''}`} onClick={() => setView('day')}>Day</button>
          </div>
          {connected && view !== 'day' && (
            <button className="cal-new-btn" onClick={() => openNewEvent(null)}>
              <Icon name="plus" size={14} /> New Event
            </button>
          )}
        </div>
      </div>

      {authError && <p className="calendar-error">Authentication failed. Please try connecting again.</p>}

      {connected === false ? (
        <div className="calendar-connect">
          <div className="calendar-connect-icon"><Icon name="calendar" size={48} /></div>
          <h2 className="calendar-connect-title">Connect Google Calendar</h2>
          <p className="calendar-connect-desc">Link your Google Calendar to view and create events directly from ResearchDesk.</p>
          <button className="calendar-connect-btn" onClick={handleConnect}>Connect Google Calendar</button>
        </div>
      ) : view === 'day' ? (
        <DayView
          date={currentDate}
          events={getEventsForDay(currentDate)}
          onAddEvent={connected ? () => openNewEvent(currentDate) : undefined}
          onEventClick={setViewingEvent}
          onDeleteEvent={e => setDeleteConfirmEvent(e)}
        />
      ) : view === 'month' ? (
        <div className="cal-month-grid">
          {WEEKDAYS.map(d => <div key={d} className="cal-weekday-header">{d}</div>)}
          {monthDays.map(({ date, isCurrentMonth }, idx) => {
            const dayEvents = getEventsForDay(date)
            const today = isToday(date)
            return (
              <div key={idx}
                className={`cal-day-cell${!isCurrentMonth ? ' cal-day-cell--other' : ''}`}
                onClick={() => { setCurrentDate(date); setView('day') }}
              >
                <span className={`cal-day-num${today ? ' cal-day-num--today' : ''}`}>{date.getDate()}</span>
                {dayEvents.slice(0, 3).map((e, i) => {
                  const c = getColor(e.colorId)
                  return (
                    <div key={i} className="cal-event-chip"
                      style={{ background: c.bg, color: c.color }}
                      onClick={ev => { ev.stopPropagation(); setCurrentDate(date); setView('day') }}
                    >
                      {!isAllDayEvent(e) && <span className="cal-chip-time">{formatTime(e.start)}</span>}
                      {' '}{e.summary || '(no title)'}
                    </div>
                  )
                })}
                {dayEvents.length > 3 && <div className="cal-day-more">+{dayEvents.length - 3} more</div>}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="cal-week-wrapper">
          <div className="cal-week-header-row">
            <div className="cal-time-gutter" />
            {weekDays.map((d, i) => (
              <div key={i} className="cal-week-day-header" style={{ cursor: 'pointer' }}
                onClick={() => { setCurrentDate(d); setView('day') }}
              >
                <span className="cal-wdh-name">{WEEKDAYS[i]}</span>
                <span className={`cal-wdh-num${isToday(d) ? ' cal-day-num--today' : ''}`}>{d.getDate()}</span>
              </div>
            ))}
          </div>
          <div className="cal-allday-row-strip">
            <div className="cal-time-gutter cal-allday-label">ALL-DAY</div>
            {weekDays.map((d, i) => {
              const allDayEvs = getEventsForDay(d).filter(isAllDayEvent)
              return (
                <div key={i} className="cal-allday-cell">
                  {allDayEvs.map((e, j) => {
                    const c = getColor(e.colorId)
                    return <div key={j} className="cal-event-chip" style={{ background: c.bg, color: c.color, borderLeft: `3px solid ${c.color}` }}>{e.summary}</div>
                  })}
                </div>
              )
            })}
          </div>
          <div className="cal-week-body">
            <div className="cal-time-col">
              {HOUR_SLOTS.map(h => (
                <div key={h} className="cal-hour-slot">
                  <span className="cal-hour-label">{formatHourLabel(h)}</span>
                </div>
              ))}
            </div>
            {weekDays.map((d, i) => {
              const timedEvs = getEventsForDay(d).filter(e => !isAllDayEvent(e))
              return (
                <div key={i} className="cal-week-day-col" onClick={() => openNewEvent(d)}>
                  {HOUR_SLOTS.map(h => <div key={h} className="cal-hour-line" />)}
                  {timedEvs.map((e, j) => {
                    const c = getColor(e.colorId)
                    return (
                      <div key={j} className="cal-week-event"
                        style={{ top: eventTop(e), height: eventHeight(e), background: c.bg, color: c.color, borderLeftColor: c.color }}
                        onClick={ev => ev.stopPropagation()}
                      >
                        <span className="cal-week-event-title">{e.summary || '(no title)'}</span>
                        <span className="cal-week-event-time">{formatTime(e.start)}{e.end ? `–${formatTime(e.end)}` : ''}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {newEventOpen && (
        <EventModal
          initialDate={selectedDate}
          onSave={handleCreateEvent}
          onClose={() => { setNewEventOpen(false); setSelectedDate(null) }}
        />
      )}

      {viewingEvent && (
        <EventModal
          event={viewingEvent}
          onSave={handleCreateEvent}
          onDelete={id => { setDeleteConfirmEvent(viewingEvent); setViewingEvent(null) }}
          onClose={() => setViewingEvent(null)}
        />
      )}

      {deleteConfirmEvent && createPortal(
        <div className="delete-modal-backdrop" onClick={() => setDeleteConfirmEvent(null)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <p className="delete-modal-text">
              Delete <strong>{deleteConfirmEvent.summary || '(no title)'}</strong>?
            </p>
            <div className="delete-modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirmEvent(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDeleteEvent(deleteConfirmEvent.id)}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
