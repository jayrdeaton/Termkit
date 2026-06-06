import { padLeft } from '../../utils/padLeft'

describe('padLeft', () => {
  it('returns the string unchanged when already at padding length', () => {
    expect(padLeft('hello', 5)).toBe('hello')
  })

  it('pads with spaces on the left', () => {
    expect(padLeft('hi', 5)).toBe('   hi')
  })

  it('returns the string unchanged when longer than padding', () => {
    expect(padLeft('toolong', 3)).toBe('toolong')
  })

  it('handles empty string', () => {
    expect(padLeft('', 3)).toBe('   ')
  })

  it('handles zero padding', () => {
    expect(padLeft('hi', 0)).toBe('hi')
  })

  it('strips ANSI codes when measuring length', () => {
    const ansi = '\x1b[36mhi\x1b[0m'
    const result = padLeft(ansi, 5)
    expect(result.endsWith(ansi)).toBe(true)
    expect(result.startsWith('   ')).toBe(true)
  })
})
