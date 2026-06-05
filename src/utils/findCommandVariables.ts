import type { Command } from '@/models/Command'
import { findVariable } from '@/utils/findVariable'

export async function findCommandVariables(array: string[], command: Command): Promise<Record<string, unknown> | null> {
  if (!command.variables) return null

  const result: Record<string, unknown> = {}
  for (const variable of command.variables) {
    const value = await findVariable(array, variable, command.commandStrings)
    if (value !== true) result[variable.name!] = value
  }

  return Object.keys(result).length > 0 ? result : null
}
