import { render, screen, fireEvent } from '@testing-library/react'
import CustomDateTimePicker from './CustomDateTimePicker'
import { vi } from 'vitest'

test('shows placeholder when no value', () => {
  render(<CustomDateTimePicker value={null} onChange={vi.fn()} />)
  expect(screen.getByText('Pick date & time')).toBeInTheDocument()
})

test('shows formatted date when value is provided', () => {
  const date = new Date(2024, 2, 15, 10, 30)
  render(<CustomDateTimePicker value={date} onChange={vi.fn()} />)
  expect(screen.getByText(/March 15, 2024/)).toBeInTheDocument()
})

test('opens popup when trigger is clicked', () => {
  render(<CustomDateTimePicker value={null} onChange={vi.fn()} />)
  fireEvent.click(document.querySelector('.cdtp-trigger'))
  expect(screen.getByPlaceholderText('DD.MM.YYYY HH:MM')).toBeInTheDocument()
})

test('shows month and year in calendar header', () => {
  const date = new Date(2024, 0, 15, 9, 0)
  render(<CustomDateTimePicker value={date} onChange={vi.fn()} />)
  fireEvent.click(document.querySelector('.cdtp-trigger'))
  expect(screen.getByText(/January 2024/)).toBeInTheDocument()
})

test('navigates to next month', () => {
  const date = new Date(2024, 0, 15, 9, 0)
  render(<CustomDateTimePicker value={date} onChange={vi.fn()} />)
  fireEvent.click(document.querySelector('.cdtp-trigger'))
  fireEvent.click(screen.getByText('›'))
  expect(screen.getByText(/February 2024/)).toBeInTheDocument()
})

test('navigates to previous month', () => {
  const date = new Date(2024, 2, 15, 9, 0)
  render(<CustomDateTimePicker value={date} onChange={vi.fn()} />)
  fireEvent.click(document.querySelector('.cdtp-trigger'))
  fireEvent.click(screen.getByText('‹'))
  expect(screen.getByText(/February 2024/)).toBeInTheDocument()
})

test('shows error for invalid manual input', () => {
  render(<CustomDateTimePicker value={null} onChange={vi.fn()} />)
  fireEvent.click(document.querySelector('.cdtp-trigger'))
  const input = screen.getByPlaceholderText('DD.MM.YYYY HH:MM')
  fireEvent.change(input, { target: { value: 'not-a-date' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(screen.getByText(/Invalid format/)).toBeInTheDocument()
})

test('calls onChange with valid manual input', () => {
  const onChange = vi.fn()
  render(<CustomDateTimePicker value={null} onChange={onChange} />)
  fireEvent.click(document.querySelector('.cdtp-trigger'))
  const input = screen.getByPlaceholderText('DD.MM.YYYY HH:MM')
  fireEvent.change(input, { target: { value: '15.03.2024 10:00' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(onChange).toHaveBeenCalledWith(expect.any(Date))
})
