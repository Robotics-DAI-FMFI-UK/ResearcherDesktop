import { render, screen, fireEvent } from '@testing-library/react'
import CustomDatePicker from './CustomDatePicker'
import { vi } from 'vitest'

test('renders "Pick a date" placeholder when no value', () => {
  render(<CustomDatePicker value={null} onChange={vi.fn()} />)
  expect(screen.getByText('Pick a date')).toBeInTheDocument()
})

test('renders formatted date when value is provided', () => {
  const date = new Date(2024, 0, 15)
  render(<CustomDatePicker value={date} onChange={vi.fn()} />)
  expect(screen.getByText('January 15, 2024')).toBeInTheDocument()
})

test('renders trigger button', () => {
  render(<CustomDatePicker value={null} onChange={vi.fn()} />)
  expect(screen.getByRole('button')).toBeInTheDocument()
})

test('opens calendar popup on button click', () => {
  const date = new Date(2024, 0, 15)
  render(<CustomDatePicker value={date} onChange={vi.fn()} />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('January 2024')).toBeInTheDocument()
})

test('shows day numbers in calendar when open', () => {
  const date = new Date(2024, 0, 15)
  render(<CustomDatePicker value={date} onChange={vi.fn()} />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('15')).toBeInTheDocument()
})

test('shows manual input field when calendar is open', () => {
  const date = new Date(2024, 0, 15)
  render(<CustomDatePicker value={date} onChange={vi.fn()} />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByPlaceholderText('DD.MM.YYYY')).toBeInTheDocument()
})

test('calls onChange when a day is selected', () => {
  const onChange = vi.fn()
  const date = new Date(2024, 0, 15)
  render(<CustomDatePicker value={date} onChange={onChange} />)
  fireEvent.click(screen.getByRole('button'))
  const dayButtons = screen.getAllByRole('button')
  const day20 = dayButtons.find((btn) => btn.textContent === '20' && !btn.classList.contains('other'))
  fireEvent.click(day20)
  expect(onChange).toHaveBeenCalledWith(new Date(2024, 0, 20))
})

test('navigates to previous month', () => {
  const date = new Date(2024, 0, 15)
  render(<CustomDatePicker value={date} onChange={vi.fn()} />)
  fireEvent.click(screen.getByRole('button'))
  const navButtons = screen.getAllByRole('button')
  const prevBtn = navButtons.find((btn) => btn.textContent === '‹')
  fireEvent.click(prevBtn)
  expect(screen.getByText('December 2023')).toBeInTheDocument()
})

test('navigates to next month', () => {
  const date = new Date(2024, 0, 15)
  render(<CustomDatePicker value={date} onChange={vi.fn()} />)
  fireEvent.click(screen.getByRole('button'))
  const navButtons = screen.getAllByRole('button')
  const nextBtn = navButtons.find((btn) => btn.textContent === '›')
  fireEvent.click(nextBtn)
  expect(screen.getByText('February 2024')).toBeInTheDocument()
})

test('shows invalid date error for bad manual input', () => {
  render(<CustomDatePicker value={new Date(2024, 0, 15)} onChange={vi.fn()} />)
  fireEvent.click(screen.getByRole('button'))
  const manualInput = screen.getByPlaceholderText('DD.MM.YYYY')
  fireEvent.change(manualInput, { target: { value: 'not-a-date' } })
  fireEvent.click(screen.getByText('✓'))
  expect(screen.getByText('Invalid date format')).toBeInTheDocument()
})
