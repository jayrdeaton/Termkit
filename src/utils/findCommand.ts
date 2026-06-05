import type { Command } from '@/models/Command'

export function findCommand(array: string[], commands: Command[]): Command | null {
  for (const command of commands) {
    if (array[0] === command.name) {
      array.shift()
      return command
    }
  }
  return null
}
