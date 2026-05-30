/* eslint-disable no-console */
import cosmetic from 'cosmetic'

import { findCommand } from '@/helpers/findCommand'
import { findCommandVariables } from '@/helpers/findCommandVariables'
import { findOptions } from '@/helpers/findOptions'
import { getVariables } from '@/helpers/getVariables'
import type { ActionFn, MiddlewareFn, ParsedOptions } from '@/types'
import { Option } from '@/models/Option'
import { Variable } from '@/models/Variable'

interface CommandData {
  name?: string
  variables?: string | null
  info?: string
  middlewares?: MiddlewareFn[]
  options?: Option[]
}

interface HelpSection {
  title: string
  info?: string | null
  data: [string, string][]
}

export class Command {
  actionFunction: ActionFn | null = null
  commandsArray: Command[] = []
  commandStrings: string[] = ['help']
  info: string | null = null
  middlewaresArray: MiddlewareFn[] = []
  name: string | null = null
  optionsArray: Option[] = []
  variables: Variable[] | null = null
  versionString: string | null = null

  constructor(data?: CommandData) {
    if (!data) return
    if (data.info) this.info = data.info
    if (data.name) this.name = data.name
    if (data.variables) this.variables = getVariables(data.variables)
    if (data.middlewares) this.middlewaresArray = [...data.middlewares]
    if (data.options) this.optionsArray = [...data.options]
  }

  description(info: string): this {
    this.info = info
    return this
  }

  variable(string: string): this {
    const vars = getVariables(string)
    if (!this.variables) {
      this.variables = vars
    } else {
      this.variables.push(...vars)
    }
    return this
  }

  action(fn: ActionFn): this {
    this.actionFunction = fn
    return this
  }

  command(cmd: Command): this {
    this.commandsArray.push(cmd)
    return this
  }

  commands(cmds: Command[]): this {
    this.commandsArray = [...cmds]
    for (const cmd of cmds) {
      if (cmd.name) this.commandStrings.unshift(cmd.name)
    }
    return this
  }

  middleware(fn: MiddlewareFn): this {
    this.middlewaresArray.push(fn)
    return this
  }

  middlewares(fns: MiddlewareFn[]): this {
    this.middlewaresArray.push(...fns)
    return this
  }

  option(short: string | null, long: string | null, variables: string | null, info: string): this {
    this.optionsArray.push(new Option({ short, long, variables, info }))
    return this
  }

  options(opts: Option[]): this {
    this.optionsArray.push(...opts)
    return this
  }

  version(v: string): this {
    this.versionString = v
    return this
  }

  help(_source?: string[]): void {
    const table: HelpSection[] = []

    let program = this.name ?? 'Program'
    if (this.variables) for (const v of this.variables) program += ` ${v.raw}`
    if (this.optionsArray.length > 0) program += ' [...options]'
    table.push({ title: '\nCommand', info: program, data: [] })

    if (this.versionString) table.push({ title: 'Version', info: `v${this.versionString}`, data: [] })
    if (this.info) table.push({ title: 'Info', info: this.info, data: [] })

    if (this.optionsArray.length > 0) {
      const section: HelpSection = { title: 'Options', data: [] }
      for (const opt of this.optionsArray) {
        let name = ''
        if (opt.short) name = `-${opt.short}`
        if (opt.short && opt.long) name += ', '
        if (opt.long) name += `--${opt.long}`
        if (opt.variables) for (const v of opt.variables) name += ` ${v.raw}`
        section.data.push([name, opt.info ?? ''])
      }
      table.push(section)
    }

    if (this.commandsArray.length > 0) {
      const section: HelpSection = { title: 'Subcommands', data: [] }
      for (const cmd of this.commandsArray) {
        let name = cmd.name ?? ''
        if (cmd.variables) for (const v of cmd.variables) name += ` ${v.raw}`
        section.data.push([name, cmd.info ?? ''])
      }
      table.push(section)
    }

    const padding: Record<number, number> = {}
    for (const section of table) {
      for (const row of section.data) {
        for (const [i, s] of row.entries()) {
          if (padding[i] === undefined || s.length > padding[i]) padding[i] = s.length
        }
      }
    }

    const lines: string[] = []
    for (const section of table) {
      lines.push(section.title ? cosmetic.cyan.underline.encoder(section.title) : '')
      if (section.info) lines.push(section.info)
      for (const row of section.data) {
        let line = ''
        for (const [i, s] of row.entries()) {
          const padded = padding[i] !== undefined ? s.padEnd(padding[i]) : s
          line = line ? `${line}  ${padded}` : padded
        }
        lines.push(line)
      }
      lines.push('')
    }

    for (const line of lines) console.log(line)
  }

  async parse(input: string[]): Promise<unknown> {
    const array = [...input]
    array.splice(0, 2)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let command: Command = this
    const options: ParsedOptions = { _source: Array.from(array) }

    while (array.length) {
      if (!array.includes('help')) {
        Object.assign(options, findOptions(array, command))
        const cmdVars = findCommandVariables(array, command)
        if (cmdVars) Object.assign(options, cmdVars)
        Object.assign(options, findOptions(array, command))
      }
      if (array.length) {
        if (!array.includes('help')) {
          for (const mw of command.middlewaresArray) await mw(options)
        }
        const next = findCommand(array, command.commandsArray)
        if (!next && array[0] === 'help') return command.help(options._source as string[])
        if (!next) throw new SyntaxError(`Unknown command: ${array[0]}`)

        const name = command.name ?? '_base'
        if (!options._parents) options._parents = {}
        options._parents[name] = {}
        for (const key of Object.keys(options)) {
          if (!key.startsWith('_')) {
            options._parents[name][key] = options[key]
            delete options[key]
          }
        }
        command = next
      }
    }

    for (const mw of command.middlewaresArray) await mw(options)
    if (command.actionFunction) return command.actionFunction(options)
    if (options._source.length === 2) return command.help(options._source as string[])
    throw new Error(`No action for command: ${command.name ?? '_base'}`)
  }
}
