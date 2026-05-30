import type { MiddlewareFn } from '@/types'
import { Command } from '@/models/Command'
import { Option } from '@/models/Option'

interface TermkitDefaults {
  middlewares?: MiddlewareFn[]
  options?: Option[]
}

export class Termkit {
  private static base: Command | null = null
  private static commandDefaults: TermkitDefaults = {}

  static set defaults(obj: TermkitDefaults) {
    Termkit.commandDefaults = obj
  }

  static setDefaults(obj: TermkitDefaults): void {
    Termkit.commandDefaults = obj
  }

  static command(name: string, variables?: string | null, info?: string): Command {
    const cmd = new Command(Object.assign({ name, variables, info }, Termkit.commandDefaults))
    if (!Termkit.base) Termkit.base = cmd
    return cmd
  }

  static middleware(action: MiddlewareFn): MiddlewareFn {
    return action
  }

  static option(short: string | null, long: string | null, variables: string | null, info: string): Option {
    return new Option({ short, long, variables, info })
  }

  static parse(arr: string[]): Promise<unknown> {
    if (!Termkit.base) throw new Error('No command defined')
    return Termkit.base.parse(arr)
  }
}
