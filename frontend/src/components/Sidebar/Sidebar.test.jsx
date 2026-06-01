import { render, screen, fireEvent } from '@testing-library/react'
import Sidebar from './Sidebar'
import { vi } from 'vitest'

vi.mock('../../api/categories', () => ({
  getCategories: vi.fn().mockResolvedValue({ data: [] }),
  createCategory: vi.fn().mockResolvedValue({ data: {} }),
  updateCategory: vi.fn().mockResolvedValue({ data: {} }),
  deleteCategory: vi.fn().mockResolvedValue({}),
}))

const cats = [
  { id: '2', name: 'Zebra', fieldCount: 0, itemCount: 3 },
  { id: '1', name: 'Alpha', fieldCount: 0, itemCount: 1 },
]

function renderSidebar(props = {}) {
  return render(
    <Sidebar
      categories={cats}
      selectedId={null}
      onSelect={vi.fn()}
      onCreate={vi.fn()}
      onUpdate={vi.fn()}
      onDelete={vi.fn()}
      {...props}
    />
  )
}

test('renders "All Data" option', () => {
  renderSidebar()
  expect(screen.getByText('All Data')).toBeInTheDocument()
})

test('renders all category names', () => {
  renderSidebar()
  expect(screen.getByText('Alpha')).toBeInTheDocument()
  expect(screen.getByText('Zebra')).toBeInTheDocument()
})

test('renders category item counts', () => {
  renderSidebar()
  expect(screen.getByText('1')).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()
})

test('shows total item count next to All Data', () => {
  renderSidebar()
  expect(screen.getByText('4')).toBeInTheDocument()
})

test('calls onSelect with null when All Data is clicked', () => {
  const onSelect = vi.fn()
  renderSidebar({ onSelect })
  fireEvent.click(screen.getByText('All Data'))
  expect(onSelect).toHaveBeenCalledWith(null)
})

test('calls onSelect with category id when category is clicked', () => {
  const onSelect = vi.fn()
  renderSidebar({ onSelect })
  fireEvent.click(screen.getByText('Alpha'))
  expect(onSelect).toHaveBeenCalledWith('1')
})

test('marks selected category as active', () => {
  renderSidebar({ selectedId: '2' })
  const items = document.querySelectorAll('.sidebar-item')
  const zebraItem = [...items].find((el) => el.textContent.includes('Zebra'))
  expect(zebraItem).toHaveClass('active')
})

test('marks All Data as active when selectedId is null', () => {
  renderSidebar({ selectedId: null })
  const items = document.querySelectorAll('.sidebar-item')
  const allItem = [...items].find((el) => el.textContent.includes('All Data'))
  expect(allItem).toHaveClass('active')
})

test('shows delete confirm when delete button is clicked', () => {
  renderSidebar()
  const deleteButtons = document.querySelectorAll('.sidebar-icon-btn.delete')
  fireEvent.click(deleteButtons[0])
  expect(screen.getByText(/delete category/i)).toBeInTheDocument()
})

test('calls onDelete when confirm delete is clicked', async () => {
  const onDelete = vi.fn().mockResolvedValue(undefined)
  renderSidebar({ onDelete })
  const deleteButtons = document.querySelectorAll('.sidebar-icon-btn.delete')
  fireEvent.click(deleteButtons[0])
  fireEvent.click(screen.getByText('Delete'))
  await vi.waitFor(() => {
    expect(onDelete).toHaveBeenCalled()
  })
})

test('opens CategoryModal when + button is clicked', () => {
  renderSidebar()
  const addBtn = document.querySelector('.sidebar-add-btn')
  fireEvent.click(addBtn)
  expect(screen.getByText(/new category|edit category/i)).toBeInTheDocument()
})
