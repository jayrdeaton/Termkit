import type { Variable } from '@/models/Variable'
import type { VariableType } from '@/types'

function coerce(value: string, type: VariableType): unknown {
  if (type === 'number') return Number(value)
  if (type === 'boolean') return value === 'true'
  return value
}

export function findVariable(array: string[], variable: Variable, commands: string[]): unknown {
  if (variable.array) {
    const result: unknown[] = []
    while (array.length > 0 && !array[0].startsWith('-')) {
      if (commands.includes(array[0])) break
      result.push(coerce(array.shift()!, variable.type))
    }
    if (result.length === 0 && variable.required) throw new Error(`Missing required variable <${variable.name}>`)
    return result.length > 0 ? result : true
  }

  if (array.length > 0 && !array[0].startsWith('-')) {
    if ((!commands.includes(array[0]) || variable.required) && array[0] !== 'help') {
      return coerce(array.shift()!, variable.type)
    }
  }

  if (variable.required) throw new Error(`Missing required variable <${variable.name}>`)
  return true
}
