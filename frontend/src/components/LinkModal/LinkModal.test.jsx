import { render, screen, fireEvent } from '@testing-library/react'
import LinkModal from './LinkModal'
import { vi } from 'vitest'

vi.mock('../../hooks/useItems', () => ({
  useItems: () => ({
    addRelation: vi.fn().mockResolvedValue({}),
    removeRelation: vi.fn().mockResolvedValue({}),
  }),
}))

const currentItem = { id: '1', title: 'Current', relatedItems: [] }
const allItems = [
  { id: '2', title: 'Paper One', categoryName: 'Papers', date: '2024-01-01' },
  { id: '3', title: 'Note Two', categoryName: 'Notes', date: '2024-02-01' },
]

function renderModal(props = {}) {
  return render(
    <LinkModal
      open={true}
      onClose={vi.fn()}
      currentItem={currentItem}
      allItems={allItems}
      onUpdated={vi.fn()}
      {...props}
    />
  )
}

test('returns nothing when open is false', () => {
  const { container } = render(
    <LinkModal open={false} onClose={vi.fn()} currentItem={currentItem} allItems={allItems} onUpdated={vi.fn()} />
  )
  expect(container).toBeEmptyDOMElement()
})

test('renders all items except the current one', () => {
  renderModal()
  expect(screen.getByText('Paper One')).toBeInTheDocument()
  expect(screen.getByText('Note Two')).toBeInTheDocument()
})

test('filters items by title search', () => {
  renderModal()
  fireEvent.change(screen.getByPlaceholderText('Search data…'), { target: { value: 'Paper' } })
  expect(screen.getByText('Paper One')).toBeInTheDocument()
  expect(screen.queryByText('Note Two')).not.toBeInTheDocument()
})

test('filters items by category search', () => {
  renderModal()
  fireEvent.change(screen.getByPlaceholderText('Search data…'), { target: { value: 'Notes' } })
  expect(screen.getByText('Note Two')).toBeInTheDocument()
  expect(screen.queryByText('Paper One')).not.toBeInTheDocument()
})

test('shows + icon for unlinked items', () => {
  renderModal()
  const icons = document.querySelectorAll('.link-modal-item-icon')
  expect([...icons].every((el) => el.textContent === '+')).toBe(true)
})

test('shows ✓ icon for already linked items', () => {
  renderModal({ currentItem: { ...currentItem, relatedItems: [{ id: '2' }] } })
  const linked = document.querySelector('.link-modal-item-icon.linked')
  expect(linked.textContent).toBe('✓')
})

test('shows empty state when search yields no results', () => {
  renderModal()
  fireEvent.change(screen.getByPlaceholderText('Search data…'), { target: { value: 'xyzabc' } })
  expect(screen.getByText('No matching data found.')).toBeInTheDocument()
})

test('calls onClose when Done is clicked', () => {
  const onClose = vi.fn()
  renderModal({ onClose })
  fireEvent.click(screen.getByText('Done'))
  expect(onClose).toHaveBeenCalled()
})
