import { Select, select } from '../../models/Select'

if (!process.stdin.setRawMode) {
  ;(process.stdin as NodeJS.ReadStream).setRawMode = () => process.stdin as NodeJS.ReadStream
}

const mockWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
jest.spyOn(process.stdin, 'setRawMode').mockImplementation(() => process.stdin as any)
jest.spyOn(process.stdin, 'pause').mockImplementation(() => process.stdin)
jest.spyOn(process.stdin, 'resume').mockImplementation(() => process.stdin)

function press(key: string) {
  process.stdin.emit('data', Buffer.from(key))
}

const items = [{ label: 'Option A' }, { label: 'Option B' }, { label: 'Option C' }]

beforeEach(() => {
  mockWrite.mockClear()
  process.stdout.isTTY = true
  process.stdin.isTTY = true
  jest.useFakeTimers()
})

afterEach(() => {
  process.stdout.isTTY = false
  process.stdin.isTTY = false
  jest.useRealTimers()
})

describe('Select - non-TTY', () => {
  it('throws when stdin is not a TTY', async () => {
    process.stdin.isTTY = false
    await expect(new Select().ask('Pick:', items)).rejects.toThrow('interactive terminal')
  })
})

describe('Select constructor defaults', () => {
  it('renders a prompt and item list on ask()', async () => {
    const p = new Select().ask('Pick one:', [{ label: 'A' }])
    press('\r')
    await p
    const output = mockWrite.mock.calls.map((c) => c[0] as string).join('')
    expect(output).toContain('Pick one:')
    expect(output).toContain('A')
  })

  it('includes a skip option in the list', async () => {
    const p = new Select().ask('Pick:', [{ label: 'A' }])
    press('\r')
    await p
    const output = mockWrite.mock.calls.map((c) => c[0] as string).join('')
    expect(output).toContain('Skip')
  })

  it('uses a custom skipLabel', async () => {
    const p = new Select({ skipLabel: 'None' }).ask('Pick:', [{ label: 'A' }])
    press('\r')
    await p
    const output = mockWrite.mock.calls.map((c) => c[0] as string).join('')
    expect(output).toContain('None')
  })
})

describe('Select - navigation and selection', () => {
  it('selects the first item on Enter without any navigation', async () => {
    const p = new Select().ask('Pick:', items)
    press('\r')
    await expect(p).resolves.toEqual({ label: 'Option A' })
  })

  it('down arrow moves selection to the next item', async () => {
    const p = new Select().ask('Pick:', items)
    press('\x1b[B')
    press('\r')
    await expect(p).resolves.toEqual({ label: 'Option B' })
  })

  it('up arrow from the first item wraps to the skip entry', async () => {
    const p = new Select().ask('Pick:', items)
    press('\x1b[A')
    press('\r')
    await expect(p).resolves.toBeNull()
  })

  it('down arrow wraps from the last item back to the first', async () => {
    const p = new Select().ask('Pick:', items)
    // Down 4 times: A→B→C→Skip→A
    press('\x1b[B')
    press('\x1b[B')
    press('\x1b[B')
    press('\x1b[B')
    press('\r')
    await expect(p).resolves.toEqual({ label: 'Option A' })
  })

  it('selecting the skip item returns null', async () => {
    const p = new Select().ask('Pick:', items)
    press('\x1b[B')
    press('\x1b[B')
    press('\x1b[B')
    press('\r')
    await expect(p).resolves.toBeNull()
  })

  it('number key 1 jumps to the first item', async () => {
    const p = new Select().ask('Pick:', items)
    press('\x1b[B') // move to B first
    press('1') // jump back to index 0 (A)
    press('\r')
    await expect(p).resolves.toEqual({ label: 'Option A' })
  })

  it('number key 2 jumps to the second item', async () => {
    const p = new Select().ask('Pick:', items)
    press('2')
    press('\r')
    await expect(p).resolves.toEqual({ label: 'Option B' })
  })

  it('number key 0 jumps to the skip item', async () => {
    const p = new Select().ask('Pick:', items)
    press('0')
    press('\r')
    await expect(p).resolves.toBeNull()
  })
})

describe('Select - item descriptions', () => {
  it('renders item description alongside label', async () => {
    const p = new Select().ask('Pick:', [{ label: 'Foo', description: 'bar baz' }])
    press('\r')
    await p
    const output = mockWrite.mock.calls.map((c) => c[0] as string).join('')
    expect(output).toContain('bar baz')
  })
})

describe('select() convenience function', () => {
  it('throws when stdin is not a TTY', async () => {
    process.stdin.isTTY = false
    await expect(select('Pick:', items)).rejects.toThrow('interactive terminal')
  })

  it('resolves the selected item', async () => {
    const p = select('Pick:', items)
    press('\r')
    await expect(p).resolves.toEqual({ label: 'Option A' })
  })

  it('passes options to the Select instance', async () => {
    const p = select('Pick:', [{ label: 'A' }], { skipLabel: 'Cancel' })
    press('\r')
    await p
    const output = mockWrite.mock.calls.map((c) => c[0] as string).join('')
    expect(output).toContain('Cancel')
  })
})
