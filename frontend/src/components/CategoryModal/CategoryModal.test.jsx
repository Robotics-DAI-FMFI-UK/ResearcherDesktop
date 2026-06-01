import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CategoryModal from './CategoryModal'
import { vi } from 'vitest'

vi.mock('../../utils/icons', () => ({
  Icon: () => null,
  ICON_NAMES: ['folder', 'star', 'calendar'],
}))

vi.mock('../CustomSelect/CustomSelect', () => ({
  default: ({ value, onChange, options }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}))

function renderModal(props = {}) {
  return render(<CategoryModal onSave={vi.fn()} onClose={vi.fn()} {...props} />)
}

test('shows "New Category" title for new modal', () => {
  renderModal()
  expect(screen.getByText('New Category')).toBeInTheDocument()
})

test('shows "Edit Category" title when category provided', () => {
  renderModal({ category: { id: '1', name: 'Papers', description: '', icon: 'folder', fields: [] } })
  expect(screen.getByText('Edit Category')).toBeInTheDocument()
})

test('populates name field from category', () => {
  renderModal({ category: { id: '1', name: 'My Cat', description: '', icon: 'folder', fields: [] } })
  expect(screen.getByDisplayValue('My Cat')).toBeInTheDocument()
})

test('calls onClose when Cancel is clicked', () => {
  const onClose = vi.fn()
  renderModal({ onClose })
  fireEvent.click(screen.getByText('Cancel'))
  expect(onClose).toHaveBeenCalled()
})

test('calls onSave and onClose on valid submit', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  renderModal({ onSave, onClose })
  const inputs = screen.getAllByRole('textbox')
  fireEvent.change(inputs[0], { target: { value: 'New Category' } })
  fireEvent.click(screen.getByText('Save'))
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Category' })))
  expect(onClose).toHaveBeenCalled()
})

test('adds a field editor when "+ Add field" is clicked', () => {
  renderModal()
  fireEvent.click(screen.getByText('+ Add field'))
  expect(screen.getByPlaceholderText('Field name')).toBeInTheDocument()
})

test('removes field when ✕ button is clicked', () => {
  renderModal()
  fireEvent.click(screen.getByText('+ Add field'))
  expect(screen.getByPlaceholderText('Field name')).toBeInTheDocument()
  fireEvent.click(screen.getByTitle('Remove field'))
  expect(screen.queryByPlaceholderText('Field name')).not.toBeInTheDocument()
})

test('shows error message when save fails', async () => {
  const onSave = vi.fn().mockRejectedValue(new Error('fail'))
  renderModal({ onSave })
  const inputs = screen.getAllByRole('textbox')
  fireEvent.change(inputs[0], { target: { value: 'Name' } })
  fireEvent.click(screen.getByText('Save'))
  expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
})
