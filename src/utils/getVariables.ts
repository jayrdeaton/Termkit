import { Variable } from '@/models/Variable'
import type { VariableType } from '@/types'

function parseName(raw: string): { name: string; type: VariableType; enum?: string[]; default?: string; min?: number; max?: number } {
  const colon = raw.indexOf(':')
  if (colon === -1) return { name: raw, type: 'string' }
  const name = raw.slice(0, colon)
  const rest = raw.slice(colon + 1)

  const eqIdx = rest.lastIndexOf('=')
  const typeStr = eqIdx !== -1 ? rest.slice(0, eqIdx) : rest
  const defaultValue = eqIdx !== -1 ? rest.slice(eqIdx + 1) : undefined

  const rangeMatch = typeStr.match(/^([a-z]+)\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)$/)
  if (rangeMatch) {
    return { name, type: rangeMatch[1] as VariableType, min: Number(rangeMatch[2]), max: Number(rangeMatch[3]), default: defaultValue }
  }

  if (typeStr.includes('|')) {
    return { name, type: 'enum', enum: typeStr.split('|'), default: defaultValue }
  }
  return { name, type: typeStr as VariableType, default: defaultValue }
}

export function getVariables(string: string): Variable[] {
  const results: Variable[] = []
  for (const part of string.split(' ')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      const { name, type, enum: enumValues, default: def, min, max } = parseName(trimmed.slice(1, -1))
      results.push(new Variable({ default: def, enum: enumValues, max, min, name, raw: trimmed, required: true, type }))
    } else if (trimmed.startsWith('[') && trimmed.endsWith('...]')) {
      const { name, type, enum: enumValues, default: def, min, max } = parseName(trimmed.slice(1, -4))
      results.push(new Variable({ array: true, default: def, enum: enumValues, max, min, name, raw: trimmed, type }))
    } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const { name, type, enum: enumValues, default: def, min, max } = parseName(trimmed.slice(1, -1))
      results.push(new Variable({ default: def, enum: enumValues, max, min, name, raw: trimmed, type }))
    } else {
      throw new Error(`Unrecognized variable description: ${trimmed}`)
    }
  }
  return results
}
