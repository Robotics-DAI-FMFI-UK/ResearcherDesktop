import { render, screen, fireEvent } from '@testing-library/react'
import MultiSelect from './MultiSelect'
import { vi } from 'vitest'

const keywords = [
  { id: '1', name: 'React' },
  { id: '2', name: 'Java' },
  { id: '3', name: 'Python' },
]

function renderMultiSelect(props = {}) {
  return render(
    <MultiSelect
      allKeywords={keywords}
      selectedIds={[]}
      onChange={vi.fn()}
      {...props}
    />
  )
}

test('renders input with placeholder', () => {
  renderMultiSelect()
  expect(screen.getByPlaceholderText('Add keyword…')).toBeInTheDocument()
})

test('renders custom placeholder', () => {
  renderMultiSelect({ placeholder: 'Search keywords' })
  expect(screen.getByPlaceholderText('Search keywords')).toBeInTheDocument()
})

test('shows selected keywords as chips', () => {
  renderMultiSelect({ selectedIds: ['1'] })
  expect(screen.getByText('React')).toBeInTheDocument()
})

test('shows multiple selected keywords as chips', () => {
  renderMultiSelect({ selectedIds: ['1', '2'] })
  expect(screen.getByText('React')).toBeInTheDocument()
  expect(screen.getByText('Java')).toBeInTheDocument()
})

test('does not show unselected keywords as chips', () => {
  renderMultiSelect({ selectedIds: ['1'] })
  const chips = document.querySelectorAll('.multiselect-chip')
  expect(chips).toHaveLength(1)
})

test('calls onChange when removing a chip', () => {
  const onChange = vi.fn()
  renderMultiSelect({ selectedIds: ['1'], onChange })
  const removeBtn = screen.getByRole('button')
  fireEvent.click(removeBtn)
  expect(onChange).toHaveBeenCalledWith([])
})

test('calls onChange with remaining ids when one chip is removed from multiple', () => {
  const onChange = vi.fn()
  renderMultiSelect({ selectedIds: ['1', '2'], onChange })
  const removeButtons = screen.getAllByRole('button')
  fireEvent.click(removeButtons[0])
  expect(onChange).toHaveBeenCalledWith(['2'])
})

test('shows dropdown options on input focus', () => {
  renderMultiSelect()
  const input = screen.getByPlaceholderText('Add keyword…')
  fireEvent.focus(input)
  expect(screen.getByText('React')).toBeInTheDocument()
  expect(screen.getByText('Java')).toBeInTheDocument()
})

test('filters dropdown options by input text', () => {
  renderMultiSelect()
  const input = screen.getByPlaceholderText('Add keyword…')
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: 'rea' } })
  expect(screen.getByText('React')).toBeInTheDocument()
  expect(screen.queryByText('Java')).not.toBeInTheDocument()
})

test('does not show already-selected keywords in dropdown', () => {
  renderMultiSelect({ selectedIds: ['1'] })
  const input = screen.getByPlaceholderText('Add keyword…')
  fireEvent.focus(input)
  const options = document.querySelectorAll('.multiselect-option')
  const optionNames = [...options].map((o) => o.textContent)
  expect(optionNames).not.toContain('React')
})

test('selects a keyword from dropdown on mousedown', () => {
  const onChange = vi.fn()
  renderMultiSelect({ onChange })
  const input = screen.getByPlaceholderText('Add keyword…')
  fireEvent.focus(input)
  const javaOption = screen.getByText('Java')
  fireEvent.mouseDown(javaOption)
  expect(onChange).toHaveBeenCalledWith(['2'])
})

test('shows create option when onCreateKeyword provided and no match', () => {
  const onCreateKeyword = vi.fn().mockResolvedValue({ id: 'new', name: 'NewTag' })
  renderMultiSelect({ onCreateKeyword })
  const input = screen.getByPlaceholderText('Add keyword…')
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: 'NewTag' } })
  expect(screen.getByText(/create "NewTag"/i)).toBeInTheDocument()
})

test('does not show create option when onCreateKeyword is not provided', () => {
  renderMultiSelect()
  const input = screen.getByPlaceholderText('Add keyword…')
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: 'BrandNew' } })
  expect(screen.queryByText(/create/i)).not.toBeInTheDocument()
})
