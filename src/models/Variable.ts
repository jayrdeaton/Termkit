import type { VariableType } from '@/types'

interface VariableData {
  array?: boolean
  name?: string
  raw?: string
  required?: boolean
  type?: VariableType
}

export class Variable {
  array = false
  name: string | null = null
  raw: string | null = null
  required = false
  type: VariableType = 'string'
  value: unknown[] | null = null

  constructor(data?: VariableData) {
    if (!data) return
    if (data.array) this.array = data.array
    if (data.name) this.name = data.name
    if (data.raw) this.raw = data.raw
    if (data.required) this.required = data.required
    if (data.type) this.type = data.type
    if (this.array) this.value = []
  }
}
