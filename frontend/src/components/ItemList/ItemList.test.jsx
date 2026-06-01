import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ItemList from './ItemList'
import { vi } from 'vitest'

vi.mock('../../api/items', () => ({
  getItems: vi.fn().mockResolvedValue({
    data: [{ id: '1', title: 'Item A', categoryName: 'Cat', date: '2024-01-01' }],
  }),
  getItem: vi.fn().mockResolvedValue({ data: {} }),
  createItem: vi.fn().mockResolvedValue({ data: {} }),
  updateItem: vi.fn().mockResolvedValue({ data: {} }),
  deleteItem: vi.fn().mockResolvedValue({}),
  uploadImage: vi.fn().mockResolvedValue({}),
  addFile: vi.fn().mockResolvedValue({}),
  deleteFile: vi.fn().mockResolvedValue({}),
  getFile: vi.fn().mockRejectedValue(new Error()),
  addRelation: vi.fn().mockResolvedValue({}),
  removeRelation: vi.fn().mockResolvedValue({}),
  addComment: vi.fn().mockResolvedValue({}),
  deleteComment: vi.fn().mockResolvedValue({}),
  addLink: vi.fn().mockResolvedValue({}),
  deleteLink: vi.fn().mockResolvedValue({}),
}))

vi.mock('../../api/keywords', () => ({
  getKeywords: vi.fn().mockResolvedValue({ data: [] }),
  createKeyword: vi.fn().mockResolvedValue({ data: { id: 'kw1', name: 'test' } }),
  deleteKeyword: vi.fn().mockResolvedValue({}),
}))

let mockKeywords = []
vi.mock('../../hooks/useKeywords', () => ({
  useKeywords: () => ({
    keywords: mockKeywords,
    loading: false,
    refetch: vi.fn(),
    createKeyword: vi.fn(),
    deleteKeyword: vi.fn(),
  }),
}))

beforeEach(() => {
  mockKeywords = []
})

vi.mock('../MultiSelect/MultiSelect', () => ({
  default: ({ allKeywords, selectedIds, onChange }) => (
    <div className="multiselect-mock">
      {allKeywords.map((k) => (
        <button key={k.id} type="button" onClick={() => onChange([...selectedIds, k.id])}>
          pick-{k.name}
        </button>
      ))}
    </div>
  ),
}))

function renderList(props = {}) {
  return render(
    <MemoryRouter>
      <ItemList
        selectedId={null}
        categories={[]}
        onCategoriesChange={vi.fn()}
        uploadOpen={false}
        onOpenUpload={vi.fn()}
        onCloseUpload={vi.fn()}
        refreshSignal={0}
        {...props}
      />
    </MemoryRouter>
  )
}

test('renders items after loading', async () => {
  renderList()
  expect(await screen.findByText('Item A')).toBeInTheDocument()
})

test('shows Search button', async () => {
  renderList()
  expect(await screen.findByText('Search')).toBeInTheDocument()
})

test('renders category name on item card', async () => {
  renderList()
  expect(await screen.findByText('Cat')).toBeInTheDocument()
})

test('shows empty state when no items', async () => {
  const { getItems } = await import('../../api/items')
  getItems.mockResolvedValueOnce({ data: [] })
  renderList()
  expect(await screen.findByText(/no items yet/i)).toBeInTheDocument()
})

test('opens search modal when Search is clicked', async () => {
  renderList()
  const searchBtn = await screen.findByText('Search')
  fireEvent.click(searchBtn)
  expect(screen.getByText('Search & Filter')).toBeInTheDocument()
})

test('shows "New item" button in empty state', async () => {
  const { getItems } = await import('../../api/items')
  getItems.mockResolvedValueOnce({ data: [] })
  renderList()
  expect(await screen.findByText(/new item/i)).toBeInTheDocument()
})

test('renders UploadModal when uploadOpen=true', async () => {
  renderList({ uploadOpen: true, categories: [{ id: 'c1', name: 'Papers', fields: [] }] })
  expect(await screen.findByText('New Item')).toBeInTheDocument()
})

test('does not show filter chips when no filters set', async () => {
  renderList()
  await screen.findByText('Item A')
  expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
})

test('applying a text filter shows a filter chip', async () => {
  renderList()
  fireEvent.click(await screen.findByText('Search'))
  fireEvent.change(screen.getByPlaceholderText('Search by title or description…'), {
    target: { value: 'genome' },
  })
  fireEvent.click(screen.getByText('Apply'))
  expect(screen.getByText('"genome"')).toBeInTheDocument()
})

test('Enter in search text input applies the filter', async () => {
  renderList()
  fireEvent.click(await screen.findByText('Search'))
  const input = screen.getByPlaceholderText('Search by title or description…')
  fireEvent.change(input, { target: { value: 'protein' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(screen.getByText('"protein"')).toBeInTheDocument()
})

test('search button shows active badge with count after applying filter', async () => {
  renderList()
  fireEvent.click(await screen.findByText('Search'))
  fireEvent.change(screen.getByPlaceholderText('Search by title or description…'), {
    target: { value: 'x' },
  })
  fireEvent.click(screen.getByText('Apply'))
  expect(document.querySelector('.search-btn-badge').textContent).toBe('1')
})

test('removing the text chip clears that filter', async () => {
  renderList()
  fireEvent.click(await screen.findByText('Search'))
  fireEvent.change(screen.getByPlaceholderText('Search by title or description…'), {
    target: { value: 'genome' },
  })
  fireEvent.click(screen.getByText('Apply'))
  const chip = screen.getByText('"genome"')
  fireEvent.click(chip.querySelector('button'))
  expect(screen.queryByText('"genome"')).not.toBeInTheDocument()
})

test('"Clear all" removes all filters', async () => {
  renderList()
  fireEvent.click(await screen.findByText('Search'))
  fireEvent.change(screen.getByPlaceholderText('Search by title or description…'), {
    target: { value: 'genome' },
  })
  fireEvent.click(screen.getByText('Apply'))
  expect(screen.getByText('Clear all')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Clear all'))
  expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
})

test('Cancel closes the search modal without applying', async () => {
  renderList()
  fireEvent.click(await screen.findByText('Search'))
  fireEvent.change(screen.getByPlaceholderText('Search by title or description…'), {
    target: { value: 'genome' },
  })
  fireEvent.click(screen.getByText('Cancel'))
  expect(screen.queryByText('Search & Filter')).not.toBeInTheDocument()
  expect(screen.queryByText('"genome"')).not.toBeInTheDocument()
})

test('clicking overlay closes the search modal', async () => {
  renderList()
  fireEvent.click(await screen.findByText('Search'))
  fireEvent.click(document.querySelector('.modal-overlay'))
  expect(screen.queryByText('Search & Filter')).not.toBeInTheDocument()
})

test('shows "No data found" empty state when filters match nothing', async () => {
  const { getItems } = await import('../../api/items')
  renderList()
  await screen.findByText('Item A')
  getItems.mockResolvedValueOnce({ data: [] })
  fireEvent.click(screen.getByText('Search'))
  fireEvent.change(screen.getByPlaceholderText('Search by title or description…'), {
    target: { value: 'nomatch' },
  })
  fireEvent.click(screen.getByText('Apply'))
  expect(await screen.findByText('No data found')).toBeInTheDocument()
})

test('applying an AND keyword filter shows an "AND:" chip', async () => {
  mockKeywords = [{ id: 'k1', name: 'Biology' }]
  renderList()
  fireEvent.click(await screen.findByText('Search'))
  fireEvent.click(screen.getAllByText('pick-Biology')[0])
  fireEvent.click(screen.getByText('Apply'))
  expect(screen.getByText(/AND: Biology/)).toBeInTheDocument()
})

test('removing an AND keyword chip clears it', async () => {
  mockKeywords = [{ id: 'k1', name: 'Biology' }]
  renderList()
  fireEvent.click(await screen.findByText('Search'))
  fireEvent.click(screen.getAllByText('pick-Biology')[0])
  fireEvent.click(screen.getByText('Apply'))
  const chip = screen.getByText(/AND: Biology/)
  fireEvent.click(chip.querySelector('button'))
  expect(screen.queryByText(/AND: Biology/)).not.toBeInTheDocument()
})

test('applying an OR keyword filter shows an "OR:" chip', async () => {
  mockKeywords = [{ id: 'k2', name: 'Physics' }]
  renderList()
  fireEvent.click(await screen.findByText('Search'))
  fireEvent.click(screen.getAllByText('pick-Physics')[1])
  fireEvent.click(screen.getByText('Apply'))
  expect(screen.getByText(/OR: Physics/)).toBeInTheDocument()
})

test('applying a NOT keyword filter shows a "NOT:" chip', async () => {
  mockKeywords = [{ id: 'k3', name: 'Draft' }]
  renderList()
  fireEvent.click(await screen.findByText('Search'))
  fireEvent.click(screen.getAllByText('pick-Draft')[2])
  fireEvent.click(screen.getByText('Apply'))
  expect(screen.getByText(/NOT: Draft/)).toBeInTheDocument()
})

test('deleting an item refetches the list and notifies parent', async () => {
  const { deleteItem } = await import('../../api/items')
  const onCategoriesChange = vi.fn()
  renderList({ onCategoriesChange })
  await screen.findByText('Item A')
  fireEvent.click(screen.getByLabelText('Delete item'))
  fireEvent.click(screen.getByText('Delete'))
  await waitFor(() => {
    expect(deleteItem).toHaveBeenCalledWith('1')
    expect(onCategoriesChange).toHaveBeenCalled()
  })
})

test('shows loading state initially', () => {
  renderList()
  expect(screen.getByText('Loading…')).toBeInTheDocument()
})
