import { Command } from '@/models/Command'
import { Option } from '@/models/Option'
import type { MiddlewareFn } from '@/types'

export { Command } from '@/models/Command'
export { Option } from '@/models/Option'
export { TermKit } from '@/models/TermKit'
export { Variable } from '@/models/Variable'
export type { ActionFn, MiddlewareFn, ParsedOptions, VariableType } from '@/types'

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

export const parse = (arr: string[]): Promise<unknown> => {
  if (!base) throw new Error('No command defined')
  return base.parse(arr)
}

export const setDefaults = (data: CommandDefaults): void => {
  commandDefaults = data
}
