import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'
import { vi } from 'vitest'

const mockLogout = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'alice' }, logout: mockLogout }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../utils/icons', () => ({
  Icon: ({ name }) => <span data-testid={`icon-${name}`} />,
}))

beforeEach(() => {
  mockLogout.mockReset()
  mockNavigate.mockReset()
})

test('shows first letter of username as initials', () => {
  render(<MemoryRouter><Navbar /></MemoryRouter>)
  expect(screen.getByText('A')).toBeInTheDocument()
})

test('shows username in the navbar', () => {
  render(<MemoryRouter><Navbar /></MemoryRouter>)
  expect(screen.getByText('alice')).toBeInTheDocument()
})

test('logout button calls logout', () => {
  render(<MemoryRouter><Navbar /></MemoryRouter>)
  fireEvent.click(screen.getByText('Log out'))
  expect(mockLogout).toHaveBeenCalled()
})

test('calendar button navigates to /calendar', () => {
  render(<MemoryRouter><Navbar /></MemoryRouter>)
  fireEvent.click(screen.getByTitle('Calendar'))
  expect(mockNavigate).toHaveBeenCalledWith('/calendar')
})

test('renders the brand name', () => {
  render(<MemoryRouter><Navbar /></MemoryRouter>)
  expect(screen.getByText('ResearchDesk')).toBeInTheDocument()
})
