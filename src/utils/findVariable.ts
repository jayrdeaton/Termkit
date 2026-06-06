import { config } from '@/config'
import { Input, type InputType } from '@/models/Input'
import { Select } from '@/models/Select'
import { resolveColor } from '@/utils/color'
import type { Variable } from '@/models/Variable'
import type { VariableType } from '@/types'

export function coerce(value: string, type: VariableType, enumValues: string[] | null, min: number | null = null, max: number | null = null): unknown {
  if (type === 'number' || type === 'integer') {
    const n = Number(value)
    if (type === 'integer' && !Number.isInteger(n)) throw new Error(`Invalid value "${value}" — expected an integer`)
    if (min !== null && n < min) throw new Error(`Invalid value "${value}" — must be >= ${min}`)
    if (max !== null && n > max) throw new Error(`Invalid value "${value}" — must be <= ${max}`)
    return n
  }
  if (type === 'string') {
    if (min !== null && value.length < min) throw new Error(`Invalid value "${value}" — must be at least ${min} characters`)
    if (max !== null && value.length > max) throw new Error(`Invalid value "${value}" — must be at most ${max} characters`)
    return value
  }
  if (type === 'boolean') return value === 'true'
  if (type === 'enum' && enumValues) {
    if (!enumValues.includes(value)) {
      throw new Error(`Invalid value "${value}" — expected one of: ${enumValues.join(', ')}`)
    }
  }
  return value
}

async function promptForVariable(variable: Variable): Promise<unknown | null> {
  const promptColor = resolveColor(config.color)

  if (variable.type === 'enum' && variable.enum) {
    const items = variable.enum.map(label => ({ label }))
    const result = await new Select({ promptColor }).ask(`<${variable.name}>`, items)
    return result !== null ? result.label : null
  }

  const isNumeric = variable.type === 'number' || variable.type === 'integer'
  return new Input({
    type: variable.type as InputType,
    promptColor,
    min: isNumeric ? variable.min ?? undefined : undefined,
    max: isNumeric ? variable.max ?? undefined : undefined,
    minLength: !isNumeric ? variable.min ?? undefined : undefined,
    maxLength: !isNumeric ? variable.max ?? undefined : undefined,
    required: true,
  }).ask(`<${variable.name}>`)
}

export async function findVariable(array: string[], variable: Variable, commands: string[]): Promise<unknown> {
  if (variable.array) {
    const result: unknown[] = []
    while (array.length > 0 && !array[0].startsWith('-')) {
      if (commands.includes(array[0])) break
      result.push(coerce(array.shift()!, variable.type, variable.enum, variable.min, variable.max))
    }
    if (result.length === 0 && variable.required) {
      if (config.interactive && process.stdout.isTTY) {
        try {
          const value = await promptForVariable(variable)
          if (value !== null) return [value]
        } catch {
          throw new Error(`Missing required variable <${variable.name}> — stdin is not interactive`)
        }
      }
      throw new Error(`Missing required variable <${variable.name}>`)
    }
    return result.length > 0 ? result : true
  }

  if (array.length > 0 && !array[0].startsWith('-')) {
    if ((!commands.includes(array[0]) || variable.required) && array[0] !== 'help') {
      return coerce(array.shift()!, variable.type, variable.enum, variable.min, variable.max)
    }
  }

  if (variable.required) {
    if (config.interactive && process.stdout.isTTY) {
      try {
        const value = await promptForVariable(variable)
        if (value !== null) return value
      } catch {
        throw new Error(`Missing required variable <${variable.name}> — stdin is not interactive`)
      }
    }
    throw new Error(`Missing required variable <${variable.name}>`)
  }
  if (variable.default !== null) return coerce(variable.default, variable.type, variable.enum)
  return true
}
