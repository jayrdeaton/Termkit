import { wrap } from '../../utils/wrap'

const strip = (s: string) => s.replace(/\x1b\[[^a-zA-Z]*[a-zA-Z]/g, '')

describe('wrap', () => {
  it('returns string unchanged when shorter than width', () => {
    expect(wrap('hello world', 20)).toBe('hello world')
  })

  it('breaks long text at word boundaries', () => {
    expect(wrap('hello world foo', 11)).toBe('hello world\nfoo')
  })

  it('packs multiple words per line up to width', () => {
    const lines = wrap('one two three four five', 12).split('\n')
    expect(lines[0]).toBe('one two')
    expect(lines[1]).toBe('three four')
    expect(lines[2]).toBe('five')
  })

  it('does not add a trailing newline', () => {
    expect(wrap('hello world', 5)).not.toMatch(/\n$/)
  })

  it('handles a single word longer than width without crashing', () => {
    expect(() => wrap('superlongword', 5)).not.toThrow()
    expect(wrap('superlongword', 5)).toBe('superlongword')
  })

  it('handles an empty string', () => {
    expect(wrap('', 10)).toBe('')
  })

  it('produces a single line when everything fits', () => {
    expect(wrap('hi there', 20)).toBe('hi there')
  })

  it('measures ANSI escape codes as zero width', () => {
    const colored = '\x1b[32mhello\x1b[0m world foo'
    const lines = wrap(colored, 11).split('\n')
    expect(strip(lines[0])).toBe('hello world')
    expect(strip(lines[1])).toBe('foo')
  })
})
