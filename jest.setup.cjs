/* eslint-disable no-console */
Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true, writable: true })

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in test:', reason)
})
