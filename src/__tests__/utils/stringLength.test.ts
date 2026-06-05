import { stringLength } from '../../utils/stringLength'

describe('stringLength', () => {
  it('returns 0 for empty string', () => {
    expect(stringLength('')).toBe(0)
  })

  it('returns correct length for plain string', () => {
    expect(stringLength('hello')).toBe(5)
    expect(stringLength('[---]')).toBe(5)
  })

  it('strips ANSI escape codes before measuring', () => {
    expect(stringLength('\x1b[36mhello\x1b[0m')).toBe(5)
    expect(stringLength('\x1b[36m-----\x1b[0m')).toBe(5)
  })

  it('handles mixed ANSI and plain text', () => {
    expect(stringLength('\x1b[32mGreen\x1b[0m text')).toBe(10)
  })
})
