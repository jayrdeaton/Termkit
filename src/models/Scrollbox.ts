import { colorText, HIDE_CURSOR, RESET, SHOW_CURSOR } from '@/utils/color'
import { registerCleanup } from '@/utils/cleanup'
import { padRight } from '@/utils/padRight'
import { truncate } from '@/utils/truncate'
import { wrap } from '@/utils/wrap'

export interface ScrollboxOptions {
  height?: number
  title?: string
  lineNumbers?: boolean
  scrollbar?: boolean
  borderColor?: string
  wrapLines?: boolean
}

const CURSOR_UP = (n: number) => `\x1b[${n}A`
const DIM = '\x1b[2m'

export class Scrollbox {
  private height: number
  private title: string | undefined
  private lineNumbers: boolean
  private showScrollbar: boolean
  private borderColor: string
  private wrapLines: boolean

  constructor(options: ScrollboxOptions = {}) {
    this.height = options.height ?? 10
    this.title = options.title
    this.lineNumbers = options.lineNumbers ?? false
    this.showScrollbar = options.scrollbar ?? true
    this.borderColor = options.borderColor ?? DIM
    this.wrapLines = options.wrapLines ?? false
  }

  async show(lines: string[]): Promise<void> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Scrollbox requires an interactive terminal')

    const termWidth = process.stdout.columns ?? 80
    const lineNumWidth = this.lineNumbers ? String(lines.length).length + 2 : 0
    const gutterWidth = this.showScrollbar ? 1 : 0
    const contentWidth = Math.max(10, termWidth - lineNumWidth - gutterWidth)

    const displayLines = this.wrapLines
      ? lines.flatMap(line => wrap(line, contentWidth).split('\n'))
      : lines

    const total = displayLines.length
    let offset = 0
    let lastDrawnLines = 0

    process.stdout.write(HIDE_CURSOR)

    const render = (redraw: boolean) => {
      offset = Math.max(0, Math.min(offset, Math.max(0, total - this.height)))

      if (redraw && lastDrawnLines > 0) {
        process.stdout.write(CURSOR_UP(lastDrawnLines))
        process.stdout.write('\x1b[0J')
      }
      lastDrawnLines = 0

      if (this.title) {
        process.stdout.write(`\r${colorText(this.borderColor, this.title)}\n`)
        lastDrawnLines++
      }

      let thumbStart = 0
      let thumbEnd = this.height
      if (this.showScrollbar && total > this.height) {
        const thumbSize = Math.max(1, Math.floor((this.height / total) * this.height))
        thumbStart = Math.floor((offset / Math.max(1, total - this.height)) * (this.height - thumbSize))
        thumbEnd = thumbStart + thumbSize
      }

      const visibleEnd = Math.min(total, offset + this.height)
      for (let i = offset; i < visibleEnd; i++) {
        const relIdx = i - offset
        const numStr = this.lineNumbers
          ? `${colorText(this.borderColor, String(i + 1).padStart(lineNumWidth - 1))} `
          : ''
        const content = this.wrapLines ? displayLines[i] : truncate(displayLines[i], contentWidth)
        const paddedContent = padRight(content, contentWidth)
        const gutter = this.showScrollbar
          ? (total > this.height && relIdx >= thumbStart && relIdx < thumbEnd ? '█' : colorText(this.borderColor, '▕'))
          : ''
        process.stdout.write(`\r${numStr}${paddedContent}${gutter}\n`)
        lastDrawnLines++
      }

      const pct = total <= this.height
        ? '100%'
        : `${Math.round((offset / (total - this.height)) * 100)}%`
      process.stdout.write(`\r${DIM}↑↓/jk line  space/b page  g/G top/end  q close  ${pct}${RESET}\n`)
      lastDrawnLines++
    }

    render(false)

    return new Promise((resolve) => {
      const deregisterCleanup = registerCleanup(() => {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onKey)
        process.stdout.write(SHOW_CURSOR)
      })

      const cleanup = () => {
        deregisterCleanup()
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onKey)
        process.stdout.write(SHOW_CURSOR)
        resolve()
      }

      const onKey = (key: Buffer) => {
        const str = key.toString()
        if (str === '\x1b[A' || str === 'k') {
          offset--
          render(true)
        } else if (str === '\x1b[B' || str === 'j') {
          offset++
          render(true)
        } else if (str === ' ' || str === '\x1b[6~') {
          offset += this.height
          render(true)
        } else if (str === 'b' || str === '\x1b[5~') {
          offset -= this.height
          render(true)
        } else if (str === 'g') {
          offset = 0
          render(true)
        } else if (str === 'G') {
          offset = total
          render(true)
        } else if (str === 'q' || str === '\x1b' || str === '\r' || str === '\n') {
          cleanup()
        } else if (str === '\x03') {
          cleanup()
          process.exit(130)
        }
      }

      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.on('data', onKey)
    })
  }
}

export async function scrollbox(lines: string[], options?: ScrollboxOptions): Promise<void> {
  return new Scrollbox(options).show(lines)
}
