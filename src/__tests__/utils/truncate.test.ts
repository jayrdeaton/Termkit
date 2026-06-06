import { truncate } from '../../utils/truncate'

const strip = (s: string) => s.replace(/\x1b\[[^a-zA-Z]*[a-zA-Z]/g, '')

describe('truncate', () => {
  it('returns string unchanged when within maxLength', () => {
    expect(truncate('hello world', 20)).toBe('hello world')
  })

  it('returns string unchanged when exactly at maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('truncates and appends default suffix', () => {
    expect(strip(truncate('hello world', 8))).toBe('hello w…')
  })

  it('uses a custom suffix', () => {
    // maxLength 9, suffix '...' = 3, so 6 visible chars: 'hello '
    expect(strip(truncate('hello world', 9, '...'))).toBe('hello ...')
  })

  it('handles maxLength equal to suffix length', () => {
    const result = truncate('hello', 1)
    expect(strip(result)).toBe('…')
  })

  it('handles maxLength of 0 gracefully', () => {
    expect(() => truncate('hello', 0)).not.toThrow()
  })

  it('does not append RESET when string has no ANSI codes', () => {
    const result = truncate('hello world', 8)
    expect(result).not.toContain('\x1b[')
  })

  it('appends RESET when input contains ANSI codes', () => {
    const result = truncate('\x1b[32mhello world\x1b[0m', 8)
    expect(result).toContain('\x1b[0m')
  })

  it('measures ANSI escape sequences as zero width', () => {
    // maxLength 8, suffix '…' = 1, so 7 visible chars: 'hello w'
    const colored = '\x1b[32mhello\x1b[0m world'
    expect(strip(truncate(colored, 8))).toBe('hello w…')
  })

  it('preserves opening ANSI codes before the cut point', () => {
    const result = truncate('\x1b[32mhello world\x1b[0m', 8)
    expect(result.startsWith('\x1b[32m')).toBe(true)
  })
})
