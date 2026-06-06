import { stringLength } from '@/utils/stringLength'

export type ColumnAlign = 'left' | 'center' | 'right'

export interface ColumnOptions {
  key: string
  title?: string
  padding?: number
  align?: ColumnAlign
  hidden?: boolean
  minimumPadding?: number
  value?: (v: unknown) => string
}

export class Column {
  key: string
  title: string
  padding: number
  align?: ColumnAlign
  hidden?: boolean
  value: (v: unknown) => string

  constructor(data: ColumnOptions | string) {
    if (typeof data === 'string') data = { key: data }
    this.key = data.key ?? ''
    this.title = data.title ?? this.key
    this.padding = data.padding ?? 0
    this.align = data.align
    this.hidden = data.hidden
    if (stringLength(this.title) > this.padding) this.padding = stringLength(this.title)
    if (data.minimumPadding && data.minimumPadding > this.padding) this.padding = data.minimumPadding
    this.value = data.value ?? ((v: unknown) => (v == null ? '' : String(v)))
  }
}
