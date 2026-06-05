import { Input, input } from '../../models/Input'

if (!process.stdin.setRawMode) {
  ;(process.stdin as NodeJS.ReadStream).setRawMode = () => process.stdin as NodeJS.ReadStream
}

const mockWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
jest.spyOn(process.stdin, 'setRawMode').mockImplementation(() => process.stdin as any)
jest.spyOn(process.stdin, 'pause').mockImplementation(() => process.stdin)
jest.spyOn(process.stdin, 'resume').mockImplementation(() => process.stdin)

function type(str: string) {
  for (const ch of str) process.stdin.emit('data', Buffer.from(ch))
}

function press(key: string) {
  process.stdin.emit('data', Buffer.from(key))
}

function backspace(n: number) {
  for (let i = 0; i < n; i++) press('\x7f')
}

beforeEach(() => {
  mockWrite.mockClear()
  process.stdout.isTTY = true
  process.stdin.isTTY = true
})

afterEach(() => {
  process.stdout.isTTY = false
  process.stdin.isTTY = false
})

describe('Input - non-TTY', () => {
  it('throws when stdin is not a TTY', async () => {
    process.stdin.isTTY = false
    await expect(new Input().ask('Enter:')).rejects.toThrow('interactive terminal')
  })
})

describe('Input - string type', () => {
  it('resolves with the typed string', async () => {
    const p = new Input().ask('Enter:')
    type('hello')
    press('\r')
    await expect(p).resolves.toBe('hello')
  })

  it('escape resolves null when required=false', async () => {
    const p = new Input({ required: false }).ask('Enter:')
    press('\x1b')
    await expect(p).resolves.toBeNull()
  })

  it('backspace removes the last character', async () => {
    const p = new Input().ask('Enter:')
    type('helloo')
    backspace(1)
    press('\r')
    await expect(p).resolves.toBe('hello')
  })

  it('uses the default value when input is empty', async () => {
    const p = new Input({ default: 'fallback' }).ask('Enter:')
    press('\r')
    await expect(p).resolves.toBe('fallback')
  })

  it('prefers typed value over the default', async () => {
    const p = new Input({ default: 'fallback' }).ask('Enter:')
    type('typed')
    press('\r')
    await expect(p).resolves.toBe('typed')
  })
})

describe('Input - number type', () => {
  it('resolves with the parsed number', async () => {
    const p = new Input({ type: 'number' }).ask('Enter:')
    type('42')
    press('\r')
    await expect(p).resolves.toBe(42)
  })

  it('shows error for non-numeric input', async () => {
    const p = new Input({ type: 'number' }).ask('Enter:')
    type('abc')
    press('\r')
    const wrote = mockWrite.mock.calls.map((c) => c[0] as string).join('')
    expect(wrote).toContain('Must be a valid number')
    backspace(3)
    type('1')
    press('\r')
    await p
  })

  it('enforces min constraint', async () => {
    const p = new Input({ type: 'number', min: 10 }).ask('Enter:')
    type('5')
    press('\r')
    backspace(1)
    type('10')
    press('\r')
    await expect(p).resolves.toBe(10)
  })

  it('enforces max constraint', async () => {
    const p = new Input({ type: 'number', max: 10 }).ask('Enter:')
    type('20')
    press('\r')
    backspace(2)
    type('10')
    press('\r')
    await expect(p).resolves.toBe(10)
  })
})

describe('Input - integer type', () => {
  it('resolves with the parsed integer', async () => {
    const p = new Input({ type: 'integer' }).ask('Enter:')
    type('7')
    press('\r')
    await expect(p).resolves.toBe(7)
  })

  it('rejects float values', async () => {
    const p = new Input({ type: 'integer' }).ask('Enter:')
    type('3.5')
    press('\r')
    backspace(3)
    type('3')
    press('\r')
    await expect(p).resolves.toBe(3)
  })

  it('enforces integer min constraint', async () => {
    const p = new Input({ type: 'integer', min: 5 }).ask('Enter:')
    type('2')
    press('\r')
    backspace(1)
    type('5')
    press('\r')
    await expect(p).resolves.toBe(5)
  })

  it('enforces integer max constraint', async () => {
    const p = new Input({ type: 'integer', max: 5 }).ask('Enter:')
    type('9')
    press('\r')
    backspace(1)
    type('5')
    press('\r')
    await expect(p).resolves.toBe(5)
  })
})

describe('Input - enum type', () => {
  it('resolves with a valid enum value', async () => {
    const p = new Input({ type: 'enum', enum: ['a', 'b', 'c'] }).ask('Choose:')
    type('b')
    press('\r')
    await expect(p).resolves.toBe('b')
  })

  it('rejects a value not in the enum list', async () => {
    const p = new Input({ type: 'enum', enum: ['a', 'b'] }).ask('Choose:')
    type('z')
    press('\r')
    backspace(1)
    type('a')
    press('\r')
    await expect(p).resolves.toBe('a')
  })
})

describe('Input - match', () => {
  it('resolves when value matches the expected string', async () => {
    const p = new Input({ match: 'secret' }).ask('Enter:')
    type('secret')
    press('\r')
    await expect(p).resolves.toBe('secret')
  })

  it('rejects when value does not match', async () => {
    const p = new Input({ match: 'secret' }).ask('Enter:')
    type('wrong')
    press('\r')
    backspace(5)
    type('secret')
    press('\r')
    await expect(p).resolves.toBe('secret')
  })
})

describe('Input - regex', () => {
  it('resolves when value matches the regex', async () => {
    const p = new Input({ regex: /^\d+$/ }).ask('Enter:')
    type('123')
    press('\r')
    await expect(p).resolves.toBe('123')
  })

  it('rejects when value fails the regex', async () => {
    const p = new Input({ regex: /^\d+$/ }).ask('Enter:')
    type('abc')
    press('\r')
    backspace(3)
    type('123')
    press('\r')
    await expect(p).resolves.toBe('123')
  })
})

describe('Input - length constraints', () => {
  it('enforces minLength', async () => {
    const p = new Input({ minLength: 3 }).ask('Enter:')
    type('ab')
    press('\r')
    type('c')
    press('\r')
    await expect(p).resolves.toBe('abc')
  })

  it('blocks characters beyond maxLength', async () => {
    const p = new Input({ maxLength: 3 }).ask('Enter:')
    type('abcde')
    press('\r')
    await expect(p).resolves.toBe('abc')
  })

  it('enforces maxLength at validation too', async () => {
    const p = new Input({ maxLength: 5 }).ask('Enter:')
    type('hello')
    press('\r')
    await expect(p).resolves.toBe('hello')
  })
})

describe('Input - boolean type', () => {
  it('resolves true on y keypress', async () => {
    const p = new Input({ type: 'boolean' }).ask('Continue?')
    press('y')
    await expect(p).resolves.toBe(true)
  })

  it('resolves true on Y keypress', async () => {
    const p = new Input({ type: 'boolean' }).ask('Continue?')
    press('Y')
    await expect(p).resolves.toBe(true)
  })

  it('resolves false on n keypress', async () => {
    const p = new Input({ type: 'boolean' }).ask('Continue?')
    press('n')
    await expect(p).resolves.toBe(false)
  })

  it('resolves false on N keypress', async () => {
    const p = new Input({ type: 'boolean' }).ask('Continue?')
    press('N')
    await expect(p).resolves.toBe(false)
  })

  it('uses default true on Enter', async () => {
    const p = new Input({ type: 'boolean', default: true }).ask('Continue?')
    press('\r')
    await expect(p).resolves.toBe(true)
  })

  it('uses default false on Enter', async () => {
    const p = new Input({ type: 'boolean', default: false }).ask('Continue?')
    press('\r')
    await expect(p).resolves.toBe(false)
  })

  it('escape resolves null when required=false', async () => {
    const p = new Input({ type: 'boolean', required: false }).ask('Continue?')
    press('\x1b')
    await expect(p).resolves.toBeNull()
  })
})

describe('input() convenience function', () => {
  it('throws when stdin is not a TTY', async () => {
    process.stdin.isTTY = false
    await expect(input('Enter:')).rejects.toThrow('interactive terminal')
  })

  it('resolves typed string value', async () => {
    const p = input('Enter:')
    type('hi')
    press('\r')
    await expect(p).resolves.toBe('hi')
  })

  it('resolves number when type: number specified', async () => {
    const p = input('Enter:', { type: 'number' })
    type('3')
    press('\r')
    await expect(p).resolves.toBe(3)
  })

  it('resolves boolean when type: boolean specified', async () => {
    const p = input('Continue?', { type: 'boolean' })
    press('y')
    await expect(p).resolves.toBe(true)
  })
})
