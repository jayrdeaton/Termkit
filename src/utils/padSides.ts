import { stringLength } from '@/utils/stringLength'

export const padSides = (string: string, padding: number): string => {
  let alt = false
  while (stringLength(string) < padding) {
    if (alt) { string = ` ${string}` } else { string += ' ' }
    alt = !alt
  }
  return string
}
