import { render, screen, fireEvent } from '@testing-library/react'
import CustomSelect from './CustomSelect'
import { vi } from 'vitest'

const options = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
]

function renderSelect(props = {}) {
  return render(
    <CustomSelect options={options} value="" onChange={vi.fn()} placeholder="Select…" {...props} />
  )
}

test('shows placeholder when no value matches', () => {
  renderSelect()
  expect(screen.getByText('Select…')).toBeInTheDocument()
})

test('shows selected option label', () => {
  renderSelect({ value: 'number' })
  expect(screen.getByText('Number')).toBeInTheDocument()
})

test('opens dropdown on trigger click', () => {
  renderSelect()
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('Text')).toBeInTheDocument()
  expect(screen.getByText('Number')).toBeInTheDocument()
  expect(screen.getByText('Date')).toBeInTheDocument()
})

test('calls onChange with selected value', () => {
  const onChange = vi.fn()
  renderSelect({ onChange })
  fireEvent.click(screen.getByRole('button'))
  fireEvent.click(screen.getByText('Text'))
  expect(onChange).toHaveBeenCalledWith('text')
})

test('closes dropdown after selection', () => {
  renderSelect()
  fireEvent.click(screen.getByRole('button'))
  fireEvent.click(screen.getByText('Text'))
  expect(screen.queryByText('Number')).not.toBeInTheDocument()
})

test('marks the selected option with a checkmark', () => {
  renderSelect({ value: 'date' })
  fireEvent.click(screen.getByRole('button'))
  const checks = document.querySelectorAll('.cselect-check')
  const ticked = [...checks].find((el) => el.textContent === '✓')
  expect(ticked).toBeTruthy()
})
