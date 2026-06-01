import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from './Layout'
import { vi } from 'vitest'

vi.mock('../../hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [],
    refetch: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  }),
}))

vi.mock('../Navbar/Navbar', () => ({ default: () => <div data-testid="navbar" /> }))
vi.mock('../Sidebar/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }))

test('renders Navbar', () => {
  render(<MemoryRouter><Layout /></MemoryRouter>)
  expect(screen.getByTestId('navbar')).toBeInTheDocument()
})

test('renders Sidebar', () => {
  render(<MemoryRouter><Layout /></MemoryRouter>)
  expect(screen.getByTestId('sidebar')).toBeInTheDocument()
})

test('renders main content container', () => {
  render(<MemoryRouter><Layout /></MemoryRouter>)
  expect(document.querySelector('.main-content')).toBeInTheDocument()
})
