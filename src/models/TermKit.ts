import { Command } from '@/models/Command'
import { Option } from '@/models/Option'
import type { MiddlewareFn } from '@/types'

interface TermKitDefaults {
  middlewares?: MiddlewareFn[]
  options?: Option[]
}

export class TermKit {
  private static base: Command | null = null
  private static commandDefaults: TermKitDefaults = {}

  static set defaults(obj: TermKitDefaults) {
    TermKit.commandDefaults = obj
  }

  static setDefaults(obj: TermKitDefaults): void {
    TermKit.commandDefaults = obj
  }

  static command(name: string, variables?: string | null, info?: string): Command {
    const cmd = new Command(Object.assign({ name, variables, info }, TermKit.commandDefaults))
    if (!TermKit.base) TermKit.base = cmd
    return cmd
  }

  static middleware(action: MiddlewareFn): MiddlewareFn {
    return action
  }

  static option(short: string | null, long: string | null, variables: string | null, info: string): Option {
    return new Option({ short, long, variables, info })
  }

  static parse(arr: string[]): Promise<unknown> {
    if (!TermKit.base) throw new Error('No command defined')
    return TermKit.base.parse(arr)
  }
}
