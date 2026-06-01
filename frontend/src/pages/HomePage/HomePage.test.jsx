import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage'
import { vi } from 'vitest'

let mockOutletContext = {
  selectedCategory: null,
  selectedId: null,
  categories: [
    { id: '1', name: 'Papers', itemCount: 5, icon: 'book-open' },
    { id: '2', name: 'Notes', itemCount: 3, icon: 'notebook-pen' },
  ],
  onCategoriesChange: vi.fn(),
  updateCategory: vi.fn(),
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useOutletContext: () => mockOutletContext }
})

vi.mock('../../hooks/useGmail', () => ({
  useGmail: () => ({
    scanGmail: vi.fn().mockResolvedValue({ data: [] }),
    importConference: vi.fn().mockResolvedValue({}),
  }),
}))

vi.mock('../../utils/icons', () => ({
  Icon: ({ name }) => <span>{name}</span>,
}))

vi.mock('../../components/CategoryDetail/CategoryDetail', () => ({ default: () => null }))
vi.mock('../../components/ItemList/ItemList', () => ({ default: () => <div>ItemList</div> }))

beforeEach(() => {
  mockOutletContext = {
    selectedCategory: null,
    selectedId: null,
    categories: [
      { id: '1', name: 'Papers', itemCount: 5, icon: 'book-open' },
      { id: '2', name: 'Notes', itemCount: 3, icon: 'notebook-pen' },
    ],
    onCategoriesChange: vi.fn(),
    updateCategory: vi.fn(),
  }
})

test('shows "All Data" heading when no category is selected', () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(screen.getByText('All Data')).toBeInTheDocument()
})

test('shows total item count when no category is selected', () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(screen.getByText('8')).toBeInTheDocument()
})

test('shows selected category name', () => {
  mockOutletContext.selectedCategory = { id: '1', name: 'Papers', itemCount: 5, icon: 'book-open' }
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(screen.getByText('Papers')).toBeInTheDocument()
})

test('shows selected category item count', () => {
  mockOutletContext.selectedCategory = { id: '1', name: 'Papers', itemCount: 5, icon: 'book-open' }
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(screen.getByText('5')).toBeInTheDocument()
})

test('renders ItemList component', () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(screen.getByText('ItemList')).toBeInTheDocument()
})

test('shows "New item" button when total item count is greater than zero', () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(screen.getByText('New item')).toBeInTheDocument()
})

test('hides "New item" button when all categories have zero items', () => {
  mockOutletContext.categories = [
    { id: '1', name: 'Papers', itemCount: 0, icon: 'book-open' },
  ]
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(screen.queryByText('New item')).not.toBeInTheDocument()
})

test('hides item count badge when total is zero', () => {
  mockOutletContext.categories = [{ id: '1', name: 'Papers', itemCount: 0, icon: 'book-open' }]
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(screen.queryByText('0')).not.toBeInTheDocument()
})

test('shows "Scan Gmail" button only for Conferences category', () => {
  mockOutletContext.selectedCategory = { id: '3', name: 'Conferences', itemCount: 4, icon: 'presentation' }
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(screen.getByText('Scan Gmail')).toBeInTheDocument()
})

test('does not show "Scan Gmail" button for non-Conferences category', () => {
  mockOutletContext.selectedCategory = { id: '1', name: 'Papers', itemCount: 5, icon: 'book-open' }
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(screen.queryByText('Scan Gmail')).not.toBeInTheDocument()
})

test('opens Gmail scan modal when Scan Gmail is clicked', async () => {
  mockOutletContext.selectedCategory = { id: '3', name: 'Conferences', itemCount: 4, icon: 'presentation' }
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  fireEvent.click(screen.getByText('Scan Gmail'))
  expect(await screen.findByText('Scan Gmail for Conferences')).toBeInTheDocument()
})

test('closes Gmail scan modal when Close is clicked', async () => {
  mockOutletContext.selectedCategory = { id: '3', name: 'Conferences', itemCount: 4, icon: 'presentation' }
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  fireEvent.click(screen.getByText('Scan Gmail'))
  await screen.findByText('Scan Gmail for Conferences')
  fireEvent.click(screen.getByText('Close'))
  expect(screen.queryByText('Scan Gmail for Conferences')).not.toBeInTheDocument()
})

test('renders category icon when category is selected', () => {
  mockOutletContext.selectedCategory = { id: '1', name: 'Papers', itemCount: 5, icon: 'book-open' }
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(document.querySelector('.home-header-icon')).toBeInTheDocument()
})

test('does not render category icon when no category is selected', () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(document.querySelector('.home-header-icon')).not.toBeInTheDocument()
})
