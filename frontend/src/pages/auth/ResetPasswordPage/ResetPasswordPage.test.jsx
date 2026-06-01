import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ResetPasswordPage from './ResetPasswordPage'
import { vi } from 'vitest'

const mockResetConfirm = vi.fn()
const mockNavigate = vi.fn()
let mockSearchParamsImpl = () => [new URLSearchParams('token=abc'), vi.fn()]

vi.mock('../../../hooks/useAuthApi', () => ({
  useAuthApi: () => ({ resetConfirm: mockResetConfirm }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => mockSearchParamsImpl(),
  }
})

beforeEach(() => {
  mockResetConfirm.mockReset()
  mockNavigate.mockReset()
  mockSearchParamsImpl = () => [new URLSearchParams('token=abc'), vi.fn()]
})

function renderPage() {
  return render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>)
}

test('shows "Invalid reset link" when no token in URL', () => {
  mockSearchParamsImpl = () => [new URLSearchParams(''), vi.fn()]
  renderPage()
  expect(screen.getByText('Invalid reset link.')).toBeInTheDocument()
})

test('shows password form when token is present', () => {
  renderPage()
  expect(screen.getByText('Choose a new password')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /set new password/i })).toBeInTheDocument()
})

test('shows error when password is too short', async () => {
  renderPage()
  const [newPwd, confirmPwd] = document.querySelectorAll('input[type="password"]')
  fireEvent.change(newPwd, { target: { value: 'abc' } })
  fireEvent.change(confirmPwd, { target: { value: 'abc' } })
  fireEvent.click(screen.getByRole('button', { name: /set new password/i }))
  expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument()
})

test('shows error when passwords do not match', async () => {
  renderPage()
  const [newPwd, confirmPwd] = document.querySelectorAll('input[type="password"]')
  fireEvent.change(newPwd, { target: { value: 'password123' } })
  fireEvent.change(confirmPwd, { target: { value: 'different' } })
  fireEvent.click(screen.getByRole('button', { name: /set new password/i }))
  expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
})

test('shows success state after successful reset', async () => {
  mockResetConfirm.mockResolvedValue({})
  renderPage()
  const [newPwd, confirmPwd] = document.querySelectorAll('input[type="password"]')
  fireEvent.change(newPwd, { target: { value: 'password123' } })
  fireEvent.change(confirmPwd, { target: { value: 'password123' } })
  fireEvent.click(screen.getByRole('button', { name: /set new password/i }))
  expect(await screen.findByText('Password updated')).toBeInTheDocument()
})

test('shows error when reset request fails', async () => {
  mockResetConfirm.mockRejectedValue({ response: { data: { message: 'Token expired' } } })
  renderPage()
  const [newPwd, confirmPwd] = document.querySelectorAll('input[type="password"]')
  fireEvent.change(newPwd, { target: { value: 'password123' } })
  fireEvent.change(confirmPwd, { target: { value: 'password123' } })
  fireEvent.click(screen.getByRole('button', { name: /set new password/i }))
  expect(await screen.findByText(/Token expired/)).toBeInTheDocument()
})
