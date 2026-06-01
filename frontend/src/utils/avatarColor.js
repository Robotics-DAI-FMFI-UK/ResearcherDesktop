const COLORS = ['#2d1b4e', '#875262', '#4a6741', '#5b4a8a', '#8a6b2d', '#2d5b7a']

export function avatarColor(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}
