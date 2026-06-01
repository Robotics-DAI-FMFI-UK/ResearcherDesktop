import { render, screen, fireEvent } from '@testing-library/react'
import CategoryDetail from './CategoryDetail'
import { vi } from 'vitest'

const category = { id: '1', name: 'Papers', icon: 'book-open', description: 'My papers' }

test('renders description text', () => {
  render(<CategoryDetail category={category} onUpdate={vi.fn()} />)
  expect(screen.getByText('My papers')).toBeInTheDocument()
})

test('shows placeholder when description is empty', () => {
  render(<CategoryDetail category={{ ...category, description: '' }} onUpdate={vi.fn()} />)
  expect(screen.getByText('Click to add a description…')).toBeInTheDocument()
})

test('clicking description starts editing', () => {
  render(<CategoryDetail category={category} onUpdate={vi.fn()} />)
  fireEvent.click(screen.getByText('My papers'))
  expect(screen.getByRole('textbox')).toBeInTheDocument()
})

test('Escape cancels editing without saving', () => {
  render(<CategoryDetail category={category} onUpdate={vi.fn()} />)
  fireEvent.click(screen.getByText('My papers'))
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' })
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(screen.getByText('My papers')).toBeInTheDocument()
})

test('Enter calls onUpdate with trimmed value', async () => {
  const onUpdate = vi.fn().mockResolvedValue(undefined)
  render(<CategoryDetail category={category} onUpdate={onUpdate} />)
  fireEvent.click(screen.getByText('My papers'))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Updated desc  ' } })
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
  await vi.waitFor(() =>
    expect(onUpdate).toHaveBeenCalledWith('1', expect.objectContaining({ description: 'Updated desc' }))
  )
})

test('blur saves the description', async () => {
  const onUpdate = vi.fn().mockResolvedValue(undefined)
  render(<CategoryDetail category={category} onUpdate={onUpdate} />)
  fireEvent.click(screen.getByText('My papers'))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New description' } })
  fireEvent.blur(screen.getByRole('textbox'))
  await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled())
})
