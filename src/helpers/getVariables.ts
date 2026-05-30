import { Variable } from '@/models/Variable'
import type { VariableType } from '@/types'

function parseName(raw: string): { name: string; type: VariableType } {
  const colon = raw.indexOf(':')
  if (colon === -1) return { name: raw, type: 'string' }
  return {
    name: raw.slice(0, colon),
    type: raw.slice(colon + 1) as VariableType
  }
}

export function getVariables(string: string): Variable[] {
  const results: Variable[] = []
  for (const part of string.split(' ')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      const { name, type } = parseName(trimmed.slice(1, -1))
      results.push(new Variable({ name, raw: trimmed, required: true, type }))
    } else if (trimmed.startsWith('[') && trimmed.endsWith('...]')) {
      const { name, type } = parseName(trimmed.slice(1, -4))
      results.push(new Variable({ array: true, name, raw: trimmed, type }))
    } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const { name, type } = parseName(trimmed.slice(1, -1))
      results.push(new Variable({ name, raw: trimmed, type }))
    } else {
      throw new Error(`Unrecognized variable description: ${trimmed}`)
    }
  }
  return results
}
