import { config } from '@/config'
import { colorText, GREEN, RED, RESET } from '@/utils/color'
import { stringLength } from '@/utils/stringLength'

export type InputType = 'string' | 'number' | 'integer' | 'boolean' | 'enum'

export type InputReturn<T extends InputType> = T extends 'number' | 'integer' ? number : T extends 'boolean' ? boolean : string

export interface InputOptions {
  promptColor?: string
  promptGlyph?: string
  inputColor?: string
  errorColor?: string
  placeholder?: string
  mask?: boolean
  inline?: boolean
  required?: boolean
  type?: InputType
  default?: string | number | boolean
  enum?: string[]
  match?: string
  errorMessage?: string
  regex?: RegExp
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
}

const CLEAR_LINE = '\x1b[2K'

export class Input<T extends InputType = 'string'> {
  private promptColor: string
  private promptGlyph: string
  private inputColor: string
  private errorColor: string
  private placeholder: string
  private mask: boolean
  private type: T
  private defaultValue: string | number | boolean | null
  private enumValues: string[] | null
  private match: string | null
  private errorMsg: string | null
  private regex: RegExp | null
  private min: number | null
  private max: number | null
  private inline: boolean
  private required: boolean
  private minLength: number | null
  private maxLength: number | null

  constructor(options: InputOptions & { type?: T } = {} as InputOptions & { type?: T }) {
    this.promptColor = options.promptColor ?? GREEN
    this.promptGlyph = options.promptGlyph ?? (config.glyphs ? '◆' : '>')
    this.inputColor = options.inputColor ?? ''
    this.errorColor = options.errorColor ?? RED
    this.placeholder = options.placeholder ?? ''
    this.mask = options.mask ?? false
    this.inline = options.inline ?? false
    this.required = options.required ?? true
    this.type = (options.type ?? 'string') as T
    this.defaultValue = options.default ?? null
    this.enumValues = options.enum ?? null
    this.match = options.match ?? null
    this.errorMsg = options.errorMessage ?? null
    this.regex = options.regex ?? null
    this.min = options.min ?? null
    this.max = options.max ?? null
    this.minLength = options.minLength ?? null
    this.maxLength = options.maxLength ?? null
  }

  private validate(value: string): string | null {
    const fail = (msg: string) => this.errorMsg ?? msg
    if (this.type === 'number') {
      const n = Number(value)
      if (isNaN(n)) return fail('Must be a valid number')
      if (this.min !== null && n < this.min) return fail(`Must be at least ${this.min}`)
      if (this.max !== null && n > this.max) return fail(`Must be at most ${this.max}`)
      return null
    }
    if (this.type === 'integer') {
      const n = Number(value)
      if (!Number.isInteger(n)) return fail('Must be a whole number')
      if (this.min !== null && n < this.min) return fail(`Must be at least ${this.min}`)
      if (this.max !== null && n > this.max) return fail(`Must be at most ${this.max}`)
      return null
    }
    if (this.type === 'enum' && this.enumValues) {
      if (!this.enumValues.includes(value)) return fail(`Must be one of: ${this.enumValues.join(', ')}`)
    }
    if (this.match !== null && value !== this.match) return fail('Does not match')
    if (this.regex && !this.regex.test(value)) return fail('Invalid format')
    if (this.minLength !== null && value.length < this.minLength) return fail(`Must be at least ${this.minLength} characters`)
    if (this.maxLength !== null && value.length > this.maxLength) return fail(`Must be at most ${this.maxLength} characters`)
    return null
  }

  private coerce(value: string): InputReturn<T> {
    if (this.type === 'number') return Number(value) as InputReturn<T>
    if (this.type === 'integer') return parseInt(value, 10) as InputReturn<T>
    return value as InputReturn<T>
  }

  async ask(prompt: string): Promise<InputReturn<T> | null> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Input requires an interactive terminal')
    if (this.type === 'boolean') return this.askBoolean(prompt) as Promise<InputReturn<T>>

    let inputStr = ''
    let cursorPos = 0
    let error: string | null = null
    let hasErrorLine = false

    const glyph = this.promptGlyph ? `${colorText(this.promptColor, this.promptGlyph)} ` : ''
    const indent = ' '.repeat(this.promptGlyph ? stringLength(this.promptGlyph) + 1 : 0)

    let promptLine = prompt
    if (this.type === 'enum' && this.enumValues) {
      promptLine += ` \x1b[2m(${this.enumValues.join('|')})\x1b[0m`
    }

    if (!this.inline) process.stdout.write(`${glyph}${promptLine}\n`)

    const defaultStr = this.defaultValue !== null ? String(this.defaultValue) : ''

    const getDisplayText = (): string => {
      const raw = this.mask ? '•'.repeat(inputStr.length) : inputStr
      if (inputStr.length === 0 && defaultStr) return `\x1b[2m${this.placeholder || defaultStr}${RESET}`
      return this.inputColor ? colorText(this.inputColor, raw) : raw
    }

    const renderInput = (redraw: boolean) => {
      if (redraw && hasErrorLine) process.stdout.write('\x1b[1A')

      const text = getDisplayText()
      const line = this.inline ? `\r${CLEAR_LINE}${glyph}${promptLine} ${text}` : `\r${CLEAR_LINE}${indent}${text}`

      process.stdout.write(line)

      if (error) {
        process.stdout.write(`\n\r${CLEAR_LINE}${indent}${colorText(this.errorColor, `✗ ${error}`)}`)
        hasErrorLine = true
      } else {
        if (hasErrorLine) {
          process.stdout.write(`\n\r${CLEAR_LINE}\x1b[1A${line}`)
        }
        hasErrorLine = false
      }

      // Position cursor within the input text when not at end
      if (inputStr.length > 0 && cursorPos < inputStr.length && !error) {
        process.stdout.write(`\x1b[${inputStr.length - cursorPos}D`)
      }
    }

    renderInput(false)

    return new Promise((resolve) => {
      const cleanup = () => {
        if (hasErrorLine) process.stdout.write(`\r${CLEAR_LINE}\x1b[1A`)
        const text = getDisplayText()
        const line = this.inline ? `\r${CLEAR_LINE}${glyph}${promptLine} ${text}` : `\r${CLEAR_LINE}${indent}${text}`
        process.stdout.write(`${line}\n`)
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onKey)
      }

      const onKey = (key: Buffer) => {
        const str = key.toString()
        if (str === '\r' || str === '\n') {
          const value = inputStr.length === 0 && defaultStr ? defaultStr : inputStr
          const err = this.validate(value)
          if (err) {
            error = err
            renderInput(true)
          } else {
            const usingDefault = inputStr.length === 0 && this.defaultValue !== null
            if (usingDefault) inputStr = defaultStr
            cleanup()
            resolve(usingDefault ? (this.defaultValue as InputReturn<T>) : this.coerce(value))
          }
        } else if (str === '\x1b[D') {
          cursorPos = Math.max(0, cursorPos - 1)
          renderInput(true)
        } else if (str === '\x1b[C') {
          cursorPos = Math.min(inputStr.length, cursorPos + 1)
          renderInput(true)
        } else if (str === '\x1b[H' || str === '\x1b[1~' || str === '\x01') {
          cursorPos = 0
          renderInput(true)
        } else if (str === '\x1b[F' || str === '\x1b[4~' || str === '\x05') {
          cursorPos = inputStr.length
          renderInput(true)
        } else if (str === '\x1b[3~') {
          if (cursorPos < inputStr.length) {
            inputStr = inputStr.slice(0, cursorPos) + inputStr.slice(cursorPos + 1)
            error = null
            renderInput(true)
          }
        } else if (str === '\x1b') {
          if (!this.required) {
            cleanup()
            resolve(null)
          }
        } else if (str === '\x03') {
          cleanup()
          process.exit()
        } else if (str === '\x7f' || str === '\b') {
          if (cursorPos > 0) {
            inputStr = inputStr.slice(0, cursorPos - 1) + inputStr.slice(cursorPos)
            cursorPos--
            error = null
            renderInput(true)
          }
        } else if (str.charCodeAt(0) >= 0x20) {
          if (this.maxLength !== null && inputStr.length >= this.maxLength) return
          inputStr = inputStr.slice(0, cursorPos) + str + inputStr.slice(cursorPos)
          cursorPos++
          error = null
          renderInput(true)
        }
      }

      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.on('data', onKey)
    })
  }

  private async askBoolean(prompt: string): Promise<boolean | null> {
    const hasDefault = this.defaultValue !== null
    const defaultBool = this.defaultValue === true || this.defaultValue === 'y' || this.defaultValue === 'Y' || this.defaultValue === 1
    const hint = hasDefault ? (defaultBool ? '[Y/n]' : '[y/N]') : '[y/n]'

    const glyph = this.promptGlyph ? `${colorText(this.promptColor, this.promptGlyph)} ` : ''
    const indent = ' '.repeat(this.promptGlyph ? stringLength(this.promptGlyph) + 1 : 0)

    if (this.inline) {
      process.stdout.write(`${glyph}${prompt} \x1b[2m${hint}${RESET} `)
    } else {
      process.stdout.write(`${glyph}${prompt} \x1b[2m${hint}${RESET}\n`)
      process.stdout.write(`${indent}`)
    }

    return new Promise((resolve) => {
      const finish = (selection: string, value: boolean | null) => {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onKey)
        if (this.inline) {
          process.stdout.write(`\r${CLEAR_LINE}${glyph}${prompt} \x1b[2m${hint}${RESET} ${selection}\n`)
        } else {
          process.stdout.write(`\r${CLEAR_LINE}${indent}${selection}\n`)
        }
        resolve(value)
      }

      const onKey = (key: Buffer) => {
        const str = key.toString()
        if (str === '\r' || str === '\n') {
          if (hasDefault) finish(defaultBool ? 'yes' : 'no', defaultBool)
        } else if (str === 'y' || str === 'Y') {
          finish('yes', true)
        } else if (str === 'n' || str === 'N') {
          finish('no', false)
        } else if (str === '\x1b') {
          if (!this.required) finish('', null)
        } else if (str === '\x03') {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.removeListener('data', onKey)
          process.exit()
        }
      }

      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.on('data', onKey)
    })
  }
}

export function input(prompt: string, options: InputOptions & { type: 'number' | 'integer' }): Promise<number | null>
export function input(prompt: string, options: InputOptions & { type: 'boolean' }): Promise<boolean | null>
export function input(prompt: string, options?: InputOptions): Promise<string | null>
export async function input(prompt: string, options: InputOptions = {}): Promise<string | number | boolean | null> {
  return new Input(options).ask(prompt)
}

export async function confirm(prompt: string, options?: Pick<InputOptions, 'default' | 'required' | 'promptColor' | 'promptGlyph' | 'inline'>): Promise<boolean | null> {
  return new Input({ ...options, type: 'boolean' }).ask(prompt) as Promise<boolean | null>
}
