import cosmetic from 'cosmetic'

import { config } from '@/config'
import { Column, type ColumnAlign, type ColumnOptions } from '@/models/Column'
import { padLeft } from '@/utils/padLeft'
import { padRight } from '@/utils/padRight'
import { padSides } from '@/utils/padSides'
import { stringLength } from '@/utils/stringLength'

export interface TableOptions {
  title?: string
  columns?: (ColumnOptions | string)[]
  meta?: Record<string, unknown>[]
  separator?: string
  align?: ColumnAlign
  margin?: number
}

const alignPad = (align: ColumnAlign) => {
  switch (align) {
    case 'center':
      return padSides
    case 'right':
      return padLeft
    default:
      return padRight
  }
}

export class Table {
  static readonly left: ColumnAlign = 'left'
  static readonly center: ColumnAlign = 'center'
  static readonly right: ColumnAlign = 'right'

  rows: Record<string, unknown>[]
  columns: Record<string, Column>
  separator: string
  align: ColumnAlign
  margin: number
  title?: string
  meta?: Record<string, unknown>[]
  string: string

  constructor(rows: Record<string, unknown>[], options: TableOptions = {}) {
    this.rows = rows
    this.columns = {}
    this.separator = options.separator ?? '|'
    this.align = options.align ?? 'left'
    this.margin = options.margin ?? 0
    this.string = ''

    if (options.title) this.title = options.title

    if (options.columns) {
      for (const col of options.columns) {
        const column = new Column(col as ColumnOptions | string)
        if (!column.hidden) this.columns[column.key] = column
      }
    }

    for (const row of this.rows) {
      for (const key of Object.keys(row)) {
        if (Object.keys(this.columns).length) {
          const column = this.columns[key]
          if (!column) continue
          const cellLen = stringLength(column.value(row[key]))
          if (column.padding < cellLen) this.columns[key].padding = cellLen
        } else {
          const keyLen = stringLength(key)
          const valLen = stringLength(String(row[key] ?? ''))
          this.columns[key] = new Column({ key, padding: Math.max(keyLen, valLen) })
        }
      }
    }

    if (options.meta) {
      this.meta = options.meta
      for (const meta of options.meta) {
        for (const key of Object.keys(meta)) {
          const column = this.columns[key]
          if (!column) continue
          const cellLen = stringLength(column.value(meta[key]))
          if (column.padding < cellLen) column.padding = cellLen
        }
      }
    }

    if (this.title) this.string += `${alignPad(this.align)(this.title, this.width)}\n\n`

    const keys = Object.keys(this.columns)
    let header = ''
    for (const [i, key] of keys.entries()) {
      const column = this.columns[key]
      const pad = alignPad(column.align ?? this.align)
      header += pad(column.title, column.padding + this.margin)
      if (i < keys.length - 1) header += this.separator
    }
    const styled = typeof config.color === 'number' ? cosmetic.xterm(config.color) : config.color.startsWith('#') ? cosmetic.hex(config.color) : (cosmetic[config.color as keyof typeof cosmetic] as typeof cosmetic)
    this.string += `${styled.underline.encoder(header)}\n`

    for (const [ri, row] of this.rows.entries()) {
      for (const [ci, key] of keys.entries()) {
        const column = this.columns[key]
        const pad = alignPad(column.align ?? this.align)
        const raw = row[column.key]
        this.string += pad(column.value(raw == null ? '' : raw), column.padding + this.margin)
        if (ci < keys.length - 1) this.string += this.separator
      }
      if (ri < this.rows.length - 1) this.string += '\n'
    }

    if (this.meta) {
      this.string += '\n\n'
      for (const [mi, meta] of this.meta.entries()) {
        for (const [ci, key] of keys.entries()) {
          const column = this.columns[key]
          const pad = alignPad(column.align ?? this.align)
          const raw = meta[column.key]
          this.string += pad(column.value(raw == null ? '' : raw), column.padding + this.margin)
          if (ci < keys.length - 1) this.string += this.separator
        }
        if (mi < this.meta.length - 1) this.string += '\n'
      }
    }
  }

  print(): void {
    process.stdout.write(this.string + '\n')
  }

  get width(): number {
    let width = 0
    for (const key of Object.keys(this.columns)) {
      if (!this.columns[key].hidden) width += this.columns[key].padding + this.margin + 1
    }
    return width - 1
  }
}
