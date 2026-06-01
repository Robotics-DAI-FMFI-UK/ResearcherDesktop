import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ItemDetailPage from './ItemDetailPage'
import { vi } from 'vitest'

const mockNavigate = vi.fn()
const mockUseItem = vi.fn()
const mockCreateEvent = vi.fn()
const mockCreateKeyword = vi.fn()

const mockItem = {
  id: '1',
  title: 'Test Paper',
  date: '2024-01-15',
  categoryId: '1',
  categoryName: 'Papers',
  imagePath: null,
  fieldValues: [],
  keywords: [],
  relatedItems: [],
  files: [],
  links: [],
  comments: [],
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => mockNavigate,
    useOutletContext: () => ({ categories: [], onCategoriesChange: vi.fn() }),
  }
})

vi.mock('../../hooks/useItem', () => ({ useItem: (...args) => mockUseItem(...args) }))
vi.mock('../../hooks/useItems', () => ({ useItems: () => ({ items: [], fetchItems: vi.fn() }) }))
vi.mock('../../hooks/useKeywords', () => ({
  useKeywords: () => ({ keywords: [], createKeyword: mockCreateKeyword }),
}))
vi.mock('../../hooks/useCalendar', () => ({
  useCalendar: () => ({ createEvent: mockCreateEvent }),
}))
vi.mock('../../utils/icons', () => ({ Icon: ({ name }) => <span>{name}</span> }))
vi.mock('../../utils/avatarColor', () => ({ avatarColor: () => '#123456' }))
vi.mock('../../components/LinkModal/LinkModal', () => ({ default: () => null }))
vi.mock('../../components/CustomSelect/CustomSelect', () => ({ default: () => null }))
vi.mock('../../components/CustomDatePicker/CustomDatePicker', () => ({ default: () => null }))
vi.mock('../../components/CustomDateTimePicker/CustomDateTimePicker', () => ({ default: () => null }))
vi.mock('../../components/MultiSelect/MultiSelect', () => ({ default: () => null }))

const defaultHookReturn = {
  item: mockItem,
  refetch: vi.fn(),
  updateItem: vi.fn().mockResolvedValue({}),
  deleteItem: vi.fn().mockResolvedValue({}),
  addFile: vi.fn().mockResolvedValue({}),
  deleteFile: vi.fn().mockResolvedValue({}),
  getFile: vi.fn().mockRejectedValue(new Error('no file')),
  addComment: vi.fn().mockResolvedValue({}),
  deleteComment: vi.fn().mockResolvedValue({}),
  updateComment: vi.fn().mockResolvedValue({}),
  addLink: vi.fn().mockResolvedValue({}),
  deleteLink: vi.fn().mockResolvedValue({}),
  addRelation: vi.fn().mockResolvedValue({}),
  removeRelation: vi.fn().mockResolvedValue({}),
}

beforeEach(() => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn })
  mockNavigate.mockReset()
  mockCreateEvent.mockReset().mockResolvedValue({})
  mockCreateKeyword.mockReset()
})

function renderPage() {
  return render(<MemoryRouter><ItemDetailPage /></MemoryRouter>)
}


test('shows loading text when item is null', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: null })
  renderPage()
  expect(screen.getByText('Loading…')).toBeInTheDocument()
})

test('renders item title', () => {
  renderPage()
  expect(screen.getAllByText('Test Paper').length).toBeGreaterThan(0)
})

test('renders category name and date', () => {
  renderPage()
  expect(screen.getByText('Papers')).toBeInTheDocument()
  expect(screen.getByText('2024-01-15')).toBeInTheDocument()
})

test('back button navigates to /', () => {
  renderPage()
  fireEvent.click(screen.getByText('← Back to list'))
  expect(mockNavigate).toHaveBeenCalledWith('/')
})

test('category link navigates to category filter page', () => {
  renderPage()
  fireEvent.click(screen.getByRole('button', { name: 'Papers' }))
  expect(mockNavigate).toHaveBeenCalledWith('/?categoryId=1')
})


test('shows delete confirm modal when Delete is clicked', () => {
  renderPage()
  fireEvent.click(screen.getByText('Delete'))
  expect(screen.getByText(/delete item/i)).toBeInTheDocument()
})

test('cancels delete confirm modal', () => {
  renderPage()
  fireEvent.click(screen.getByText('Delete'))
  fireEvent.click(screen.getByText('Cancel'))
  expect(screen.queryByText(/delete item/i)).not.toBeInTheDocument()
})

test('confirming delete calls deleteItem and navigates home', async () => {
  const deleteItem = vi.fn().mockResolvedValue(undefined)
  mockUseItem.mockReturnValue({ ...defaultHookReturn, deleteItem })
  renderPage()
  fireEvent.click(screen.getByText('Delete'))
  fireEvent.click(document.querySelector('.delete-modal-confirm'))
  await waitFor(() => {
    expect(deleteItem).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})


test('shows "No files attached" when files is empty', () => {
  renderPage()
  expect(screen.getByText('No files attached.')).toBeInTheDocument()
})

const itemWithFiles = {
  ...mockItem,
  files: [
    { id: 'f1', fileName: 'paper.pdf', filePath: 'uploads/paper.pdf' },
    { id: 'f2', fileName: 'notes.txt', filePath: 'uploads/notes.txt' },
  ],
}

test('renders file names when files are present', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithFiles })
  renderPage()
  expect(screen.getByText('paper.pdf')).toBeInTheDocument()
  expect(screen.getByText('notes.txt')).toBeInTheDocument()
})

test('shows Download button for each file', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithFiles })
  renderPage()
  expect(screen.getAllByText('Download').length).toBe(2)
})

test('clicking file remove button calls deleteFile', async () => {
  const deleteFile = vi.fn().mockResolvedValue(undefined)
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithFiles, deleteFile })
  renderPage()
  fireEvent.click(document.querySelectorAll('.detail-file-remove')[0])
  await waitFor(() => expect(deleteFile).toHaveBeenCalledWith('f1'))
})


test('shows "No links yet" when links is empty', () => {
  renderPage()
  expect(screen.getByText('No links yet.')).toBeInTheDocument()
})

const itemWithLinks = {
  ...mockItem,
  links: [{ id: 'l1', url: 'https://example.com', name: 'Example Site', description: 'A useful link' }],
}

test('renders link name and href', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithLinks })
  renderPage()
  const link = screen.getByRole('link', { name: 'Example Site' })
  expect(link).toBeInTheDocument()
  expect(link.getAttribute('href')).toBe('https://example.com')
})

test('renders link description', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithLinks })
  renderPage()
  expect(screen.getByText('A useful link')).toBeInTheDocument()
})

test('delete link button calls deleteLink', async () => {
  const deleteLink = vi.fn().mockResolvedValue(undefined)
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithLinks, deleteLink })
  renderPage()
  fireEvent.click(document.querySelector('.detail-file-remove'))
  await waitFor(() => expect(deleteLink).toHaveBeenCalledWith('l1'))
})

test('"Add link" + button opens AddLinkModal', () => {
  renderPage()
  fireEvent.click(screen.getByTitle('Add link'))
  expect(screen.getByText('Add Link')).toBeInTheDocument()
})

test('AddLinkModal Cancel closes modal', () => {
  renderPage()
  fireEvent.click(screen.getByTitle('Add link'))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByText('Add Link')).not.toBeInTheDocument()
})

test('AddLinkModal submits with URL and calls addLink', async () => {
  const addLink = vi.fn().mockResolvedValue({})
  mockUseItem.mockReturnValue({ ...defaultHookReturn, addLink })
  renderPage()
  fireEvent.click(screen.getByTitle('Add link'))
  fireEvent.change(screen.getByPlaceholderText('https://…'), { target: { value: 'https://test.com' } })
  fireEvent.change(screen.getByPlaceholderText('Display name'), { target: { value: 'Test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
  await waitFor(() => expect(addLink).toHaveBeenCalledWith('https://test.com', 'Test', null))
})


test('shows "No comments yet" when comments is empty', () => {
  renderPage()
  expect(screen.getByText('No comments yet.')).toBeInTheDocument()
})

const itemWithComments = {
  ...mockItem,
  comments: [
    { id: 'c1', text: 'This is a useful finding' },
    { id: 'c2', text: 'Follow-up needed' },
  ],
}

test('renders comment text', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithComments })
  renderPage()
  expect(screen.getByText('This is a useful finding')).toBeInTheDocument()
  expect(screen.getByText('Follow-up needed')).toBeInTheDocument()
})

test('delete comment button calls deleteComment', async () => {
  const deleteComment = vi.fn().mockResolvedValue(undefined)
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithComments, deleteComment })
  renderPage()
  fireEvent.click(document.querySelectorAll('.detail-comment-delete')[0])
  await waitFor(() => expect(deleteComment).toHaveBeenCalledWith('c1'))
})

test('clicking comment text starts inline editing', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithComments })
  renderPage()
  fireEvent.click(screen.getByText('This is a useful finding'))
  expect(document.querySelector('.detail-comment-edit-input')).toBeInTheDocument()
})

test('Enter in comment edit calls updateComment', async () => {
  const updateComment = vi.fn().mockResolvedValue({})
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithComments, updateComment })
  renderPage()
  fireEvent.click(screen.getByText('This is a useful finding'))
  const input = document.querySelector('.detail-comment-edit-input')
  fireEvent.change(input, { target: { value: 'Updated finding' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  await waitFor(() => expect(updateComment).toHaveBeenCalledWith('c1', 'Updated finding'))
})

test('Save button in comment edit calls updateComment', async () => {
  const updateComment = vi.fn().mockResolvedValue({})
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithComments, updateComment })
  renderPage()
  fireEvent.click(screen.getByText('This is a useful finding'))
  fireEvent.change(document.querySelector('.detail-comment-edit-input'), { target: { value: 'New text' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(updateComment).toHaveBeenCalledWith('c1', 'New text'))
})

test('Escape in comment edit discards changes', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithComments })
  renderPage()
  fireEvent.click(screen.getByText('This is a useful finding'))
  fireEvent.keyDown(document.querySelector('.detail-comment-edit-input'), { key: 'Escape' })
  expect(document.querySelector('.detail-comment-edit-input')).not.toBeInTheDocument()
})

test('Cancel button in comment edit discards changes', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithComments })
  renderPage()
  fireEvent.click(screen.getByText('This is a useful finding'))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.getByText('This is a useful finding')).toBeInTheDocument()
})

test('"Add comment" + button opens AddCommentModal', () => {
  renderPage()
  fireEvent.click(screen.getByTitle('Add comment'))
  expect(screen.getByText('Add Comment')).toBeInTheDocument()
})

test('AddCommentModal submits text and calls addComment', async () => {
  const addComment = vi.fn().mockResolvedValue({})
  mockUseItem.mockReturnValue({ ...defaultHookReturn, addComment })
  renderPage()
  fireEvent.click(screen.getByTitle('Add comment'))
  fireEvent.change(document.querySelector('.modal-textarea'), { target: { value: 'Great observation' } })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
  await waitFor(() => expect(addComment).toHaveBeenCalledWith('Great observation'))
})


test('shows "No linked data yet" when relatedItems is empty', () => {
  renderPage()
  expect(screen.getByText(/No linked data yet/)).toBeInTheDocument()
})

const itemWithRelated = {
  ...mockItem,
  relatedItems: [
    { id: 'r1', title: 'Related Paper', categoryName: 'Papers' },
    { id: 'r2', title: 'Related Conference', categoryName: 'Conferences' },
  ],
}

test('renders related item titles', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithRelated })
  renderPage()
  expect(screen.getByText('Related Paper')).toBeInTheDocument()
})

test('shows related items count badge', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithRelated })
  renderPage()
  expect(screen.getByText('2')).toBeInTheDocument()
})

test('clicking related item navigates to its detail page', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithRelated })
  renderPage()
  fireEvent.click(screen.getByText('Related Paper'))
  expect(mockNavigate).toHaveBeenCalledWith('/items/r1')
})

test('unlink button calls removeRelation', async () => {
  const removeRelation = vi.fn().mockResolvedValue(undefined)
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: itemWithRelated, removeRelation })
  renderPage()
  fireEvent.click(screen.getAllByTitle('Remove link')[0])
  await waitFor(() => expect(removeRelation).toHaveBeenCalledWith('r1'))
})


test('clicking the title starts inline editing', () => {
  renderPage()
  fireEvent.click(document.querySelector('.detail-title'))
  expect(document.querySelector('.detail-title-input')).toBeInTheDocument()
})

test('Escape cancels title editing', () => {
  renderPage()
  fireEvent.click(document.querySelector('.detail-title'))
  fireEvent.keyDown(document.querySelector('.detail-title-input'), { key: 'Escape' })
  expect(document.querySelector('.detail-title-input')).not.toBeInTheDocument()
})

test('Enter saves changed title via updateItem', async () => {
  const updateItem = vi.fn().mockResolvedValue({})
  mockUseItem.mockReturnValue({ ...defaultHookReturn, updateItem })
  renderPage()
  fireEvent.click(document.querySelector('.detail-title'))
  fireEvent.change(document.querySelector('.detail-title-input'), { target: { value: 'New Title' } })
  fireEvent.keyDown(document.querySelector('.detail-title-input'), { key: 'Enter' })
  await waitFor(() =>
    expect(updateItem).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }))
  )
})


const makeItem = (fieldType, value, options = []) => ({
  ...mockItem,
  fieldValues: [{ fieldId: 'fv1', fieldName: 'MyField', fieldType, value, options }],
})

test('CHECKBOX field shows Yes when value is true', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('CHECKBOX', 'true') })
  renderPage()
  expect(screen.getByText('Yes')).toBeInTheDocument()
})

test('CHECKBOX field shows No when value is false', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('CHECKBOX', 'false') })
  renderPage()
  expect(screen.getByText('No')).toBeInTheDocument()
})

test('CHECKBOX field calls updateItem when toggled', async () => {
  const updateItem = vi.fn().mockResolvedValue({})
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('CHECKBOX', 'false'), updateItem })
  renderPage()
  fireEvent.click(document.querySelector('input[type="checkbox"]'))
  await waitFor(() => expect(updateItem).toHaveBeenCalled())
})

test('DROPDOWN field renders label without crashing', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('DROPDOWN', 'Active', ['Active', 'Inactive']) })
  renderPage()
  expect(screen.getByText('MyField')).toBeInTheDocument()
})

test('DATE field renders label without crashing', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('DATE', '2024-06-01') })
  renderPage()
  expect(screen.getByText('MyField')).toBeInTheDocument()
})

test('TEXT field shows value text', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('TEXT', 'Some notes') })
  renderPage()
  expect(screen.getByText('Some notes')).toBeInTheDocument()
})

test('clicking TEXT field value starts editing with textarea', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('TEXT', 'Initial text') })
  renderPage()
  fireEvent.click(screen.getByText('Initial text'))
  expect(document.querySelector('.detail-field-textarea')).toBeInTheDocument()
})

test('Enter in TEXT field textarea saves value', async () => {
  const updateItem = vi.fn().mockResolvedValue({})
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('TEXT', 'Old'), updateItem })
  renderPage()
  fireEvent.click(screen.getByText('Old'))
  const ta = document.querySelector('.detail-field-textarea')
  fireEvent.change(ta, { target: { value: 'New value' } })
  fireEvent.keyDown(ta, { key: 'Enter' })
  await waitFor(() => expect(updateItem).toHaveBeenCalled())
})

test('Escape in TEXT field textarea cancels editing', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('TEXT', 'Some text') })
  renderPage()
  fireEvent.click(screen.getByText('Some text'))
  fireEvent.keyDown(document.querySelector('.detail-field-textarea'), { key: 'Escape' })
  expect(document.querySelector('.detail-field-textarea')).not.toBeInTheDocument()
})

test('NUMBER field shows value', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('NUMBER', '42') })
  renderPage()
  expect(screen.getByText('42')).toBeInTheDocument()
})

test('clicking NUMBER field starts editing with number input', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('NUMBER', '5') })
  renderPage()
  fireEvent.click(screen.getByText('5'))
  expect(document.querySelector('.detail-field-input[type="number"]')).toBeInTheDocument()
})

test('Enter in NUMBER field saves value', async () => {
  const updateItem = vi.fn().mockResolvedValue({})
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('NUMBER', '10'), updateItem })
  renderPage()
  fireEvent.click(screen.getByText('10'))
  const input = document.querySelector('.detail-field-input')
  fireEvent.change(input, { target: { value: '20' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  await waitFor(() => expect(updateItem).toHaveBeenCalled())
})

test('empty TEXT field shows placeholder', () => {
  mockUseItem.mockReturnValue({ ...defaultHookReturn, item: makeItem('TEXT', '') })
  renderPage()
  expect(screen.getByText('Click to fill in…')).toBeInTheDocument()
})


test('Add to Calendar button opens calendar modal', () => {
  renderPage()
  fireEvent.click(document.querySelector('.detail-calendar-btn'))
  expect(screen.getByRole('heading', { name: 'Add to Calendar' })).toBeInTheDocument()
})

test('Cancel in calendar modal closes it', () => {
  renderPage()
  fireEvent.click(document.querySelector('.detail-calendar-btn'))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('heading', { name: 'Add to Calendar' })).not.toBeInTheDocument()
})

test('Add Event button in calendar modal calls createEvent', async () => {
  renderPage()
  fireEvent.click(document.querySelector('.detail-calendar-btn'))
  fireEvent.click(screen.getByRole('button', { name: 'Add Event' }))
  await waitFor(() => expect(mockCreateEvent).toHaveBeenCalled())
})


test('shows suggested keyword based on categoryName', () => {
  renderPage()
  expect(screen.getByText('+ Papers')).toBeInTheDocument()
})

test('clicking suggested new keyword calls createKeyword and saveKeywords', async () => {
  mockCreateKeyword.mockResolvedValue({ id: 'kw1', name: 'Papers' })
  const updateItem = vi.fn().mockResolvedValue({})
  mockUseItem.mockReturnValue({ ...defaultHookReturn, updateItem })
  renderPage()
  fireEvent.click(screen.getByText('+ Papers'))
  await waitFor(() => expect(mockCreateKeyword).toHaveBeenCalledWith('Papers'))
  await waitFor(() => expect(updateItem).toHaveBeenCalled())
})
