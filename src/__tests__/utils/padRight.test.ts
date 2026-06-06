import { padRight } from '../../utils/padRight'

describe('padRight', () => {
  it('returns the string unchanged when already at padding length', () => {
    expect(padRight('hello', 5)).toBe('hello')
  })

  it('pads with spaces on the right', () => {
    expect(padRight('hi', 5)).toBe('hi   ')
  })

  it('returns the string unchanged when longer than padding', () => {
    expect(padRight('toolong', 3)).toBe('toolong')
  })

  it('handles empty string', () => {
    expect(padRight('', 3)).toBe('   ')
  })

  it('handles zero padding', () => {
    expect(padRight('hi', 0)).toBe('hi')
  })

  it('strips ANSI codes when measuring length', () => {
    const ansi = '\x1b[36mhi\x1b[0m'
    const result = padRight(ansi, 5)
    expect(result.startsWith(ansi)).toBe(true)
    expect(result.endsWith('   ')).toBe(true)
  })
})
