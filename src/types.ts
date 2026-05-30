export type VariableType = 'string' | 'number' | 'boolean'

export interface ParsedOptions {
  _source: string[]
  _parents?: Record<string, Record<string, unknown>>
  [key: string]: unknown
}

export type ActionFn = (options: ParsedOptions) => unknown | Promise<unknown>
export type MiddlewareFn = (options: ParsedOptions) => void | Promise<void>
