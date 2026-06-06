import { padSides } from '../../utils/padSides'

describe('padSides', () => {
  it('returns the string unchanged when already at padding length', () => {
    expect(padSides('hello', 5)).toBe('hello')
  })

  it('adds one space to the right for one extra character of padding', () => {
    expect(padSides('hi', 3)).toBe('hi ')
  })

  it('adds a space right then left for two extra characters of padding', () => {
    expect(padSides('hi', 4)).toBe(' hi ')
  })

  it('centers a single character in a wider padding', () => {
    const result = padSides('x', 5)
    expect(result).toHaveLength(5)
    expect(result).toContain('x')
  })

  it('returns the string unchanged when longer than padding', () => {
    expect(padSides('toolong', 3)).toBe('toolong')
  })

  it('handles empty string', () => {
    expect(padSides('', 4)).toBe('    ')
  })

  it('handles zero padding', () => {
    expect(padSides('hi', 0)).toBe('hi')
  })

  it('strips ANSI codes when measuring length', () => {
    const ansi = '\x1b[36mhi\x1b[0m'
    const result = padSides(ansi, 4)
    expect(result).toContain(ansi)
  })

  it('centers the string with equal padding on both sides for even extra space', () => {
    // 'hi' (len 2) → 6: right→'hi ', left→' hi ', right→' hi  ', left→'  hi  '
    const result = padSides('hi', 6)
    expect(result).toHaveLength(6)
    expect(result.trim()).toBe('hi')
    expect(result).toBe('  hi  ')
  })
})
