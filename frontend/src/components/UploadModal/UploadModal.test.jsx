import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UploadModal from './UploadModal'
import { vi } from 'vitest'

vi.mock('../../api/items', () => ({
  getItems: vi.fn().mockResolvedValue({ data: [] }),
  getItem: vi.fn().mockResolvedValue({ data: {} }),
  createItem: vi.fn().mockResolvedValue({ data: { id: 'new-id' } }),
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

vi.mock('../../api/keywords', () => ({
  getKeywords: vi.fn().mockResolvedValue({ data: [] }),
  createKeyword: vi.fn().mockResolvedValue({ data: { id: 'kw1', name: 'test' } }),
  deleteKeyword: vi.fn().mockResolvedValue({}),
}))

const cats = [{ id: 'c1', name: 'Papers', fields: [] }]

function renderModal(props = {}) {
  return render(
    <UploadModal
      open={true}
      onClose={vi.fn()}
      onCreated={vi.fn()}
      categories={cats}
      selectedCategoryId="c1"
      {...props}
    />
  )
}

test('renders when open=true', () => {
  renderModal()
  expect(screen.getByText('New Item')).toBeInTheDocument()
})

test('does not render when open=false', () => {
  const { container } = render(
    <UploadModal open={false} onClose={vi.fn()} onCreated={vi.fn()} categories={[]} />
  )
  expect(container).toBeEmptyDOMElement()
})

test('renders category select with category name', () => {
  renderModal()
  expect(screen.getByText('Papers')).toBeInTheDocument()
})

test('renders Name, Date, Keywords fields', () => {
  renderModal()
  expect(screen.getByText('Name')).toBeInTheDocument()
  expect(screen.getByText('Date')).toBeInTheDocument()
  expect(screen.getByText('Keywords')).toBeInTheDocument()
})

test('renders Save and Cancel buttons', () => {
  renderModal()
  expect(screen.getByText('Save')).toBeInTheDocument()
  expect(screen.getByText('Cancel')).toBeInTheDocument()
})

test('calls onClose when Cancel is clicked', () => {
  const onClose = vi.fn()
  renderModal({ onClose })
  fireEvent.click(screen.getByText('Cancel'))
  expect(onClose).toHaveBeenCalled()
})

test('calls createItem with title and categoryId on submit', async () => {
  const { createItem } = await import('../../api/items')
  const onCreated = vi.fn()
  const onClose = vi.fn()
  renderModal({ onCreated, onClose })
  const textboxes = screen.getAllByRole('textbox')
  const nameInput = textboxes[0]
  fireEvent.change(nameInput, { target: { value: 'My Research' } })
  fireEvent.click(screen.getByText('Save'))
  await waitFor(() => {
    expect(createItem).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Research', categoryId: 'c1' })
    )
  })
})

test('calls onCreated and onClose after successful submit', async () => {
  const onCreated = vi.fn()
  const onClose = vi.fn()
  renderModal({ onCreated, onClose })
  const textboxes = screen.getAllByRole('textbox')
  fireEvent.change(textboxes[0], { target: { value: 'Test' } })
  fireEvent.click(screen.getByText('Save'))
  await waitFor(() => {
    expect(onCreated).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})

test('shows error message when createItem fails', async () => {
  const { createItem } = await import('../../api/items')
  createItem.mockRejectedValueOnce(new Error('server error'))
  renderModal()
  const textboxes = screen.getAllByRole('textbox')
  fireEvent.change(textboxes[0], { target: { value: 'Fail Item' } })
  fireEvent.click(screen.getByText('Save'))
  await waitFor(() => {
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})


const catWithFields = [
  {
    id: 'c1',
    name: 'Papers',
    fields: [
      { id: 'f-text', name: 'Abstract', fieldType: 'TEXT', options: [] },
      { id: 'f-num', name: 'Citations', fieldType: 'NUMBER', options: [] },
      { id: 'f-date', name: 'Published', fieldType: 'DATE', options: [] },
      { id: 'f-drop', name: 'Status', fieldType: 'DROPDOWN', options: ['Draft', 'Final'] },
      { id: 'f-check', name: 'Peer Reviewed', fieldType: 'CHECKBOX', options: [] },
    ],
  },
]

function renderWithFields(props = {}) {
  return renderModal({ categories: catWithFields, selectedCategoryId: 'c1', ...props })
}

test('renders all dynamic field labels for the category', () => {
  renderWithFields()
  expect(screen.getByText('Abstract')).toBeInTheDocument()
  expect(screen.getByText('Citations')).toBeInTheDocument()
  expect(screen.getByText('Published')).toBeInTheDocument()
  expect(screen.getByText('Status')).toBeInTheDocument()
  expect(screen.getAllByText('Peer Reviewed').length).toBeGreaterThan(0)
})

test('renders TEXT field with placeholder', () => {
  renderWithFields()
  expect(screen.getByPlaceholderText('Abstract')).toBeInTheDocument()
})

test('renders NUMBER field as number input', () => {
  renderWithFields()
  const numInput = screen.getByPlaceholderText('Citations')
  expect(numInput.getAttribute('type')).toBe('number')
})

test('renders CHECKBOX field', () => {
  renderWithFields()
  expect(document.querySelector('.checkbox-field input[type="checkbox"]')).toBeInTheDocument()
})

test('typing in TEXT field updates its value', () => {
  renderWithFields()
  const textField = screen.getByPlaceholderText('Abstract')
  fireEvent.change(textField, { target: { value: 'A novel approach' } })
  expect(textField.value).toBe('A novel approach')
})

test('toggling CHECKBOX field updates its state', () => {
  renderWithFields()
  const checkbox = document.querySelector('.checkbox-field input[type="checkbox"]')
  fireEvent.click(checkbox)
  expect(checkbox.checked).toBe(true)
})

test('submitting includes filled field values in payload', async () => {
  const { createItem } = await import('../../api/items')
  createItem.mockResolvedValueOnce({ data: { id: 'new-id' } })
  renderWithFields()
  const nameInput = screen.getAllByRole('textbox').find((el) => !el.placeholder)
  fireEvent.change(nameInput, { target: { value: 'My Paper' } })
  fireEvent.change(screen.getByPlaceholderText('Citations'), { target: { value: '15' } })
  fireEvent.click(screen.getByText('Save'))
  await waitFor(() =>
    expect(createItem).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldValues: expect.arrayContaining([{ fieldId: 'f-num', value: '15' }]),
      })
    )
  )
})

test('empty field values are excluded from payload', async () => {
  const { createItem } = await import('../../api/items')
  createItem.mockResolvedValueOnce({ data: { id: 'new-id' } })
  renderWithFields()
  const nameInput = screen.getAllByRole('textbox').find((el) => !el.placeholder)
  fireEvent.change(nameInput, { target: { value: 'Empty Fields' } })
  fireEvent.click(screen.getByText('Save'))
  await waitFor(() => {
    const payload = createItem.mock.calls.at(-1)[0]
    expect(payload.fieldValues).toEqual([])
  })
})


test('suggests category name as a new keyword', () => {
  renderWithFields()
  expect(screen.getByText('+ Papers')).toBeInTheDocument()
})

test('suggests words from the title', () => {
  renderWithFields()
  const nameInput = screen.getAllByRole('textbox').find((el) => !el.placeholder)
  fireEvent.change(nameInput, { target: { value: 'Genome Sequencing' } })
  expect(screen.getByText('+ Genome')).toBeInTheDocument()
  expect(screen.getByText('+ Sequencing')).toBeInTheDocument()
})

test('clicking a new suggested keyword creates it', async () => {
  const { createKeyword } = await import('../../api/keywords')
  createKeyword.mockResolvedValueOnce({ data: { id: 'kw-new', name: 'Papers' } })
  renderWithFields()
  fireEvent.click(screen.getByText('+ Papers'))
  await waitFor(() => expect(createKeyword).toHaveBeenCalledWith('Papers'))
})

test('clicking an existing suggested keyword selects it without creating', async () => {
  const { getKeywords, createKeyword } = await import('../../api/keywords')
  createKeyword.mockClear()
  getKeywords.mockResolvedValueOnce({ data: [{ id: 'kw1', name: 'Papers' }] })
  renderWithFields()
  const suggestion = await screen.findByText('Papers', { selector: '.suggested-chip' })
  fireEvent.click(suggestion)
  await waitFor(() => expect(screen.queryByText('Papers', { selector: '.multiselect-chip' })).toBeInTheDocument())
  expect(createKeyword).not.toHaveBeenCalled()
})


test('changing category resets dynamic field values', () => {
  const twoCats = [
    { id: 'c1', name: 'Papers', fields: [{ id: 'f1', name: 'Abstract', fieldType: 'TEXT', options: [] }] },
    { id: 'c2', name: 'Books', fields: [{ id: 'f2', name: 'ISBN', fieldType: 'TEXT', options: [] }] },
  ]
  renderModal({ categories: twoCats, selectedCategoryId: 'c1' })
  fireEvent.change(screen.getByPlaceholderText('Abstract'), { target: { value: 'text' } })
  fireEvent.click(screen.getByText('Papers'))
  fireEvent.click(screen.getByText('Books'))
  expect(screen.getByPlaceholderText('ISBN')).toBeInTheDocument()
  expect(screen.queryByPlaceholderText('Abstract')).not.toBeInTheDocument()
})

test('selecting an image file shows a preview', () => {
  global.URL.createObjectURL = vi.fn(() => 'blob:preview-url')
  renderWithFields()
  const imageInput = document.querySelector('input[type="file"][accept="image/*"]')
  const file = new File(['data'], 'photo.png', { type: 'image/png' })
  fireEvent.change(imageInput, { target: { files: [file] } })
  expect(document.querySelector('.upload-area-preview')).toBeInTheDocument()
})

test('attaching a file shows its name', () => {
  renderWithFields()
  const fileInput = [...document.querySelectorAll('input[type="file"]')].find(
    (el) => !el.accept
  )
  const file = new File(['data'], 'document.pdf', { type: 'application/pdf' })
  fireEvent.change(fileInput, { target: { files: [file] } })
  expect(screen.getByText('document.pdf')).toBeInTheDocument()
})

test('submitting with an image calls uploadImage', async () => {
  global.URL.createObjectURL = vi.fn(() => 'blob:preview-url')
  const { createItem, uploadImage } = await import('../../api/items')
  createItem.mockResolvedValueOnce({ data: { id: 'new-id' } })
  renderWithFields()
  const nameInput = screen.getAllByRole('textbox').find((el) => !el.placeholder)
  fireEvent.change(nameInput, { target: { value: 'With Image' } })
  const imageInput = document.querySelector('input[type="file"][accept="image/*"]')
  fireEvent.change(imageInput, { target: { files: [new File(['x'], 'i.png', { type: 'image/png' })] } })
  fireEvent.click(screen.getByText('Save'))
  await waitFor(() => expect(uploadImage).toHaveBeenCalledWith('new-id', expect.any(File)))
})

test('submitting with an attached file calls addFile', async () => {
  const { createItem, addFile } = await import('../../api/items')
  createItem.mockResolvedValueOnce({ data: { id: 'new-id' } })
  renderWithFields()
  const nameInput = screen.getAllByRole('textbox').find((el) => !el.placeholder)
  fireEvent.change(nameInput, { target: { value: 'With File' } })
  const fileInput = [...document.querySelectorAll('input[type="file"]')].find((el) => !el.accept)
  fireEvent.change(fileInput, { target: { files: [new File(['x'], 'doc.pdf')] } })
  fireEvent.click(screen.getByText('Save'))
  await waitFor(() => expect(addFile).toHaveBeenCalledWith('new-id', expect.any(File)))
})

test('does not submit when no category is selected', async () => {
  const { createItem } = await import('../../api/items')
  createItem.mockClear()
  renderModal({ categories: [], selectedCategoryId: '' })
  fireEvent.click(screen.getByText('Save'))
  await waitFor(() => expect(createItem).not.toHaveBeenCalled())
})
