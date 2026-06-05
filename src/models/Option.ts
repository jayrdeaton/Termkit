import { Variable } from '@/models/Variable'
import { getVariables } from '@/utils/getVariables'

interface OptionData {
  short?: string | null
  long?: string | null
  info?: string | null
  variables?: string | null
}

export class Option {
  short: string | null = null
  long: string | null = null
  info: string | null = null
  variables: Variable[] | null = null

  constructor(data?: OptionData) {
    if (!data) return
    if (data.short) this.short = data.short
    if (data.long) this.long = data.long
    if (data.info) this.info = data.info
    if (data.variables) this.variables = getVariables(data.variables)
  }

  description(info: string): this {
    this.info = info
    return this
  }
}
