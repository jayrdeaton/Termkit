import { config } from '@/config'
import { applyShimmer, BLUE, colorText, formatColor, GREEN, HIDE_CURSOR, interpolateColor, parseHex, RED, RESET, type RgbColor, SHIMMER_SPEED, SHOW_CURSOR, YELLOW } from '@/utils/color'
import { registerCleanup } from '@/utils/cleanup'
import { stringLength } from '@/utils/stringLength'

export interface SpinnerOptions {
  frames?: string[]
  prefix?: string
  suffix?: string
  text?: string
  reverse?: boolean
  interval?: number
  colors?: string[]
  bgColors?: string[]
  colorCycle?: number
  shimmer?: number
  onSpin?: () => void
  successColor?: string
  failColor?: string
  warnColor?: string
  infoColor?: string
  glyphs?: boolean
}

export class Spinner {
  static readonly FRAMES = {
    braille: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    dots: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
    line: ['|', '/', '-', '\\'],
    arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
    bounce: ['⠁', '⠂', '⠄', '⠂']
  }

  frames: string[]
  interval: number
  colorCycle: number
  shimmer: number
  text: string
  reverse: boolean
  onSpin: (() => void) | undefined

  private running: boolean
  private frameIndex: number
  private prefixString: string
  private suffixString: string
  private _colors: string[] = []
  private _parsedColors: RgbColor[] = []
  private _bgColors: string[] = []
  private _parsedBgColors: RgbColor[] = []
  private _colorOffset: number = 0
  private _shimmerPhase: number = 0
  private _lastLineLength: number = 0
  private _successColor: string
  private _failColor: string
  private _warnColor: string
  private _infoColor: string
  private _glyphs: boolean
  private _cleanupDeregister: (() => void) | null = null

  constructor(options: SpinnerOptions = {}) {
    this.running = false
    this.frameIndex = 0
    this.frames = options.frames ?? (config.glyphs ? Spinner.FRAMES.braille : Spinner.FRAMES.line)
    this.prefixString = options.prefix ?? ''
    this.suffixString = options.suffix ?? ''
    this.text = options.text ?? ''
    this.reverse = options.reverse ?? false
    this.interval = options.interval ?? 80
    this.colorCycle = options.colorCycle ?? 1.0
    this.shimmer = options.shimmer ?? 0
    this.onSpin = options.onSpin
    this.colors = options.colors ?? ['#c026d3', '#e879f9']
    this.bgColors = options.bgColors ?? []
    this._successColor = options.successColor ?? GREEN
    this._failColor = options.failColor ?? RED
    this._warnColor = options.warnColor ?? YELLOW
    this._infoColor = options.infoColor ?? BLUE
    this._glyphs = options.glyphs ?? config.glyphs
  }

  get colors(): string[] {
    return this._colors
  }

  set colors(value: string[]) {
    this._colors = value
    this._parsedColors = value.length > 1 ? value.map(parseHex) : []
  }

  get bgColors(): string[] {
    return this._bgColors
  }

  set bgColors(value: string[]) {
    this._bgColors = value
    this._parsedBgColors = value.length > 1 ? value.map(parseHex) : []
  }

  start(): void {
    if (!process.stdout.isTTY) return
    this.running = true
    process.stdout.write(HIDE_CURSOR)
    this._cleanupDeregister = registerCleanup(() => {
      this.running = false
      process.stdout.clearLine?.(0)
      process.stdout.write(SHOW_CURSOR)
    })
    this.run()
  }

  stop(message?: string): this {
    this.running = false
    this._cleanupDeregister?.()
    this._cleanupDeregister = null
    if (process.stdout.isTTY) {
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
    this._cleanupDeregister?.()
    this._cleanupDeregister = null
    if (process.stdout.isTTY) {
      this.clear()
      const glyph = this._glyphs ? colorText(this._successColor, '✔') + ' ' : ''
      process.stdout.write(`${SHOW_CURSOR}${glyph}${string ?? ''}\n`)
    } else {
      process.stdout.write(`${this._glyphs ? `✔ ${string ?? ''}` : (string ?? '')}\n`)
    }
    return this
  }

  fail(string?: string): this {
    this.running = false
    this._cleanupDeregister?.()
    this._cleanupDeregister = null
    if (process.stdout.isTTY) {
      this.clear()
      const glyph = this._glyphs ? colorText(this._failColor, '✖') + ' ' : ''
      process.stdout.write(`${SHOW_CURSOR}${glyph}${string ?? ''}\n`)
    } else {
      process.stdout.write(`${this._glyphs ? `✖ ${string ?? ''}` : (string ?? '')}\n`)
    }
    return this
  }

  warn(string?: string): this {
    this.running = false
    this._cleanupDeregister?.()
    this._cleanupDeregister = null
    if (process.stdout.isTTY) {
      this.clear()
      const glyph = this._glyphs ? colorText(this._warnColor, '⚠') + ' ' : ''
      process.stdout.write(`${SHOW_CURSOR}${glyph}${string ?? ''}\n`)
    } else {
      process.stdout.write(`${this._glyphs ? `⚠ ${string ?? ''}` : (string ?? '')}\n`)
    }
    return this
  }

  info(string?: string): this {
    this.running = false
    this._cleanupDeregister?.()
    this._cleanupDeregister = null
    if (process.stdout.isTTY) {
      this.clear()
      const glyph = this._glyphs ? colorText(this._infoColor, 'ℹ') + ' ' : ''
      process.stdout.write(`${SHOW_CURSOR}${glyph}${string ?? ''}\n`)
    } else {
      process.stdout.write(`${this._glyphs ? `ℹ ${string ?? ''}` : (string ?? '')}\n`)
    }
    return this
  }

  private clear(): void {
    process.stdout.clearLine?.(0)
    this._lastLineLength = 0
  }

  private coloredFrame(): string {
    const t = this._parsedColors.length >= 2 && this.frames.length > 1 ? this.frameIndex / (this.frames.length - 1) : 0

    const et = this.colorCycle > 0 ? (((t + this._colorOffset) % 1) + 1) % 1 : t

    const frame = this.frames[this.frameIndex]

    const fg = this._parsedColors.length >= 2 ? formatColor(38, applyShimmer(interpolateColor(this._parsedColors, et), 0.5, this._shimmerPhase, this.shimmer)) : ''

    const bg = this._parsedBgColors.length >= 2 ? formatColor(48, applyShimmer(interpolateColor(this._parsedBgColors, et), 0.5, this._shimmerPhase, this.shimmer)) : ''

    return fg || bg ? fg + bg + frame + RESET : frame
  }

  private run(): void {
    const frame = this.coloredFrame()
    const t = this.text
    const content = this.reverse ? (t ? `${t} ${frame}` : frame) : t ? `${frame} ${t}` : frame
    const raw = `${this.prefixString}${content}${this.suffixString}`
    const displayLen = stringLength(raw)
    const padding = ' '.repeat(Math.max(0, this._lastLineLength - displayLen))
    this._lastLineLength = displayLen
    process.stdout.write(`${raw}${padding}\r`)

    this.frameIndex = (this.frameIndex + 1) % this.frames.length
    if (this.frameIndex === 0) this.onSpin?.()

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
}
