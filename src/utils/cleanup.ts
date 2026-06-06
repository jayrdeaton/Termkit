const fns = new Set<() => void>()
let installed = false

function install() {
  if (installed) return
  installed = true
  process.on('SIGINT', () => {
    flush()
    process.exit(130)
  })
  process.on('exit', flush)
}

function flush() {
  for (const fn of fns) {
    try {
      fn()
    } catch {}
  }
  fns.clear()
}

export function registerCleanup(fn: () => void): () => void {
  install()
  fns.add(fn)
  return () => {
    fns.delete(fn)
  }
}
