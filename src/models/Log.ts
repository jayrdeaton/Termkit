import { BLUE, colorText, GREEN, RED, YELLOW } from '@/utils/color'
import { markup, type MarkupOptions } from '@/models/Markup'

export interface LogOptions {
  successColor?: string
  failColor?: string
  warnColor?: string
  infoColor?: string
  glyphs?: boolean
}

export class Log {
  private _successColor: string
  private _failColor: string
  private _warnColor: string
  private _infoColor: string
  private _glyphs: boolean

  constructor(options: LogOptions = {}) {
    this._successColor = options.successColor ?? GREEN
    this._failColor = options.failColor ?? RED
    this._warnColor = options.warnColor ?? YELLOW
    this._infoColor = options.infoColor ?? BLUE
    this._glyphs = options.glyphs ?? true
  }

  private write(glyph: string, color: string, message?: string): void {
    if (process.stdout.isTTY) {
      process.stdout.write(`${colorText(color, glyph)}${message ? ` ${message}` : ''}\n`)
    } else {
      process.stdout.write(`${this._glyphs ? `${glyph}${message ? ` ${message}` : ''}` : (message ?? '')}\n`)
    }
  }

  succeed(message?: string): void {
    this.write('✔', this._successColor, message)
  }

  fail(message?: string): void {
    this.write('✖', this._failColor, message)
  }

  warn(message?: string): void {
    this.write('⚠', this._warnColor, message)
  }

  info(message?: string): void {
    this.write('ℹ', this._infoColor, message)
  }

  data(value?: unknown, options?: MarkupOptions): void {
    process.stdout.write(`${markup(value, options)}\n`)
  }
}

export const log = new Log()
