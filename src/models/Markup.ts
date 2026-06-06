import { BLUE, BOLD, colorText, CYAN, FAINT, GREEN, MAGENTA, YELLOW } from '@/utils/color'

const TAB = '  '

export type MarkupStyleFn = (value: string) => string

export interface MarkupStyles {
  date?: MarkupStyleFn
  null?: MarkupStyleFn
  undefined?: MarkupStyleFn
  number?: MarkupStyleFn
  bigint?: MarkupStyleFn
  boolean?: MarkupStyleFn
  string?: MarkupStyleFn
  symbol?: MarkupStyleFn
}

export interface MarkupOptions {
  translations?: Record<string, (value: unknown) => unknown>
  styles?: MarkupStyles
}

export function markup(data?: unknown, options: MarkupOptions = {}): string {
  const translations = options.translations ?? {}
  const styles: Required<MarkupStyles> = {
    date: options.styles?.date ?? ((v) => colorText(MAGENTA, v)),
    null: options.styles?.null ?? ((v) => colorText(BOLD, v)),
    undefined: options.styles?.undefined ?? ((v) => colorText(FAINT, v)),
    number: options.styles?.number ?? ((v) => colorText(YELLOW, v)),
    bigint: options.styles?.bigint ?? ((v) => colorText(YELLOW, v)),
    boolean: options.styles?.boolean ?? ((v) => colorText(CYAN, v)),
    string: options.styles?.string ?? ((v) => colorText(GREEN, v)),
    symbol: options.styles?.symbol ?? ((v) => colorText(BLUE, v))
  }

  let result = ''

  function formatPrimitive(value: unknown): string {
    if (value instanceof Date) return styles.date(String(value))
    if (value === null) return styles.null('null')
    if (value === undefined) return styles.undefined('undefined')
    if (typeof value === 'number') return styles.number(String(value))
    if (typeof value === 'bigint') return styles.bigint(String(value))
    if (typeof value === 'boolean') return styles.boolean(String(value))
    if (typeof value === 'string') return styles.string(value)
    if (typeof value === 'symbol') return styles.symbol(String(value))
    return String(value)
  }

  function isPrimitive(value: unknown): boolean {
    return !Array.isArray(value) && (value === null || value === undefined || typeof value !== 'object' || value instanceof Date)
  }

  function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
  }

  function formatObjectContents(obj: Record<string, unknown>, pad: string): void {
    const keys = Object.keys(obj)
    for (const [i, key] of keys.entries()) {
      result += `${pad}${TAB}${key}: `
      let val = obj[key]
      if (translations[key]) val = translations[key](val)
      if (typeof val === 'object' && val !== null) {
        format(val, `${pad}${TAB}`)
      } else {
        format(val, '')
      }
      result += i === keys.length - 1 ? '\n' : ',\n'
    }
  }

  function format(value: unknown, pad: string): void {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        result += result.endsWith(': ') ? '[]' : `${pad}[]`
      } else if (value.every(isPrimitive)) {
        const inline = `[${value.map(formatPrimitive).join(', ')}]`
        result += result.endsWith(': ') ? inline : `${pad}${inline}`
      } else if (value.every(isPlainObject)) {
        const prefix = result.endsWith(': ') ? '' : pad
        for (const [i, item] of value.entries()) {
          result += i === 0 ? `${prefix}[{\n` : `${pad}},{\n`
          formatObjectContents(item, pad)
        }
        result += `${pad}}]`
      } else {
        result += result.endsWith(': ') ? '[' : `${pad}[`
        result += '\n'
        for (const [i, item] of value.entries()) {
          format(item, `${pad}${TAB}`)
          result += i === value.length - 1 ? '\n' : ',\n'
        }
        result += `${pad}]`
      }
    } else if (value instanceof Date) {
      result += styles.date(String(value))
    } else if (value === null) {
      result += styles.null('null')
    } else if (value === undefined) {
      result += styles.undefined('undefined')
    } else if (isPlainObject(value)) {
      result += result.endsWith(': ') ? '{' : `${pad}{`
      const keys = Object.keys(value)
      if (keys.length === 0) {
        result += '}'
      } else {
        result += '\n'
        formatObjectContents(value, pad)
        result += `${pad}}`
      }
    } else if (typeof value === 'number') {
      result += styles.number(`${pad}${value}`)
    } else if (typeof value === 'bigint') {
      result += styles.bigint(`${pad}${value}`)
    } else if (typeof value === 'boolean') {
      result += styles.boolean(String(value))
    } else if (typeof value === 'string') {
      result += styles.string(`${pad}${value}`)
    } else if (typeof value === 'symbol') {
      result += styles.symbol(String(value))
    }
  }

  format(data, '')
  return result
}
