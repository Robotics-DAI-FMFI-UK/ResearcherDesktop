import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'
import { vi } from 'vitest'

const mockLoginApi = vi.fn()
const mockRegisterApi = vi.fn()
const mockAuthLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../../hooks/useAuthApi', () => ({
  useAuthApi: () => ({ login: mockLoginApi, register: mockRegisterApi }),
}))

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ login: mockAuthLogin }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

beforeEach(() => {
  mockLoginApi.mockReset()
  mockRegisterApi.mockReset()
  mockAuthLogin.mockReset()
  mockNavigate.mockReset()
})

function renderPage() {
  return render(<MemoryRouter><LoginPage /></MemoryRouter>)
}

function submitBtn() {
  return document.querySelector('button[type="submit"]')
}

function registerTab() {
  return document.querySelectorAll('.login-tab-outer')[1]
}

test('renders sign-in subtitle by default', () => {
  renderPage()
  expect(screen.getByText('Sign in to access your research data')).toBeInTheDocument()
})

test('switches to register mode when "Create account" tab is clicked', () => {
  renderPage()
  fireEvent.click(registerTab())
  expect(screen.getByText('Create an account to start organizing your research')).toBeInTheDocument()
})

test('shows validation error when username is empty', () => {
  renderPage()
  fireEvent.submit(document.querySelector('.login-form'))
  expect(screen.getAllByText('Please fill in this field').length).toBeGreaterThan(0)
})

test('calls loginApi and navigates to / on success', async () => {
  mockLoginApi.mockResolvedValue({ data: { token: 'tok', username: 'alice', role: 'USER' } })
  renderPage()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'alice' } })
  fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'pass123' } })
  fireEvent.submit(document.querySelector('.login-form'))
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
})

test('shows error message on login failure', async () => {
  mockLoginApi.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } })
  renderPage()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'alice' } })
  fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'wrong' } })
  fireEvent.submit(document.querySelector('.login-form'))
  expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
})

test('shows pending approval screen when token is null', async () => {
  mockLoginApi.mockResolvedValue({ data: { token: null, username: 'alice', role: 'USER' } })
  renderPage()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'alice' } })
  fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'pass123' } })
  fireEvent.submit(document.querySelector('.login-form'))
  expect(await screen.findByText('Account pending approval')).toBeInTheDocument()
})

test('shows password mismatch error in register mode', async () => {
  renderPage()
  fireEvent.click(registerTab())
  const textboxes = screen.getAllByRole('textbox')
  fireEvent.change(textboxes[0], { target: { value: 'alice' } })
  fireEvent.change(textboxes[1], { target: { value: 'alice@test.com' } })
  const passwords = document.querySelectorAll('input[type="password"]')
  fireEvent.change(passwords[0], { target: { value: 'password123' } })
  fireEvent.change(passwords[1], { target: { value: 'different' } })
  fireEvent.submit(document.querySelector('.login-form'))
  expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
})
