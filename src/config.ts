export type HelpColor = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | number | `#${string}`

const isLegacyTerminal = process.env.TERM === 'dumb' || (process.platform === 'win32' && !process.env.WT_SESSION && process.env.TERM_PROGRAM !== 'vscode' && process.env.TERM_PROGRAM !== 'Hyper')

interface TermKitConfig {
  color: HelpColor
  glyphs: boolean
  interactive: boolean
}

export const config: TermKitConfig = {
  color: 'cyan',
  glyphs: !isLegacyTerminal,
  interactive: false
}

export function configure(opts: Partial<TermKitConfig>): void {
  if (opts.color) config.color = opts.color
  if (opts.glyphs !== undefined) config.glyphs = opts.glyphs
  if (opts.interactive !== undefined) config.interactive = opts.interactive
}
