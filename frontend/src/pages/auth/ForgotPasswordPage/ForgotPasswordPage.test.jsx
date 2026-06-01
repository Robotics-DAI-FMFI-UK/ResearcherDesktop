import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ForgotPasswordPage from './ForgotPasswordPage'
import { vi } from 'vitest'

const mockResetRequest = vi.fn()

vi.mock('../../../hooks/useAuthApi', () => ({
  useAuthApi: () => ({ resetRequest: mockResetRequest }),
}))

beforeEach(() => mockResetRequest.mockReset())

function renderPage() {
  return render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)
}

test('renders the reset password form', () => {
  renderPage()
  expect(screen.getByText('Reset your password')).toBeInTheDocument()
  expect(screen.getByText('Send reset link')).toBeInTheDocument()
})

test('shows error when submitting with empty username', () => {
  renderPage()
  fireEvent.click(screen.getByText('Send reset link'))
  expect(screen.getByText('Please enter your username')).toBeInTheDocument()
})

test('shows error when submitting with empty email', () => {
  renderPage()
  const [usernameInput] = screen.getAllByRole('textbox')
  fireEvent.change(usernameInput, { target: { value: 'alice' } })
  fireEvent.click(screen.getByText('Send reset link'))
  expect(screen.getByText('Please enter your email address')).toBeInTheDocument()
})

test('shows success state after successful submit', async () => {
  mockResetRequest.mockResolvedValue({})
  renderPage()
  const [usernameInput, emailInput] = screen.getAllByRole('textbox')
  fireEvent.change(usernameInput, { target: { value: 'alice' } })
  fireEvent.change(emailInput, { target: { value: 'alice@test.com' } })
  fireEvent.click(screen.getByText('Send reset link'))
  expect(await screen.findByText('Check your email')).toBeInTheDocument()
})

