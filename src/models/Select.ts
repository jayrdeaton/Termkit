import { config } from '@/config'
import { applyShimmer, BLUE, colorText, formatColor, GREEN, HIDE_CURSOR, interpolateColor, parseHex, RESET, type RgbColor, SHIMMER_SPEED, SHOW_CURSOR } from '@/utils/color'
import { stringLength } from '@/utils/stringLength'

export interface SelectItem {
  label: string
  description?: string
}

export interface SelectOptions {
  skipLabel?: string
  promptColor?: string
  promptGlyph?: string
  descriptionColor?: string
  selectedPrefix?: string
  selectedSuffix?: string
  colors?: string[]
  colorCycle?: number
  shimmer?: number
  interval?: number
}

const CLEAR_LINE = '\x1b[2K'
const CURSOR_UP = (n: number) => `\x1b[${n}A`

export class Select {
  private promptColor: string
  private promptGlyph: string
  private descriptionColor: string
  private skipLabel: string
  private selectedPrefix: string
  private selectedSuffix: string
  private colorCycle: number
  private shimmer: number
  private interval: number
  private _parsedColors: RgbColor[]
  private _colorOffset: number = 0
  private _shimmerPhase: number = 0

  constructor(options: SelectOptions = {}) {
    this.promptColor = options.promptColor ?? GREEN
    this.promptGlyph = options.promptGlyph ?? (config.glyphs ? '◆' : '>')
    this.descriptionColor = options.descriptionColor ?? BLUE
    this.skipLabel = options.skipLabel ?? 'Skip'
    this.selectedPrefix = options.selectedPrefix ?? '>'
    this.selectedSuffix = options.selectedSuffix ?? '<'
    this.colorCycle = options.colorCycle ?? 1.0
    this.shimmer = options.shimmer ?? 0
    this.interval = options.interval ?? 80
    const colors = options.colors ?? ['#a855f7', '#22c55e']
    this._parsedColors = colors.length >= 2 ? colors.map(parseHex) : []
  }

  private pulseColor(): string {
    if (this._parsedColors.length < 2) return ''
    const t = ((this._colorOffset % 1) + 1) % 1
    const base = interpolateColor(this._parsedColors, t)
    const color = applyShimmer(base, 0.5, this._shimmerPhase, this.shimmer)
    return formatColor(38, color)
  }

  async ask<T extends SelectItem>(prompt: string, items: T[]): Promise<T | null> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Select requires an interactive terminal')

    const allItems = [...items, { label: this.skipLabel } as T]
    let selectedIndex = 0

    process.stdout.write(HIDE_CURSOR)
    const glyph = this.promptGlyph ? `${colorText(this.promptColor, this.promptGlyph)} ` : ''
    const indent = ' '.repeat(this.promptGlyph ? stringLength(this.promptGlyph) + 1 : 0)
    process.stdout.write(`${glyph}${prompt}\n`)

    const renderList = (redraw: boolean) => {
      if (redraw) process.stdout.write(CURSOR_UP(allItems.length))
      const pulse = this.pulseColor()
      for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i]
        const isSelected = i === selectedIndex
        const desc = item.description ? ` ${colorText(this.descriptionColor, `— ${item.description}`)}` : ''
        const num = `${i === items.length ? 0 : i + 1}.`
        let marker: string, tail: string
        if (isSelected && pulse) {
          marker = `${pulse}${this.selectedPrefix}${RESET}`
          tail = ` ${pulse}${this.selectedSuffix}${RESET}`
        } else {
          const fallback = isSelected ? this.promptColor : ''
          marker = fallback ? colorText(fallback, this.selectedPrefix) : ' '.repeat(this.selectedPrefix.length)
          tail = isSelected ? ` ${colorText(this.promptColor, this.selectedSuffix)}` : ''
        }
        process.stdout.write(`\r${CLEAR_LINE}${indent}${marker} ${num} ${item.label}${desc}${tail}\n`)
      }
    }

    renderList(false)

    return new Promise((resolve) => {
      let timer: ReturnType<typeof setInterval> | null = null

      const cleanup = () => {
        if (timer) {
          clearInterval(timer)
          timer = null
        }
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onKey)
        process.stdout.write(SHOW_CURSOR)
      }

      if (this._parsedColors.length >= 2) {
        timer = setInterval(() => {
          this._colorOffset = (this._colorOffset + (this.colorCycle * this.interval) / 1000) % 1
          if (this.shimmer > 0) {
            this._shimmerPhase = (this._shimmerPhase + (SHIMMER_SPEED * this.interval) / 1000) % 1
          }
          renderList(true)
        }, this.interval)
      }

      const onKey = (key: Buffer) => {
        const str = key.toString()
        if (str === '\x1b[A') {
          selectedIndex = (selectedIndex - 1 + allItems.length) % allItems.length
          renderList(true)
        } else if (str === '\x1b[B') {
          selectedIndex = (selectedIndex + 1) % allItems.length
          renderList(true)
        } else if (str === '\r' || str === '\n') {
          cleanup()
          resolve(selectedIndex === items.length ? null : (items[selectedIndex] ?? null))
        } else if (str === '\x03') {
          cleanup()
          process.exit()
        } else {
          const n = parseInt(str)
          if (!isNaN(n) && n >= 0 && n <= Math.min(items.length, 9)) {
            selectedIndex = n === 0 ? items.length : n - 1
            renderList(true)
          }
        }
      }

      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.on('data', onKey)
    })
  }
}

export async function select<T extends SelectItem>(prompt: string, items: T[], options?: SelectOptions): Promise<T | null> {
  return new Select(options).ask(prompt, items)
}
