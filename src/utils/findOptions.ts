import type { Command } from '@/models/Command'
import { findOption } from '@/utils/findOption'
import { findVariables } from '@/utils/findVariables'

export async function findOptions(array: string[], command: Command): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {}

  while (array.length > 0 && array[0].startsWith('-')) {
    if (array[0].startsWith('--')) {
      const raw = array.shift()!.slice(2)
      if (raw.startsWith('no-')) {
        const longName = raw.slice(3)
        const negated = findOption(longName, command.optionsArray)
        if (negated?.long) {
          result[negated.long] = false
          continue
        }
      }
      const option = findOption(raw, command.optionsArray)
      if (!option) throw new Error(`Unknown Option: --${raw}`)
      try {
        Object.assign(result, await findVariables(option.long, array, option.variables, command.commandStrings))
      } catch (err) {
        ;(err as Error).message += ` for --${option.long}`
        throw err
      }
    } else {
      let string = array.shift()!
      const short = string.slice(1, 2)
      const option = findOption(short, command.optionsArray)
      if (!option) throw new Error(`Unknown Option: -${short}`)
      string = '-' + string.slice(2)
      if (string !== '-') array.unshift(string)
      try {
        Object.assign(result, await findVariables(option.long, array, option.variables, command.commandStrings))
      } catch (err) {
        ;(err as Error).message += ` for --${option.long}`
        throw err
      }
    }
  }

  return result
}
