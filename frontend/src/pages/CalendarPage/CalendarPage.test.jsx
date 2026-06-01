import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CalendarPage from './CalendarPage'
import { vi } from 'vitest'
import { deleteCalendarEvent } from '../../api/calendar'

let calendarState = {}

vi.mock('../../hooks/useCalendar', () => ({
  useCalendar: () => calendarState,
}))

vi.mock('../../api/calendar', () => ({
  deleteCalendarEvent: vi.fn().mockResolvedValue({}),
}))

vi.mock('../../utils/icons', () => ({
  Icon: ({ name }) => <span>{name}</span>,
}))

vi.mock('../../components/CustomDatePicker/CustomDatePicker', () => ({ default: () => null }))
vi.mock('../../components/CustomDateTimePicker/CustomDateTimePicker', () => ({ default: () => null }))

const defaultState = {
  connected: false,
  setConnected: vi.fn(),
  events: [],
  loading: false,
  fetchEvents: vi.fn(),
  getAuthUrl: vi.fn(),
  createEvent: vi.fn(),
}

beforeEach(() => {
  calendarState = { ...defaultState, fetchEvents: vi.fn(), getAuthUrl: vi.fn(), createEvent: vi.fn() }
})

function renderPage(url = '/') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <CalendarPage />
    </MemoryRouter>
  )
}

function renderConnected(events = [], url = '/') {
  calendarState = { ...calendarState, connected: true, events }
  return renderPage(url)
}


test('shows Connect Google Calendar button when not connected', () => {
  renderPage()
  expect(screen.getByRole('button', { name: 'Connect Google Calendar' })).toBeInTheDocument()
})

test('shows connect title and description when not connected', () => {
  renderPage()
  expect(screen.getByText(/Link your Google Calendar/)).toBeInTheDocument()
})

test('shows Month, Week and Day view toggle buttons', () => {
  renderPage()
  expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Day' })).toBeInTheDocument()
})

test('shows Today navigation button', () => {
  renderPage()
  expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument()
})

test('shows month navigation arrows', () => {
  renderPage()
  expect(document.querySelectorAll('.cal-nav-btn').length).toBe(2)
})

test('connect button calls getAuthUrl', async () => {
  calendarState.getAuthUrl.mockResolvedValue('http://auth.example.com')
  renderPage()
  fireEvent.click(screen.getByRole('button', { name: 'Connect Google Calendar' }))
  await vi.waitFor(() => expect(calendarState.getAuthUrl).toHaveBeenCalled())
})

test('shows auth error message when error param is in URL', () => {
  renderPage('/?error=1')
  expect(screen.getByText(/Authentication failed/)).toBeInTheDocument()
})


test('shows month grid when connected', () => {
  renderConnected()
  expect(document.querySelector('.cal-month-grid')).toBeInTheDocument()
})

test('shows weekday headers in month view', () => {
  renderConnected()
  expect(screen.getByText('SUN')).toBeInTheDocument()
  expect(screen.getByText('SAT')).toBeInTheDocument()
})

test('shows "New Event" button when connected in month view', () => {
  renderConnected()
  expect(document.querySelector('.cal-new-btn')).toBeInTheDocument()
})

test('does not show "New Event" button when not connected', () => {
  renderPage()
  expect(document.querySelector('.cal-new-btn')).not.toBeInTheDocument()
})

test('navigates to previous month and stays in month view', () => {
  renderConnected()
  fireEvent.click(document.querySelectorAll('.cal-nav-btn')[0])
  expect(document.querySelector('.cal-month-grid')).toBeInTheDocument()
})

test('navigates to next month and stays in month view', () => {
  renderConnected()
  fireEvent.click(document.querySelectorAll('.cal-nav-btn')[1])
  expect(document.querySelector('.cal-month-grid')).toBeInTheDocument()
})

test('Today button resets navigation', () => {
  renderConnected()
  fireEvent.click(document.querySelectorAll('.cal-nav-btn')[0])
  fireEvent.click(document.querySelectorAll('.cal-nav-btn')[0])
  fireEvent.click(screen.getByRole('button', { name: 'Today' }))
  expect(document.querySelector('.cal-month-grid')).toBeInTheDocument()
})

test('month dropdown opens when month button is clicked', () => {
  renderConnected()
  fireEvent.click(document.querySelector('.cal-month-btn'))
  expect(document.querySelector('.cal-month-drop')).toBeInTheDocument()
})

test('month dropdown shows all 12 months', () => {
  renderConnected()
  fireEvent.click(document.querySelector('.cal-month-btn'))
  expect(screen.getByText('January')).toBeInTheDocument()
  expect(screen.getByText('December')).toBeInTheDocument()
})

test('selecting a month from dropdown changes current month', () => {
  renderConnected([], '/?year=2026&month=5&day=1')
  fireEvent.click(document.querySelector('.cal-month-btn'))
  fireEvent.click(screen.getAllByText('March')[0])
  expect(document.querySelector('.cal-month-btn').textContent).toContain('March')
})

test('shows event chip in month view when event matches that month', () => {
  renderConnected(
    [{ id: '1', summary: 'Team Meeting', start: '2026-06-15', colorId: '2' }],
    '/?year=2026&month=5&day=1'
  )
  expect(screen.getByText('Team Meeting')).toBeInTheDocument()
})

test('New Event button opens event creation modal', () => {
  renderConnected()
  fireEvent.click(document.querySelector('.cal-new-btn'))
  expect(screen.getByRole('button', { name: 'Create Event' })).toBeInTheDocument()
})

test('closing new event modal removes it', () => {
  renderConnected()
  fireEvent.click(document.querySelector('.cal-new-btn'))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('button', { name: 'Create Event' })).not.toBeInTheDocument()
})


test('switches to week view', () => {
  renderConnected()
  fireEvent.click(screen.getByRole('button', { name: 'Week' }))
  expect(document.querySelector('.cal-week-wrapper')).toBeInTheDocument()
})

test('week view shows day abbreviations', () => {
  renderConnected()
  fireEvent.click(screen.getByRole('button', { name: 'Week' }))
  const headers = document.querySelectorAll('.cal-wdh-name')
  expect(headers.length).toBe(7)
})

test('week view shows "New Event" button', () => {
  renderConnected()
  fireEvent.click(screen.getByRole('button', { name: 'Week' }))
  expect(document.querySelector('.cal-new-btn')).toBeInTheDocument()
})

test('week view shows timed event block', () => {
  renderConnected(
    [{ id: '1', summary: 'Stand-up', start: '2026-06-01T09:00', end: '2026-06-01T09:30', colorId: '1' }],
    '/?year=2026&month=5&day=1'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Week' }))
  expect(screen.getByText('Stand-up')).toBeInTheDocument()
})


test('switches to day view', () => {
  renderConnected()
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  expect(document.querySelector('.cal-day-view')).toBeInTheDocument()
})

test('day view shows "No events for this day" when empty', () => {
  renderConnected()
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  expect(screen.getByText('No events for this day')).toBeInTheDocument()
})

test('day view shows event title', () => {
  renderConnected(
    [{ id: '1', summary: 'Conference Talk', start: '2026-06-15T14:00', end: '2026-06-15T15:00', colorId: '3' }],
    '/?year=2026&month=5&day=15'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  expect(screen.getByText('Conference Talk')).toBeInTheDocument()
})

test('day view shows all-day event', () => {
  renderConnected(
    [{ id: '2', summary: 'Holiday', start: '2026-06-15', colorId: '5' }],
    '/?year=2026&month=5&day=15'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  expect(screen.getByText('Holiday')).toBeInTheDocument()
  expect(screen.getByText('All day')).toBeInTheDocument()
})

test('day view has "Add Event" button when connected', () => {
  renderConnected()
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  expect(screen.getByText('Add Event')).toBeInTheDocument()
})

test('clicking a month cell switches to day view for that date', () => {
  renderConnected([], '/?year=2026&month=5&day=1')
  const cells = document.querySelectorAll('.cal-day-cell')
  fireEvent.click(cells[10])
  expect(document.querySelector('.cal-day-view')).toBeInTheDocument()
})


test('Enter in year input applies valid year', () => {
  renderConnected([], '/?year=2026&month=5&day=1')
  const yearInput = document.querySelector('.cal-year-input')
  fireEvent.change(yearInput, { target: { value: '2025' } })
  fireEvent.keyDown(yearInput, { key: 'Enter' })
  expect(yearInput.value).toBe('2025')
})

test('blur in year input reverts invalid year', () => {
  renderConnected([], '/?year=2026&month=5&day=1')
  const yearInput = document.querySelector('.cal-year-input')
  fireEvent.change(yearInput, { target: { value: 'abc' } })
  fireEvent.blur(yearInput)
  expect(yearInput.value).toBe('2026')
})


test('EventModal submit calls createEvent', async () => {
  renderConnected()
  fireEvent.click(document.querySelector('.cal-new-btn'))
  const titleInput = document.querySelector('.cal-add-modal input.modal-input')
  fireEvent.change(titleInput, { target: { value: 'Sprint Review' } })
  fireEvent.submit(document.querySelector('.cal-add-modal .modal-form'))
  await waitFor(() =>
    expect(calendarState.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Sprint Review' })
    )
  )
})

test('allDay toggle switches to all-day mode in EventModal', () => {
  renderConnected()
  fireEvent.click(document.querySelector('.cal-new-btn'))
  expect(document.querySelector('.cal-toggle.cal-toggle--on')).not.toBeInTheDocument()
  fireEvent.click(document.querySelector('.cal-toggle'))
  expect(document.querySelector('.cal-toggle.cal-toggle--on')).toBeInTheDocument()
})

test('location field in EventModal is editable', () => {
  renderConnected()
  fireEvent.click(document.querySelector('.cal-new-btn'))
  const locationInput = screen.getByPlaceholderText('Add location')
  fireEvent.change(locationInput, { target: { value: 'Room 101' } })
  expect(locationInput.value).toBe('Room 101')
})

test('Cancel closes EventModal', () => {
  renderConnected()
  fireEvent.click(document.querySelector('.cal-new-btn'))
  expect(screen.getByRole('button', { name: 'Create Event' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('button', { name: 'Create Event' })).not.toBeInTheDocument()
})


test('clicking event in day view opens EventModal in edit mode', () => {
  renderConnected(
    [{ id: '1', summary: 'My Meeting', start: '2026-06-15T10:00', end: '2026-06-15T11:00', colorId: '2' }],
    '/?year=2026&month=5&day=15'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  fireEvent.click(document.querySelector('.cal-day-view-event'))
  expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
})

test('delete button in edit EventModal opens delete confirm modal', () => {
  renderConnected(
    [{ id: '1', summary: 'My Meeting', start: '2026-06-15T10:00', end: '2026-06-15T11:00', colorId: '2' }],
    '/?year=2026&month=5&day=15'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  fireEvent.click(document.querySelector('.cal-day-view-event'))
  fireEvent.click(document.querySelector('.btn-danger'))
  expect(document.querySelector('.delete-modal')).toBeInTheDocument()
})

test('confirm delete calls deleteCalendarEvent', async () => {
  renderConnected(
    [{ id: '42', summary: 'Meeting', start: '2026-06-15T10:00', end: '2026-06-15T11:00', colorId: '2' }],
    '/?year=2026&month=5&day=15'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  fireEvent.click(document.querySelector('.cal-day-view-event'))
  fireEvent.click(document.querySelector('.btn-danger'))
  fireEvent.click(document.querySelector('.delete-modal .btn-danger'))
  await waitFor(() => expect(deleteCalendarEvent).toHaveBeenCalledWith('42'))
})

test('Cancel in delete confirm modal dismisses it', () => {
  renderConnected(
    [{ id: '1', summary: 'Meeting', start: '2026-06-15T10:00', end: '2026-06-15T11:00', colorId: '2' }],
    '/?year=2026&month=5&day=15'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  fireEvent.click(document.querySelector('.cal-day-view-event'))
  fireEvent.click(document.querySelector('.btn-danger'))
  fireEvent.click(document.querySelector('.btn-secondary'))
  expect(document.querySelector('.delete-modal')).not.toBeInTheDocument()
})


test('day view event has delete (✕) button', () => {
  renderConnected(
    [{ id: '1', summary: 'Standup', start: '2026-06-15T09:00', colorId: '1' }],
    '/?year=2026&month=5&day=15'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  expect(document.querySelector('.cal-day-event-delete-btn')).toBeInTheDocument()
})

test('clicking ✕ on day event opens delete confirm directly', () => {
  renderConnected(
    [{ id: '1', summary: 'Standup', start: '2026-06-15T09:00', colorId: '1' }],
    '/?year=2026&month=5&day=15'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  fireEvent.click(document.querySelector('.cal-day-event-delete-btn'))
  expect(document.querySelector('.delete-modal')).toBeInTheDocument()
})


test('week view navigates to previous week', () => {
  renderConnected()
  fireEvent.click(screen.getByRole('button', { name: 'Week' }))
  fireEvent.click(document.querySelectorAll('.cal-nav-btn')[0])
  expect(document.querySelector('.cal-week-wrapper')).toBeInTheDocument()
})

test('day view navigates to next day', () => {
  renderConnected()
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  fireEvent.click(document.querySelectorAll('.cal-nav-btn')[1])
  expect(document.querySelector('.cal-day-view')).toBeInTheDocument()
})

test('clicking Add Event in day view opens new event modal', () => {
  renderConnected()
  fireEvent.click(screen.getByRole('button', { name: 'Day' }))
  fireEvent.click(screen.getByText('Add Event'))
  expect(screen.getByRole('button', { name: 'Create Event' })).toBeInTheDocument()
})

test('week column click opens new event modal', () => {
  renderConnected([], '/?year=2026&month=5&day=1')
  fireEvent.click(screen.getByRole('button', { name: 'Week' }))
  const weekCols = document.querySelectorAll('.cal-week-day-col')
  fireEvent.click(weekCols[0])
  expect(screen.getByRole('button', { name: 'Create Event' })).toBeInTheDocument()
})


test('clicking overlay closes month dropdown', () => {
  renderConnected()
  fireEvent.click(document.querySelector('.cal-month-btn'))
  expect(document.querySelector('.cal-month-drop')).toBeInTheDocument()
  fireEvent.click(document.querySelector('.cal-month-drop-overlay'))
  expect(document.querySelector('.cal-month-drop')).not.toBeInTheDocument()
})
