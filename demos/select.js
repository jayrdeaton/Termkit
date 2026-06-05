const { Select, Spinner } = require('../dist')

const F = Spinner.FRAMES

;(async () => {
  const select = new Select()

  // ─── basic pick ──────────────────────────────────────────────────────────
  console.log('— Basic pick —')
  const framework = await select.ask('Which framework?', [
    { label: 'React' },
    { label: 'Vue' },
    { label: 'Svelte' },
    { label: 'Solid' },
  ])
  console.log(framework ? `  Picked: ${framework.label}` : '  Skipped')
  console.log()

  // ─── with descriptions ───────────────────────────────────────────────────
  console.log('— With descriptions —')
  const env = await select.ask('Deploy target?', [
    { label: 'Production',  description: 'live traffic, locked deploys' },
    { label: 'Staging',     description: 'mirrors prod, QA sign-off required' },
    { label: 'Development', description: 'free-for-all, breaks often' },
  ])
  console.log(env ? `  Picked: ${env.label}` : '  Skipped')
  console.log()

  // ─── custom colors ───────────────────────────────────────────────────────
  console.log('— Custom colors (orange prompt / dim description) —')
  const custom = new Select({ promptColor: '#f97316', descriptionColor: '#6b7280', skipLabel: 'None of these' })
  const lang = await custom.ask('Preferred language?', [
    { label: 'TypeScript', description: 'types all the way down' },
    { label: 'Go',         description: 'fast, boring (compliment)' },
    { label: 'Rust',       description: 'if you enjoy fighting the borrow checker' },
    { label: 'Python',     description: 'for when speed is someone else\'s problem' },
  ])
  console.log(lang ? `  Picked: ${lang.label}` : '  None chosen')
  console.log()

  // ─── followed by a spinner ───────────────────────────────────────────────
  if (lang) {
    const spinner = new Spinner({ frames: F.braille, interval: 80, text: `Installing ${lang.label} toolchain…` })
    spinner.start()
    await new Promise(r => setTimeout(r, 2000))
    spinner.stop()
    spinner.succeed(`${lang.label} ready`)
  }
})()
