# TermKit

A fluent CLI framework for Node.js with nested subcommands, middleware, and TypeScript support.

## Installation

```bash
npm install termkit
```

## Usage

### Basic program

```ts
import { command, option, parse } from 'termkit'

const program = command('my-app')
  .version('1.0.0')
  .description('My CLI application')
  .option('v', 'verbose', null, 'Enable verbose output')
  .option('o', 'output', '<file>', 'Output file path')
  .action((options) => {
    console.log(options.output)
  })

try {
  program.parse(process.argv)
} catch (err) {
  console.error(err)
}
```

### Options

Options support four variable shapes:

```ts
command('app')
  .option('b', 'boolean', null,        'Flag with no value')
  .option('o', 'optional', '[val]',    'Optional value')
  .option('r', 'required', '<val>',    'Required value')
  .option('a', 'array',    '[val...]', 'Array of values')
```

Accessible in actions and middleware via the long name:

```ts
.action((options) => {
  options.boolean  // true | undefined
  options.optional // string | true
  options.required // string
  options.array    // string[]
})
```

### Value coercion

Append `:number` or `:boolean` to a variable to coerce the parsed string:

```ts
command('app')
  .option('p', 'port',    '<port:number>',     'Port number')
  .option('v', 'verbose', '[verbose:boolean]', 'Verbose mode')
  .option('n', 'nums',    '[nums:number...]',  'List of numbers')
  .action((options) => {
    options.port    // number
    options.verbose // boolean
    options.nums    // number[]
  })
```

### Subcommands

Commands nest to any depth. Each level can have its own options and middleware.

```ts
import { command, option } from 'termkit'

command('app')
  .commands([
    command('serve')
      .option('p', 'port', '<port:number>', 'Port to listen on')
      .action((options) => startServer(options.port)),

    command('build')
      .option('w', 'watch', null, 'Watch for changes')
      .action((options) => runBuild(options)),
  ])
```

Commands can also carry their own positional variables:

```ts
command('get', '<id>')        // required
command('list', '[filter]')   // optional
command('tag', '[tags...]')   // array
```

### Middleware

Middleware runs before the action. It can mutate the options object and supports async.

```ts
command('app')
  .middleware(async (options) => {
    options.user = await getUser(options.token)
  })
  .action((options) => {
    console.log(options.user)
  })
```

Use `.middlewares([...])` to register several at once. When navigating into a subcommand, parent middleware runs first.

### Default middleware and options

Apply middleware or options to every command created after the call:

```ts
import { setDefaults } from 'termkit'

setDefaults({
  middlewares: [
    async (options) => { options.timestamp = Date.now() }
  ]
})
```

### Built-in help

Passing `help` anywhere in argv prints a formatted usage table and stops execution:

```bash
my-app help
my-app serve help
```

## API

### Functions

| Function | Signature | Description |
|---|---|---|
| `command` | `(name, variables?, info?) => Command` | Create a command |
| `option` | `(short, long, variables, info) => Option` | Create an option |
| `middleware` | `(fn) => fn` | Identity helper for typing middleware inline |
| `parse` | `(argv) => Promise<unknown>` | Parse using the root command |
| `setDefaults` | `(defaults) => void` | Set defaults applied to all new commands |

### Classes

`Command`, `Option`, `Variable`, `TermKit`

### Types

`ActionFn`, `MiddlewareFn`, `ParsedOptions`, `CommandDefaults`, `VariableType`

## Authors

**Jay Deaton** — [GitHub](https://github.com/jayrdeaton)

## License

MIT
