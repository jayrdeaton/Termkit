import { command, option } from '..'

type ActionResult = { options: Record<string, unknown> }

describe('value coercion', () => {
  it('coerces a number option variable', async () => {
    const program = command('app')
      .option('p', 'port', '<port:number>', 'Port number')
      .action((options) => ({ options }))

    const result = (await program.parse('_ _ --port 3000'.split(' '))) as ActionResult
    expect(result.options.port).toBe(3000)
    expect(typeof result.options.port).toBe('number')
  })

  it('coerces a boolean option variable', async () => {
    const program = command('app')
      .option('v', 'verbose', '[verbose:boolean]', 'Verbose mode')
      .action((options) => ({ options }))

    const result = (await program.parse('_ _ --verbose true'.split(' '))) as ActionResult
    expect(result.options.verbose).toBe(true)

    const result2 = (await program.parse('_ _ --verbose false'.split(' '))) as ActionResult
    expect(result2.options.verbose).toBe(false)
  })

  it('coerces an array of numbers', async () => {
    const program = command('app')
      .option('n', 'nums', '[nums:number...]', 'Number list')
      .action((options) => ({ options }))

    const result = (await program.parse('_ _ --nums 1 2 3'.split(' '))) as ActionResult
    expect(result.options.nums).toEqual([1, 2, 3])
  })

  it('leaves string variables uncoerced by default', async () => {
    const program = command('app')
      .option('n', 'name', '<name>', 'Name')
      .action((options) => ({ options }))

    const result = (await program.parse('_ _ --name hello'.split(' '))) as ActionResult
    expect(result.options.name).toBe('hello')
    expect(typeof result.options.name).toBe('string')
  })

  it('coerces a required positional variable', async () => {
    const program = command('app', '<count:number>').action((options) => ({ options }))

    const result = (await program.parse('_ _ 42'.split(' '))) as ActionResult
    expect(result.options.count).toBe(42)
  })
})
