import { stringLength } from './stringLength'

export function wrap(str: string, width: number): string {
  const words = str.split(' ')
  const lines: string[] = []
  let current = ''
  let currentLen = 0

  for (const word of words) {
    const wordLen = stringLength(word)
    if (currentLen === 0) {
      current = word
      currentLen = wordLen
    } else if (currentLen + 1 + wordLen <= width) {
      current += ' ' + word
      currentLen += 1 + wordLen
    } else {
      lines.push(current)
      current = word
      currentLen = wordLen
    }
  }

  if (current) lines.push(current)
  return lines.join('\n')
}
