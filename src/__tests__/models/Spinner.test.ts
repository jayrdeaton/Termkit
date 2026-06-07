import { Spinner } from '../../models/Spinner'

if (!process.stdout.clearLine) {
  process.stdout.clearLine = (_dir: number, callback?: () => void) => {
    callback?.()
    return true
  }
}

const mockWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
jest.spyOn(process.stdout, 'clearLine').mockImplementation(() => true)

const frames = () => mockWrite.mock.calls.filter((c) => !(c[0] as string).startsWith('\x1b[?25')).map((c) => c[0] as string)
const firstFrame = () => frames()[0]

beforeEach(() => {
  mockWrite.mockClear()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('Spinner constructor', () => {
  it('uses default braille frames', () => {
    const s = new Spinner()
    expect(s.frames).toEqual(Spinner.FRAMES.braille)
  })

  it('accepts custom frames', () => {
    const s = new Spinner({ frames: Spinner.FRAMES.line })
    expect(s.frames).toEqual(Spinner.FRAMES.line)
  })

  it('defaults interval to 80ms', () => {
    expect(new Spinner().interval).toBe(80)
  })

  it('exposes built-in frame sets', () => {
    expect(Spinner.FRAMES.braille).toHaveLength(10)
    expect(Spinner.FRAMES.line).toHaveLength(4)
    expect(Spinner.FRAMES.arrow).toHaveLength(8)
  })
})

describe('Spinner start/stop', () => {
  it('writes a frame on start', () => {
    const s = new Spinner()
    s.start()
    expect(mockWrite).toHaveBeenCalledWith(expect.stringMatching(/\r$/))
    s.stop()
  })

  it('advances to next frame each tick', () => {
    const s = new Spinner({ frames: ['A', 'B', 'C'] })
    s.start()
    const f1 = firstFrame()
    jest.runOnlyPendingTimers()
    const f2 = frames()[1]
    expect(f1).not.toBe(f2)
    s.stop()
  })

  it('writes stop message when provided', () => {
    const s = new Spinner()
    s.start()
    s.stop('Done!')
    expect(mockWrite).toHaveBeenCalledWith('Done!\n')
  })

  it('stops looping after stop()', () => {
    const s = new Spinner()
    s.start()
    s.stop()
    const count = mockWrite.mock.calls.length
    jest.advanceTimersByTime(500)
    expect(mockWrite.mock.calls.length).toBe(count)
  })
})

describe('Spinner prefix/suffix', () => {
  it('wraps frame with prefix and suffix strings', () => {
    const s = new Spinner({ frames: ['-'], prefix: '(', suffix: ')', colors: [] })
    s.start()
    const frame = firstFrame()
    expect(frame).toContain('(-)')
    s.stop()
  })
})

describe('Spinner text and reverse', () => {
  it('renders frame then text by default', () => {
    const s = new Spinner({ frames: ['-'], text: 'Loading', colors: [] })
    s.start()
    const frame = firstFrame()
    expect(frame).toMatch(/- Loading/)
    s.stop()
  })

  it('renders text then frame when reversed', () => {
    const s = new Spinner({ frames: ['-'], text: 'Loading', reverse: true, colors: [] })
    s.start()
    const frame = firstFrame()
    expect(frame).toMatch(/Loading -/)
    s.stop()
  })

  it('update() updates text inline without writing to stdout', () => {
    const s = new Spinner({ frames: ['-'] })
    s.start()
    mockWrite.mockClear()
    s.update('updated')
    expect(s.text).toBe('updated')
    expect(mockWrite).not.toHaveBeenCalled()
    s.stop()
  })

  it('update() returns this for chaining', () => {
    const s = new Spinner()
    expect(s.update('hello')).toBe(s)
  })

  it('updated text appears in subsequent frames', () => {
    const s = new Spinner({ frames: ['-'] })
    s.start()
    s.update('new label')
    jest.runOnlyPendingTimers()
    const frame = frames()[1]
    expect(frame).toContain('new label')
    s.stop()
  })

  it('renders only frame when text is empty', () => {
    const s = new Spinner({ frames: ['-'] })
    s.start()
    const frame = firstFrame()
    expect(frame).toContain('-')
    expect(frame).not.toContain(' ')
    s.stop()
  })

  it('pads frame to overwrite longer previous text', () => {
    const s = new Spinner({ frames: ['-'], text: 'long label here' })
    s.start()
    s.update('hi')
    jest.runOnlyPendingTimers()
    const frame = frames()[1]
    expect(frame).toMatch(/hi\s+\r$/)
    s.stop()
  })
})

describe('Spinner colors', () => {
  it('emits fg color codes when colors are set', () => {
    const s = new Spinner({ colors: ['#ff0000', '#0000ff'] })
    s.start()
    const frame = firstFrame()
    expect(frame).toContain('\x1b[38;2;')
    s.stop()
  })

  it('emits bg color codes when bgColors are set', () => {
    const s = new Spinner({ bgColors: ['#ff0000', '#0000ff'] })
    s.start()
    const frame = firstFrame()
    expect(frame).toContain('\x1b[48;2;')
    s.stop()
  })

  it('emits no color codes when colors is empty', () => {
    const s = new Spinner({ colors: [] })
    s.start()
    const frame = firstFrame()
    expect(frame).not.toContain('\x1b[38;2;')
    s.stop()
  })
})

describe('Spinner status methods', () => {
  it('succeed writes checkmark and message', () => {
    const s = new Spinner()
    s.succeed('Done')
    const call = mockWrite.mock.calls.find((c) => (c[0] as string).includes('✔'))
    expect(call?.[0]).toContain('Done')
  })

  it('fail writes cross and message', () => {
    const s = new Spinner()
    s.fail('Error')
    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('✖'))
  })

  it('warn writes warning symbol and message', () => {
    const s = new Spinner()
    s.warn('Caution')
    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('⚠'))
  })

  it('info writes info symbol and message', () => {
    const s = new Spinner()
    s.info('Note')
    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('ℹ'))
  })

  it('status methods write a newline', () => {
    const s = new Spinner()
    s.succeed('Done')
    const call = mockWrite.mock.calls.find((c) => (c[0] as string).includes('✔'))
    expect(call?.[0]).toMatch(/\n$/)
  })

  it('applies custom successColor hex', () => {
    const s = new Spinner({ successColor: '#a855f7' })
    s.succeed('Done')
    const call = mockWrite.mock.calls.find((c) => (c[0] as string).includes('✔'))
    expect(call?.[0]).toContain('\x1b[38;2;')
  })

  it('emits plain glyph when not TTY', () => {
    process.stdout.isTTY = false as unknown as true
    const s = new Spinner()
    s.succeed('Done')
    const call = mockWrite.mock.calls.find((c) => (c[0] as string).includes('✔'))
    expect(call?.[0]).not.toContain('\x1b[')
    process.stdout.isTTY = true
  })

  it('stop returns this for chaining', () => {
    const s = new Spinner()
    s.start()
    expect(s.stop()).toBe(s)
  })

  it('status methods return this for chaining', () => {
    const s = new Spinner()
    expect(s.succeed()).toBe(s)
    expect(s.fail()).toBe(s)
    expect(s.warn()).toBe(s)
    expect(s.info()).toBe(s)
  })
})

describe('Spinner log method', () => {
  it('uses faint middle dot as default glyph', () => {
    const s = new Spinner()
    s.log('fetching data')
    const call = mockWrite.mock.calls.find((c) => (c[0] as string).includes('fetching data'))
    expect(call?.[0]).toContain('·')
    expect(call?.[0]).toContain('\x1b[2m')
  })

  it('writes custom glyph and message with a space separator', () => {
    const s = new Spinner()
    s.log('fetching data', '→')
    expect(mockWrite).toHaveBeenCalledWith('→ fetching data\n')
  })

  it('omits the space when glyph is empty string', () => {
    const s = new Spinner()
    s.log('just a message', '')
    expect(mockWrite).toHaveBeenCalledWith('just a message\n')
  })

  it('clears the spinner line before writing', () => {
    const s = new Spinner({ frames: ['-'] })
    s.start()
    jest.spyOn(process.stdout, 'clearLine').mockClear()
    s.log('step done', '✓')
    expect(process.stdout.clearLine).toHaveBeenCalled()
    s.stop()
  })

  it('spinner continues running after log()', () => {
    const s = new Spinner({ frames: ['A', 'B'] })
    s.start()
    const countBefore = mockWrite.mock.calls.length
    s.log('log line', '→')
    jest.runOnlyPendingTimers()
    expect(mockWrite.mock.calls.length).toBeGreaterThan(countBefore + 1)
    s.stop()
  })

  it('returns this for chaining', () => {
    const s = new Spinner()
    expect(s.log('msg', '→')).toBe(s)
  })

  it('accepts a pre-colored ANSI glyph string', () => {
    const s = new Spinner()
    const coloredGlyph = '\x1b[32m✔\x1b[0m'
    s.log('colored glyph', coloredGlyph)
    expect(mockWrite).toHaveBeenCalledWith(`${coloredGlyph} colored glyph\n`)
  })
})

describe('Spinner onSpin callback', () => {
  it('fires onSpin after a full frame cycle', () => {
    const onSpin = jest.fn()
    const s = new Spinner({ frames: ['A', 'B', 'C'], onSpin })
    s.start()
    for (let i = 0; i < 4; i++) jest.runOnlyPendingTimers()
    expect(onSpin).toHaveBeenCalled()
    s.stop()
  })
})
