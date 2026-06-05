import type { Variable } from '@/models/Variable'
import { findVariable } from '@/utils/findVariable'

export async function findVariables(base: string | null, array: string[], variables: Variable[] | null, commands: string[]): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {}

  if (!variables) {
    if (base) result[base] = true
    return result
  }

  if (variables.length > 1 && base) result[base] = {}

  for (const variable of variables) {
    const value = await findVariable(array, variable, commands)
    if (variables.length > 1 && base) {
      ;(result[base] as Record<string, unknown>)[variable.name!] = value
    } else if (base) {
      result[base] = value
    } else {
      result[variable.name!] = value
    }
  }

  return result
}
