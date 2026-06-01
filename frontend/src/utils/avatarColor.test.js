import { avatarColor } from './avatarColor'

const COLORS = ['#2d1b4e', '#875262', '#4a6741', '#5b4a8a', '#8a6b2d', '#2d5b7a']

test('returns a string', () => {
  expect(typeof avatarColor('Papers')).toBe('string')
})

test('returns a color from the defined palette', () => {
  expect(COLORS).toContain(avatarColor('Papers'))
})

test('same input always returns same color', () => {
  expect(avatarColor('Notes')).toBe(avatarColor('Notes'))
})

test('handles empty string', () => {
  expect(COLORS).toContain(avatarColor(''))
})

test('different strings produce at least two distinct colors', () => {
  const results = new Set(['Papers', 'Notes', 'Books', 'Conferences', 'Research'].map(avatarColor))
  expect(results.size).toBeGreaterThan(1)
})
