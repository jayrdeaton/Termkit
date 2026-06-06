import { stringLength } from '@/utils/stringLength'

export const padRight = (string: string, padding: number): string => {
  while (stringLength(string) < padding) string += ' '
  return string
}
