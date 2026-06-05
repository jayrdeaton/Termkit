const ANSI_PATTERN = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g

export const stringLength = (string: string): number => {
  if (!string) return 0
  return string.replace(ANSI_PATTERN, '').length
}
