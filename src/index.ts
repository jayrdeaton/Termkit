import { Command } from '@/models/Command'
import { Option } from '@/models/Option'
import type { MiddlewareFn } from '@/types'

export type { HelpColor } from '@/config'
export { configure } from '@/config'
import { config } from '@/config'
export type { BarMode, BarOptions } from '@/models/Bar'
export { Bar } from '@/models/Bar'
export * as Chart from '@/models/Chart'
export type { ColumnAlign, ColumnOptions } from '@/models/Column'
export { Column } from '@/models/Column'
export { Command } from '@/models/Command'
export type { InputOptions, InputReturn, InputType } from '@/models/Input'
export { confirm, Input, input } from '@/models/Input'
export type { LogOptions } from '@/models/Log'
export { Log, log } from '@/models/Log'
export type { MarkupOptions, MarkupStyleFn, MarkupStyles } from '@/models/Markup'
export { markup } from '@/models/Markup'
export type { MultiBarOptions } from '@/models/MultiBar'
export { MultiBar } from '@/models/MultiBar'
export type { MultiSelectItem, MultiSelectOptions } from '@/models/MultiSelect'
export { MultiSelect, multiSelect } from '@/models/MultiSelect'
export { Option } from '@/models/Option'
export type { ScrollboxOptions } from '@/models/Scrollbox'
export { Scrollbox, scrollbox } from '@/models/Scrollbox'
export type { SelectItem, SelectOptions } from '@/models/Select'
export { Select, select } from '@/models/Select'
export type { SpinnerOptions } from '@/models/Spinner'
export { Spinner } from '@/models/Spinner'
export type { TableOptions } from '@/models/Table'
export { Table } from '@/models/Table'
export { TermKit } from '@/models/TermKit'
export { Variable } from '@/models/Variable'
export type { ActionFn, MiddlewareFn, ParsedOptions, VariableType } from '@/types'
export { padLeft } from '@/utils/padLeft'
export { padRight } from '@/utils/padRight'
export { padSides } from '@/utils/padSides'
export { stringLength } from '@/utils/stringLength'
export { truncate } from '@/utils/truncate'
export { wrap } from '@/utils/wrap'
export { default as Color } from 'cosmetic'

export interface CommandDefaults {
  middlewares?: MiddlewareFn[]
  options?: Option[]
}

let base: Command | null = null
let commandDefaults: CommandDefaults = {}

export const command = (name: string, variables?: string | null, info?: string): Command => {
  const cmd = new Command(Object.assign({ name, variables, info }, commandDefaults))
  if (!base) base = cmd
  return cmd
}

export const middleware = (fn: MiddlewareFn): MiddlewareFn => fn

export const option = (short: string | null, long: string | null, variables: string | null, info: string): Option => new Option({ short, long, variables, info })

export const parse = async (arr: string[]): Promise<void> => {
  if (!base) throw new Error('No command defined')
  try {
    await base.parse(arr)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (process.stderr.isTTY && config.glyphs) {
      process.stderr.write(`\x1b[31m✖\x1b[0m ${msg}\n`)
    } else {
      process.stderr.write(`Error: ${msg}\n`)
    }
    process.exit(1)
  }
}

export const setDefaults = (data: CommandDefaults): void => {
  commandDefaults = data
}
