import Color from 'cosmetic'

import { config } from '@/config'
import { formatColor, interpolateColor, parseHex, RESET } from '@/utils/color'
import { padLeft } from '@/utils/padLeft'
import { padRight } from '@/utils/padRight'
import { stringLength } from '@/utils/stringLength'

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return parseFloat(n.toFixed(2)).toString()
}

function applyConfigColor(s: string): string {
  const c = config.color
  if (typeof c === 'number') return Color.xterm(c).encoder(s)
  if (c.startsWith('#')) return Color.hex(c).encoder(s)
  return (Color[c as keyof typeof Color] as typeof Color).encoder(s)
}

function applyPadding(str: string, paddingX: number, paddingY: number): string {
  const lines = str.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  const indented = lines.map(l => ' '.repeat(paddingX) + l).join('\n') + '\n'
  return '\n'.repeat(paddingY) + indented + '\n'.repeat(paddingY)
}

const BLOCKS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const

export namespace Chart {
  // ── Bar (horizontal) ───────────────────────────────────────────────────

  export interface BarItem {
    key?: string
    value: number
    style?: (s: string) => string
    character?: string
  }

  export interface BarOptions {
    width?: number
    paddingX?: number
    paddingY?: number
  }

  export class Bar {
    private string = ''

    constructor(data: (BarItem | null)[], options: BarOptions = {}) {
      const paddingX = options.paddingX ?? 0
      const paddingY = options.paddingY ?? 0
      let maxKeyLen = 0
      let maxValue = 0
      let maxValueLen = 0

      for (const item of data) {
        if (!item) continue
        if (item.key) maxKeyLen = Math.max(maxKeyLen, stringLength(item.key))
        maxValue = Math.max(maxValue, item.value)
        maxValueLen = Math.max(maxValueLen, String(item.value).length)
      }

      const cols = options.width ?? process.stdout.columns ?? 80
      const available = cols - maxKeyLen - maxValueLen - 3
      const scale = maxValue > 0 && available > 0 ? available / maxValue : 0
      const encodeKey = (s: string): string => typeof config.color === 'number' ? Color.xterm(config.color).encoder(s) : config.color.startsWith('#') ? Color.hex(config.color).encoder(s) : (Color[config.color as keyof typeof Color] as typeof Color).encoder(s)

      for (const item of data) {
        if (!item) {
          this.string += '\n'
          continue
        }
        const rawKey = item.key ?? ''
        const keyPart = (rawKey ? encodeKey(rawKey) : '') + ' '.repeat(maxKeyLen - stringLength(rawKey))
        const barWidth = Math.max(1, Math.floor(item.value * scale))
        let bar = (item.character ?? ' ').repeat(barWidth)
        bar = item.style ? item.style(bar) : Color.background.white.encoder(bar)
        this.string += `${keyPart}|${bar} ${item.value}\n`
      }

      if (paddingX > 0 || paddingY > 0) this.string = applyPadding(this.string, paddingX, paddingY)
    }

    print(): void {
      process.stdout.write(this.string)
    }

    toString(): string {
      return this.string
    }
  }

  // ── VerticalBar ────────────────────────────────────────────────────────

  export interface VerticalBarItem {
    key?: string
    value: number
    style?: (s: string) => string
  }

  export interface VerticalBarOptions {
    width?: number
    height?: number
    colWidth?: number
    paddingX?: number
    paddingY?: number
  }

  export class VerticalBar {
    private string = ''

    constructor(data: (VerticalBarItem | null)[], options: VerticalBarOptions = {}) {
      const paddingX = options.paddingX ?? 0
      const paddingY = options.paddingY ?? 0
      const height = options.height ?? 10
      const colWidth = options.colWidth ?? (options.width
        ? Math.max(1, Math.floor(options.width / data.length))
        : 2)

      let maxValue = 0
      for (const item of data) {
        if (item) maxValue = Math.max(maxValue, item.value)
      }

      for (let row = height; row >= 1; row--) {
        let line = ''
        for (const item of data) {
          if (!item) {
            line += ' '.repeat(colWidth)
            continue
          }
          const barHeight = maxValue > 0 ? (item.value / maxValue) * height : 0
          const full = Math.floor(barHeight)
          const frac = barHeight - full

          let chars: string
          if (row <= full) {
            chars = '█'.repeat(colWidth)
          } else if (row === full + 1 && frac > 0) {
            chars = (BLOCKS[Math.round(frac * 8)] ?? ' ').repeat(colWidth)
          } else {
            chars = ' '.repeat(colWidth)
          }

          if (item.style && chars.trim()) chars = item.style(chars)
          line += chars
        }
        this.string += line + '\n'
      }

      this.string += '─'.repeat(data.length * colWidth) + '\n'

      if (data.some(item => item?.key)) {
        const encodeLabel = (s: string): string => typeof config.color === 'number' ? Color.xterm(config.color).encoder(s) : config.color.startsWith('#') ? Color.hex(config.color).encoder(s) : (Color[config.color as keyof typeof Color] as typeof Color).encoder(s)
        let labels = ''
        for (const item of data) {
          if (!item?.key) {
            labels += ' '.repeat(colWidth)
          } else {
            const key = item.key.length > colWidth ? item.key.slice(0, colWidth) : item.key
            labels += encodeLabel(key) + ' '.repeat(colWidth - key.length)
          }
        }
        this.string += labels + '\n'
      }

      if (paddingX > 0 || paddingY > 0) this.string = applyPadding(this.string, paddingX, paddingY)
    }

    print(): void {
      process.stdout.write(this.string)
    }

    toString(): string {
      return this.string
    }
  }

  // ── Heatmap ────────────────────────────────────────────────────────────

  export interface HeatmapOptions {
    rowLabels?: string[]
    colLabels?: string[]
    min?: number
    max?: number
    colors?: string[]
    cellWidth?: number
    paddingX?: number
    paddingY?: number
  }

  export class Heatmap {
    private string = ''

    constructor(data: number[][], options: HeatmapOptions = {}) {
      const paddingX = options.paddingX ?? 0
      const paddingY = options.paddingY ?? 0
      const cellWidth = options.cellWidth ?? 2
      const parsedColors = (options.colors ?? ['#0000ff', '#ff0000']).map(parseHex)

      let min = options.min
      let max = options.max
      for (const row of data) {
        for (const val of row) {
          if (min === undefined || val < min) min = val
          if (max === undefined || val > max) max = val
        }
      }
      const lo = min ?? 0
      const hi = max ?? 1
      const range = hi - lo || 1

      const rowLabelWidth = options.rowLabels
        ? Math.max(...options.rowLabels.map(l => stringLength(l))) + 1
        : 0

      if (options.colLabels) {
        this.string += ' '.repeat(rowLabelWidth)
        for (const label of options.colLabels) {
          this.string += label.length > cellWidth ? label.slice(0, cellWidth) : label.padEnd(cellWidth)
        }
        this.string += '\n'
      }

      for (let r = 0; r < data.length; r++) {
        if (options.rowLabels) {
          this.string += padRight(options.rowLabels[r] ?? '', rowLabelWidth - 1) + ' '
        }
        for (const val of data[r]) {
          const t = (val - lo) / range
          const color = interpolateColor(parsedColors, t)
          this.string += `${formatColor(48, color)}${' '.repeat(cellWidth)}${RESET}`
        }
        this.string += '\n'
      }

      if (paddingX > 0 || paddingY > 0) this.string = applyPadding(this.string, paddingX, paddingY)
    }

    print(): void {
      process.stdout.write(this.string)
    }

    toString(): string {
      return this.string
    }
  }

  // ── Scatter ────────────────────────────────────────────────────────────

  export interface ScatterPoint {
    x: number
    y: number
    character?: string
    style?: (s: string) => string
  }

  export interface ScatterOptions {
    width?: number
    height?: number
    xMin?: number
    xMax?: number
    yMin?: number
    yMax?: number
    character?: string
    axes?: boolean
    paddingX?: number
    paddingY?: number
  }

  export class Scatter {
    private string = ''

    constructor(data: ScatterPoint[], options: ScatterOptions = {}) {
      const paddingX = options.paddingX ?? 0
      const paddingY = options.paddingY ?? 0
      const defaultChar = options.character ?? '•'
      const showAxes = options.axes ?? true

      let xMin = options.xMin ?? (data.length ? Math.min(...data.map(p => p.x)) : 0)
      let xMax = options.xMax ?? (data.length ? Math.max(...data.map(p => p.x)) : 1)
      let yMin = options.yMin ?? (data.length ? Math.min(...data.map(p => p.y)) : 0)
      let yMax = options.yMax ?? (data.length ? Math.max(...data.map(p => p.y)) : 1)

      if (xMin === xMax) { xMin -= 1; xMax += 1 }
      if (yMin === yMax) { yMin -= 1; yMax += 1 }

      const totalWidth = options.width ?? process.stdout.columns ?? 80
      const totalHeight = options.height ?? 20

      const plotWidth = showAxes
        ? Math.max(1, totalWidth - Math.max(formatNum(yMax).length, formatNum(yMin).length, formatNum((yMin + yMax) / 2).length) - 1)
        : totalWidth
      const plotHeight = showAxes ? Math.max(1, totalHeight - 2) : totalHeight

      const grid: string[][] = Array.from({ length: plotHeight }, () => Array(plotWidth).fill(' '))

      for (const point of data) {
        const col = Math.round(((point.x - xMin) / (xMax - xMin)) * (plotWidth - 1))
        const row = plotHeight - 1 - Math.round(((point.y - yMin) / (yMax - yMin)) * (plotHeight - 1))
        if (col >= 0 && col < plotWidth && row >= 0 && row < plotHeight) {
          const char = point.character ?? defaultChar
          grid[row][col] = point.style ? point.style(char) : char
        }
      }

      if (showAxes) {
        const yAxisWidth = Math.max(formatNum(yMax).length, formatNum(yMin).length, formatNum((yMin + yMax) / 2).length)
        const midRow = Math.floor((plotHeight - 1) / 2)

        for (let r = 0; r < plotHeight; r++) {
          let yLabel = ''
          if (r === 0) yLabel = formatNum(yMax)
          else if (r === midRow) yLabel = formatNum((yMin + yMax) / 2)
          else if (r === plotHeight - 1) yLabel = formatNum(yMin)
          const coloredLabel = yLabel ? applyConfigColor(yLabel) : ''
          this.string += padLeft(coloredLabel, yAxisWidth) + '│' + grid[r].join('') + '\n'
        }

        this.string += ' '.repeat(yAxisWidth) + '└' + '─'.repeat(plotWidth) + '\n'

        const xMinRaw = formatNum(xMin)
        const xMidRaw = formatNum((xMin + xMax) / 2)
        const xMaxRaw = formatNum(xMax)
        const midCol = Math.floor(plotWidth / 2) - Math.floor(xMidRaw.length / 2)
        const gap1 = Math.max(0, midCol - xMinRaw.length)
        const gap2 = Math.max(0, plotWidth - xMinRaw.length - gap1 - xMidRaw.length - xMaxRaw.length)
        this.string += ' '.repeat(yAxisWidth + 1) + applyConfigColor(xMinRaw) + ' '.repeat(gap1) + applyConfigColor(xMidRaw) + ' '.repeat(gap2) + applyConfigColor(xMaxRaw) + '\n'
      } else {
        for (const row of grid) {
          this.string += row.join('') + '\n'
        }
      }

      if (paddingX > 0 || paddingY > 0) this.string = applyPadding(this.string, paddingX, paddingY)
    }

    print(): void {
      process.stdout.write(this.string)
    }

    toString(): string {
      return this.string
    }
  }

  // ── Line ───────────────────────────────────────────────────────────────

  export interface LinePoint {
    x: number
    y: number
    style?: (s: string) => string
  }

  export interface LineOptions {
    width?: number
    height?: number
    xMin?: number
    xMax?: number
    yMin?: number
    yMax?: number
    character?: string
    axes?: boolean
    fill?: boolean
    paddingX?: number
    paddingY?: number
  }

  export class Line {
    private string = ''

    constructor(data: LinePoint[], options: LineOptions = {}) {
      const paddingX = options.paddingX ?? 0
      const paddingY = options.paddingY ?? 0
      const defaultChar = options.character ?? '•'
      const showAxes = options.axes ?? true
      const fill = options.fill ?? false

      let xMin = options.xMin ?? (data.length ? Math.min(...data.map(p => p.x)) : 0)
      let xMax = options.xMax ?? (data.length ? Math.max(...data.map(p => p.x)) : 1)
      let yMin = options.yMin ?? (data.length ? Math.min(...data.map(p => p.y)) : 0)
      let yMax = options.yMax ?? (data.length ? Math.max(...data.map(p => p.y)) : 1)

      if (xMin === xMax) { xMin -= 1; xMax += 1 }
      if (yMin === yMax) { yMin -= 1; yMax += 1 }

      const totalWidth = options.width ?? process.stdout.columns ?? 80
      const totalHeight = options.height ?? 20

      const yAxisWidth = showAxes
        ? Math.max(formatNum(yMax).length, formatNum(yMin).length, formatNum((yMin + yMax) / 2).length)
        : 0
      const plotWidth = showAxes ? Math.max(1, totalWidth - yAxisWidth - 1) : totalWidth
      const plotHeight = showAxes ? Math.max(1, totalHeight - 2) : totalHeight

      const grid: string[][] = Array.from({ length: plotHeight }, () => Array(plotWidth).fill(' '))

      const sorted = [...data].sort((a, b) => a.x - b.x)
      const xRange = xMax - xMin
      const yRange = yMax - yMin

      for (let col = 0; col < plotWidth; col++) {
        const xVal = xMin + (col / Math.max(1, plotWidth - 1)) * xRange
        let yVal: number | null = null
        let pointStyle: ((s: string) => string) | undefined

        for (let pi = 0; pi < sorted.length; pi++) {
          const p = sorted[pi]
          const next = sorted[pi + 1]
          if (next === undefined) {
            if (Math.abs(p.x - xVal) <= xRange / plotWidth) {
              yVal = p.y
              pointStyle = p.style
            }
            break
          }
          if (p.x <= xVal && next.x >= xVal) {
            const t = next.x === p.x ? 0 : (xVal - p.x) / (next.x - p.x)
            yVal = p.y + t * (next.y - p.y)
            if (t < 0.5 && p.style) pointStyle = p.style
            else if (t >= 0.5 && next.style) pointStyle = next.style
            break
          }
        }

        if (yVal !== null) {
          const row = Math.round((1 - (yVal - yMin) / yRange) * (plotHeight - 1))
          const clampedRow = Math.max(0, Math.min(plotHeight - 1, row))
          const char = defaultChar
          grid[clampedRow][col] = pointStyle ? pointStyle(char) : char
          if (fill) {
            for (let r = clampedRow + 1; r < plotHeight; r++) {
              if (grid[r][col] === ' ') grid[r][col] = '░'
            }
          }
        }
      }

      if (showAxes) {
        const midRow = Math.floor((plotHeight - 1) / 2)
        for (let r = 0; r < plotHeight; r++) {
          let yLabel = ''
          if (r === 0) yLabel = formatNum(yMax)
          else if (r === midRow) yLabel = formatNum((yMin + yMax) / 2)
          else if (r === plotHeight - 1) yLabel = formatNum(yMin)
          const coloredLabel = yLabel ? applyConfigColor(yLabel) : ''
          this.string += padLeft(coloredLabel, yAxisWidth) + '│' + grid[r].join('') + '\n'
        }
        this.string += ' '.repeat(yAxisWidth) + '└' + '─'.repeat(plotWidth) + '\n'

        const xMinRaw = formatNum(xMin)
        const xMidRaw = formatNum((xMin + xMax) / 2)
        const xMaxRaw = formatNum(xMax)
        const midCol = Math.floor(plotWidth / 2) - Math.floor(xMidRaw.length / 2)
        const gap1 = Math.max(0, midCol - xMinRaw.length)
        const gap2 = Math.max(0, plotWidth - xMinRaw.length - gap1 - xMidRaw.length - xMaxRaw.length)
        this.string += ' '.repeat(yAxisWidth + 1) + applyConfigColor(xMinRaw) + ' '.repeat(gap1) + applyConfigColor(xMidRaw) + ' '.repeat(gap2) + applyConfigColor(xMaxRaw) + '\n'
      } else {
        for (const row of grid) {
          this.string += row.join('') + '\n'
        }
      }

      if (paddingX > 0 || paddingY > 0) this.string = applyPadding(this.string, paddingX, paddingY)
    }

    print(): void {
      process.stdout.write(this.string)
    }

    toString(): string {
      return this.string
    }
  }

  // ── sparkline ──────────────────────────────────────────────────────────

  export interface SparklineOptions {
    min?: number
    max?: number
    style?: (s: string) => string
  }

  export function Sparkline(data: number[], options: SparklineOptions = {}): string {
    const lo = options.min ?? Math.min(...data)
    const hi = options.max ?? Math.max(...data)
    const range = hi === lo ? 1 : hi - lo
    const chars = data.map(v => {
      const idx = Math.min(8, Math.round(Math.max(0, Math.min(1, (v - lo) / range)) * 8))
      return BLOCKS[idx] ?? '█'
    }).join('')
    return options.style ? options.style(chars) : chars
  }
}
