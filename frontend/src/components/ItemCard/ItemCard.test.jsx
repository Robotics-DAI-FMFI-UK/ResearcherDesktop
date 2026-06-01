import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ItemCard from './ItemCard'
import { vi } from 'vitest'

vi.mock('../../api/items', () => ({
  getItems: vi.fn().mockResolvedValue({ data: [] }),
  getItem: vi.fn().mockResolvedValue({ data: {} }),
  createItem: vi.fn().mockResolvedValue({ data: {} }),
  updateItem: vi.fn().mockResolvedValue({ data: {} }),
  deleteItem: vi.fn().mockResolvedValue({}),
  uploadImage: vi.fn().mockResolvedValue({}),
  addFile: vi.fn().mockResolvedValue({}),
  deleteFile: vi.fn().mockResolvedValue({}),
  getFile: vi.fn().mockRejectedValue(new Error('no image')),
  addRelation: vi.fn().mockResolvedValue({}),
  removeRelation: vi.fn().mockResolvedValue({}),
  addComment: vi.fn().mockResolvedValue({}),
  deleteComment: vi.fn().mockResolvedValue({}),
  addLink: vi.fn().mockResolvedValue({}),
  deleteLink: vi.fn().mockResolvedValue({}),
}))

const item = {
  id: '1',
  title: 'Test Item',
  categoryName: 'Papers',
  date: '2024-01-15',
  imagePath: null,
}

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <ItemCard item={item} onDeleted={vi.fn()} {...props} />
    </MemoryRouter>
  )
}

test('renders item title and category', () => {
  renderCard()
  expect(screen.getByText('Test Item')).toBeInTheDocument()
  expect(screen.getByText('Papers')).toBeInTheDocument()
})

test('renders item date', () => {
  renderCard()
  expect(screen.getByText('2024-01-15')).toBeInTheDocument()
})

test('shows avatar with first letter of title when no image', () => {
  renderCard()
  expect(screen.getByText('T')).toBeInTheDocument()
})

test('shows delete confirm modal on delete button click', () => {
  renderCard()
  fireEvent.click(screen.getByLabelText('Delete item'))
  expect(screen.getByText(/delete data/i)).toBeInTheDocument()
  expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
})

test('hides confirm modal when cancel is clicked', () => {
  renderCard()
  fireEvent.click(screen.getByLabelText('Delete item'))
  expect(screen.getByText(/delete data/i)).toBeInTheDocument()
  fireEvent.click(screen.getByText('Cancel'))
  expect(screen.queryByText(/delete data/i)).not.toBeInTheDocument()
})

test('calls deleteItem and onDeleted when confirm delete is clicked', async () => {
  const { deleteItem } = await import('../../api/items')
  const onDeleted = vi.fn()
  renderCard({ onDeleted })
  fireEvent.click(screen.getByLabelText('Delete item'))
  fireEvent.click(screen.getByText('Delete'))
  await waitFor(() => {
    expect(deleteItem).toHaveBeenCalledWith('1')
    expect(onDeleted).toHaveBeenCalled()
  })
})

test('renders description when present', () => {
  render(
    <MemoryRouter>
      <ItemCard item={{ ...item, description: 'Some description text' }} onDeleted={vi.fn()} />
    </MemoryRouter>
  )
  expect(screen.getByText('Some description text')).toBeInTheDocument()
})

test('shows linked count when relatedItems present', () => {
  render(
    <MemoryRouter>
      <ItemCard item={{ ...item, relatedItems: [{ id: 'r1' }, { id: 'r2' }] }} onDeleted={vi.fn()} />
    </MemoryRouter>
  )
  expect(screen.getByText('2 linked')).toBeInTheDocument()
})
