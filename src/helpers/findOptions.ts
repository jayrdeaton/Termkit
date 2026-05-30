import { findOption } from '@/helpers/findOption'
import { findVariables } from '@/helpers/findVariables'
import type { Command } from '@/models/Command'

export function findOptions(array: string[], command: Command): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  while (array.length > 0 && array[0].startsWith('-')) {
    if (array[0].startsWith('--')) {
      const raw = array.shift()!.slice(2)
      const option = findOption(raw, command.optionsArray)
      if (!option) throw new Error(`Unknown Option: --${raw}`)
      try {
        Object.assign(result, findVariables(option.long, array, option.variables, command.commandStrings))
      } catch (err) {
        ;(err as Error).message += ` for --${option.long}`
        throw err
      }
    } else {
      let string = array.shift()!
      const short = string.slice(1, 2)
      const option = findOption(short, command.optionsArray)
      if (!option) throw new Error(`Unknown Option: -${short}`)
      string = string.replace(short, '')
      if (string !== '-') array.unshift(string)
      try {
        Object.assign(result, findVariables(option.long, array, option.variables, command.commandStrings))
      } catch (err) {
        ;(err as Error).message += ` for --${option.long}`
        throw err
      }
    }
  }

  return result
}
