import { findVariable } from '@/helpers/findVariable'
import type { Command } from '@/models/Command'

export function findCommandVariables(array: string[], command: Command): Record<string, unknown> | null {
  if (!command.variables) return null

  const result: Record<string, unknown> = {}
  for (const variable of command.variables) {
    const value = findVariable(array, variable, command.commandStrings)
    if (value !== true) result[variable.name!] = value
  }

  return Object.keys(result).length > 0 ? result : null
}
