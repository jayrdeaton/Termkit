import { stringLength } from '@/utils/stringLength'

export const padLeft = (string: string, padding: number): string => {
  while (stringLength(string) < padding) string = ` ${string}`
  return string
}
