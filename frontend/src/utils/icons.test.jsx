import { render } from '@testing-library/react'
import { Icon, ICON_NAMES } from './icons'

test('ICON_NAMES is a non-empty array', () => {
  expect(Array.isArray(ICON_NAMES)).toBe(true)
  expect(ICON_NAMES.length).toBeGreaterThan(0)
})

test('ICON_NAMES contains common icon names', () => {
  expect(ICON_NAMES).toContain('folder')
  expect(ICON_NAMES).toContain('calendar')
})

test('Icon renders an svg element', () => {
  const { container } = render(<Icon name="folder" size={16} />)
  expect(container.querySelector('svg')).toBeTruthy()
})

test('Icon applies the given size as width and height', () => {
  const { container } = render(<Icon name="folder" size={24} />)
  const svg = container.querySelector('svg')
  expect(svg.getAttribute('width')).toBe('24')
  expect(svg.getAttribute('height')).toBe('24')
})

test('Icon renders for an unknown name without crashing', () => {
  expect(() => render(<Icon name="nonexistent-icon" size={16} />)).not.toThrow()
})
