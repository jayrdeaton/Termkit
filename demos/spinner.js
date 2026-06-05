const { Bar, Spinner } = require('../dist')

const C = Bar.COLORS
const F = Spinner.FRAMES

function at(ms, fn) { setTimeout(fn, ms) }

// ─── Spinner ───────────────────────────────────────────────────────────

const spinnerConfigs = [
  { label: 'braille — plain',             opts: { frames: F.braille } },
  { label: 'braille — rainbow',           opts: { frames: F.braille, colors: C.rainbow } },
  { label: 'braille — rainbow cycling',   opts: { frames: F.braille, colors: C.rainbow, colorCycle: 1.0 } },
  { label: 'braille — heat + shimmer',    opts: { frames: F.braille, colors: C.heat, shimmer: 0.9 } },
  { label: 'dots — rainbow cycling',      opts: { frames: F.dots, colors: C.rainbow, colorCycle: 0.5 } },
  { label: 'line — plain',                opts: { frames: F.line } },
  { label: 'line — blue → red',           opts: { frames: F.line, colors: C.blueRed } },
  { label: 'arrow — rainbow + shimmer',   opts: { frames: F.arrow, colors: C.rainbow, colorCycle: 0.8, shimmer: 0.5 } },
  { label: 'bounce — sunset cycling',     opts: { frames: F.bounce, colors: C.sunset, colorCycle: 2.0 } },
]

const SPINNER_EACH = 3000

console.log('— Spinner —')

const spinner = new Spinner({ interval: 80 })

spinnerConfigs.forEach(({ label, opts }, i) => {
  at(i * SPINNER_EACH, () => {
    spinner.frames     = opts.frames     ?? F.braille
    spinner.colors     = opts.colors     ?? []
    spinner.colorCycle = opts.colorCycle ?? 0
    spinner.shimmer    = opts.shimmer    ?? 0
    spinner.text       = label
    if (i === 0) spinner.start()
  })
})

const TOTAL = spinnerConfigs.length * SPINNER_EACH

at(TOTAL, () => spinner.stop())

// ─── Status methods ────────────────────────────────────────────────────

const STATUS_START = TOTAL + 1000

at(STATUS_START - 500, () => { console.log(); console.log('— Status methods —') })

const statusExamples = [
  { method: 'succeed', message: 'Build complete' },
  { method: 'fail',    message: 'Connection refused' },
  { method: 'warn',    message: 'Rate limited, retrying' },
  { method: 'info',    message: 'Listening on port 3000' },
]

const statusSpinner = new Spinner({ frames: F.braille, interval: 80, text: 'Working...' })

at(STATUS_START, () => {
  const all = [
    ...statusExamples,
    { method: 'succeed', message: 'Custom color (purple)', spinner: new Spinner({ frames: F.braille, interval: 80, text: 'Working...', successColor: '#a855f7' }) },
  ]
  let i = 0
  function next() {
    if (i >= all.length) { process.stdout.write('\n'); return }
    const { method, message, spinner = statusSpinner } = all[i++]
    spinner.text = 'Working...'
    spinner.start()
    setTimeout(() => { spinner.stop(); spinner[method](message); next() }, 1200)
  }
  next()
})
