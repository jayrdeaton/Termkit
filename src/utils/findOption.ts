import type { Option } from '@/models/Option'

export function findOption(string: string, options: Option[]): Option | undefined {
  return options.find((o) => o.short === string || o.long === string)
}
