import { ansiColor, applyShimmer, BLUE, colorText, dimColor, formatColor, GREEN, HIDE_CURSOR, interpolateColor, parseHex, RED, RESET, type RgbColor, SHIMMER_SPEED, SHOW_CURSOR, YELLOW } from '@/utils/color'
import { stringLength } from '@/utils/stringLength'

export type BarMode = 'bounce' | 'loop' | 'loop-reverse'

export interface BarOptions {
  length?: number
  prefix?: string
  suffix?: string
  character?: string
  before?: string
  after?: string
  text?: string
  reverse?: boolean
  interval?: number
  mode?: BarMode
  progress?: number
  colors?: string[]
  bgColors?: string[]
  colorFill?: boolean
  colorCycle?: number
  shimmer?: number
  onBounce?: () => void
  onLoop?: () => void
  onComplete?: () => void
  successColor?: string
  failColor?: string
  warnColor?: string
  infoColor?: string
  glyphs?: boolean
}

export class Bar {
  static readonly COLORS = {
    blueRed: ['#0000ff', '#ff0000'],
    redBlue: ['#ff0000', '#0000ff'],
    rainbow: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'],
    heat: ['#0000ff', '#00ffff', '#ffff00', '#ff0000'],
    cool: ['#00ffff', '#0000ff', '#8b00ff'],
    sunset: ['#8b00ff', '#ff0000', '#ff7f00']
  }

  length: number
  character: string
  interval: number
  mode: BarMode
  progress: number | undefined
  colorFill: boolean
  colorCycle: number
  shimmer: number
  text: string
  reverse: boolean
  onBounce: (() => void) | undefined
  onLoop: (() => void) | undefined
  onComplete: (() => void) | undefined

  private running: boolean
  private forwardMotion: boolean
  private position: number
  private prefixString: string
  private suffixString: string
  private beforeEmpty: string
  private afterEmpty: string
  private _colors: string[] = []
  private _parsedColors: RgbColor[] = []
  private _dimmedColors: RgbColor[] = []
  private _bgColors: string[] = []
  private _parsedBgColors: RgbColor[] = []
  private _colorOffset: number = 0
  private _shimmerPhase: number = 0
  private _completed: boolean = false
  private _autoLength: boolean
  private _resizeListener: (() => void) | null = null
  private _successColor: string
  private _failColor: string
  private _warnColor: string
  private _infoColor: string
  private _glyphs: boolean

  constructor(options: BarOptions = {}) {
    this.running = false
    this.forwardMotion = true
    this._autoLength = options.length === undefined
    this.length = options.length ?? process.stdout.columns ?? 80
    this.prefixString = options.prefix ?? '['
    this.suffixString = options.suffix ?? ']'
    this.character = options.character ?? '──'
    this.beforeEmpty = options.before ?? ' '
    this.afterEmpty = options.after ?? ' '
    this.position = 1
    this.interval = options.interval ?? 35
    this.mode = options.mode ?? 'bounce'
    this.progress = options.progress
    this.colorFill = options.colorFill ?? false
    this.colorCycle = options.colorCycle ?? 0.5
    this.shimmer = options.shimmer ?? 0
    this.text = options.text ?? ''
    this.reverse = options.reverse ?? false
    this.onBounce = options.onBounce
    this.onLoop = options.onLoop
    this.onComplete = options.onComplete
    this.colors = options.colors ?? ['#c026d3', '#e879f9']
    this.bgColors = options.bgColors ?? []
    this._successColor = options.successColor ?? GREEN
    this._failColor = options.failColor ?? RED
    this._warnColor = options.warnColor ?? YELLOW
    this._infoColor = options.infoColor ?? BLUE
    this._glyphs = options.glyphs ?? true
  }

  get colors(): string[] {
    return this._colors
  }

  set colors(value: string[]) {
    this._colors = value
    this._parsedColors = value.length > 1 ? value.map(parseHex) : []
    this._dimmedColors = this._parsedColors.map(dimColor)
  }

  get bgColors(): string[] {
    return this._bgColors
  }

  set bgColors(value: string[]) {
    this._bgColors = value
    this._parsedBgColors = value.length > 1 ? value.map(parseHex) : []
  }

  set prefix(string: string) {
    if (stringLength(string) > stringLength(this.prefixString)) {
      this.position -= stringLength(string) - 1
      if (this.position < 1) this.position = 1
    } else {
      this.position += stringLength(this.prefixString) - 1
    }
    this.prefixString = string
  }

  set suffix(string: string) {
    const length = this.length - stringLength(this.prefixString) - stringLength(this.character) - stringLength(string)
    if (this.position > length) {
      this.position = length
      if (this.forwardMotion) this.forwardMotion = false
    }
    this.suffixString = string
  }

  set before(string: string) {
    this.beforeEmpty = stringLength(string) > 1 ? string.charAt(0) : string
  }

  set after(string: string) {
    this.afterEmpty = stringLength(string) > 1 ? string.charAt(0) : string
  }

  set empty(string: string) {
    const char = stringLength(string) > 1 ? string.charAt(0) : string
    this.beforeEmpty = char
    this.afterEmpty = char
  }

  start(): void {
    if (!process.stdout.isTTY) return
    this.running = true
    process.stdout.write(HIDE_CURSOR)
    if (this._autoLength) {
      this._resizeListener = () => {
        this.length = process.stdout.columns ?? 80
        // erase from cursor to end of screen — clears wrapped ghost lines
        // regardless of how many resize events fired between renders
        process.stdout.write('\x1b[0J')
      }
      process.stdout.on('resize', this._resizeListener)
    }
    this.run()
  }

  stop(message?: string): this {
    this.running = false
    if (process.stdout.isTTY) {
      if (this._resizeListener) {
        process.stdout.off('resize', this._resizeListener)
        this._resizeListener = null
      }
      this.clear()
      process.stdout.write(SHOW_CURSOR)
    }
    if (message) process.stdout.write(`${message}\n`)
    return this
  }

  message(string: string): this {
    this.text = string
    return this
  }

  succeed(string?: string): this {
    this.running = false
    if (process.stdout.isTTY) {
      if (this._resizeListener) {
        process.stdout.off('resize', this._resizeListener)
        this._resizeListener = null
      }
      this.clear()
      process.stdout.write(`${SHOW_CURSOR}${colorText(this._successColor, '✔')}${string ? ` ${string}` : ''}\n`)
    } else {
      process.stdout.write(`${this._glyphs ? `✔${string ? ` ${string}` : ''}` : (string ?? '')}\n`)
    }
    return this
  }

  fail(string?: string): this {
    this.running = false
    if (process.stdout.isTTY) {
      if (this._resizeListener) {
        process.stdout.off('resize', this._resizeListener)
        this._resizeListener = null
      }
      this.clear()
      process.stdout.write(`${SHOW_CURSOR}${colorText(this._failColor, '✖')}${string ? ` ${string}` : ''}\n`)
    } else {
      process.stdout.write(`${this._glyphs ? `✖${string ? ` ${string}` : ''}` : (string ?? '')}\n`)
    }
    return this
  }

  warn(string?: string): this {
    this.running = false
    if (process.stdout.isTTY) {
      if (this._resizeListener) {
        process.stdout.off('resize', this._resizeListener)
        this._resizeListener = null
      }
      this.clear()
      process.stdout.write(`${SHOW_CURSOR}${colorText(this._warnColor, '⚠')}${string ? ` ${string}` : ''}\n`)
    } else {
      process.stdout.write(`${this._glyphs ? `⚠${string ? ` ${string}` : ''}` : (string ?? '')}\n`)
    }
    return this
  }

  info(string?: string): this {
    this.running = false
    if (process.stdout.isTTY) {
      if (this._resizeListener) {
        process.stdout.off('resize', this._resizeListener)
        this._resizeListener = null
      }
      this.clear()
      process.stdout.write(`${SHOW_CURSOR}${colorText(this._infoColor, 'ℹ')}${string ? ` ${string}` : ''}\n`)
    } else {
      process.stdout.write(`${this._glyphs ? `ℹ${string ? ` ${string}` : ''}` : (string ?? '')}\n`)
    }
    return this
  }

  private clear(): void {
    process.stdout.clearLine?.(0)
  }

  private effectiveT(t: number): number {
    if (this.colorCycle === 0) return t
    return (((t + this._colorOffset) % 1) + 1) % 1
  }

  private coloredChar(colors: RgbColor[], code: 38 | 48, t: number): string {
    const et = this.effectiveT(t)
    const base = interpolateColor(colors, et)
    const shimmered = applyShimmer(base, t, this._shimmerPhase, this.shimmer)
    return formatColor(code, shimmered)
  }

  private colorChar(t: number): string {
    const fg = this._parsedColors.length >= 2 ? this.coloredChar(this._parsedColors, 38, t) : ''
    const bg = this._parsedBgColors.length >= 2 ? this.coloredChar(this._parsedBgColors, 48, t) : ''
    return fg || bg ? fg + bg + this.character + RESET : this.character
  }

  private colorFillChar(char: string, t: number): string {
    const fg = this.colorFill && this._dimmedColors.length >= 2 ? this.coloredChar(this._dimmedColors, 38, t) : ''
    const bg = this._parsedBgColors.length >= 2 ? this.coloredChar(this._parsedBgColors, 48, t) : ''
    return fg || bg ? fg + bg + char + RESET : char
  }

  private writeLine(working: string): void {
    const t = this.text
    const line = this.reverse ? (t ? `${t} ${working}` : working) : t ? `${working} ${t}` : working
    process.stdout.write(`${line}\x1b[K\r`)
  }

  private run(): void {
    const textReserved = this.text ? stringLength(this.text) + 1 : 0
    const length = Math.max(1, this.length - textReserved - stringLength(this.prefixString) - stringLength(this.character) - stringLength(this.suffixString))

    if (this.progress !== undefined) {
      this.renderDeterminate(length)
    } else {
      this.renderIndeterminate(length)
    }

    if (this.colorCycle > 0) {
      this._colorOffset = (this._colorOffset + (this.colorCycle * this.interval) / 1000) % 1
    }
    if (this.shimmer > 0) {
      this._shimmerPhase = (this._shimmerPhase + (SHIMMER_SPEED * this.interval) / 1000) % 1
    }

    setTimeout(() => {
      if (this.running) this.run()
    }, this.interval)
  }

  private renderDeterminate(length: number): void {
    const clamped = Math.max(0, Math.min(1, this.progress!))
    const filled = Math.round(clamped * length)
    let working = this.prefixString
    for (let i = 0; i < filled; i++) {
      const t = length > 1 ? i / (length - 1) : 0
      working += this.colorChar(t)
    }
    for (let i = filled; i < length; i++) {
      const t = length > 1 ? i / (length - 1) : 0
      working += this.colorFillChar(this.afterEmpty, t)
    }
    working += this.suffixString
    this.writeLine(working)

    if (clamped >= 1 && !this._completed) {
      this._completed = true
      this.onComplete?.()
    } else if (clamped < 1) {
      this._completed = false
    }
  }

  private renderIndeterminate(length: number): void {
    if (this.position > length) {
      this.position = length
      this.forwardMotion = false
    }
    if (this.position < 1) {
      this.position = 1
      this.forwardMotion = true
    }

    let working = this.prefixString
    let i = 1
    while (i < this.position) {
      const t = length > 1 ? (i - 1) / (length - 1) : 0
      working += this.colorFillChar(this.beforeEmpty, t)
      i++
    }
    const charT = length > 1 ? (this.position - 1) / (length - 1) : 0
    working += this.colorChar(charT)
    i++
    while (i <= length) {
      const t = length > 1 ? (i - 1) / (length - 1) : 0
      working += this.colorFillChar(this.afterEmpty, t)
      i++
    }
    working += this.suffixString
    this.writeLine(working)

    if (this.mode === 'loop') {
      this.position++
      if (this.position > length) {
        this.position = 1
        this.onLoop?.()
      }
    } else if (this.mode === 'loop-reverse') {
      this.position--
      if (this.position < 1) {
        this.position = length
        this.onLoop?.()
      }
    } else {
      if (this.forwardMotion) {
        this.position++
        if (this.position >= length) {
          this.forwardMotion = false
          this.onBounce?.()
        }
      } else {
        this.position--
        if (this.position <= 1) {
          this.forwardMotion = true
          this.onBounce?.()
        }
      }
    }
  }
}

// keep ansiColor importable so nothing downstream breaks
export { ansiColor }
