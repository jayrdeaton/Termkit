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

### Input

Interactive text prompt. Supports string, number, integer, boolean, and enum types with validation.

```ts
import { input, confirm } from 'termkit'

const name = await input('Project name?', { default: 'my-app', minLength: 2, maxLength: 20 })
const port = await input('Port?', { type: 'number', default: 3000, min: 1024, max: 65535 })
const env  = await input('Environment?', { type: 'enum', enum: ['dev', 'staging', 'prod'] })
```

Use `confirm` as a shorthand for boolean prompts:

```ts
const deploy = await confirm('Deploy to production?', { default: false })
```

The text cursor supports left/right arrows, Home/End, Ctrl+A/E, and forward Delete for mid-string editing.

Options: `type`, `default`, `placeholder`, `mask`, `inline`, `required`, `min`, `max`, `minLength`, `maxLength`, `enum`, `match`, `regex`, `errorMessage`, `promptColor`, `promptGlyph`, `inputColor`, `errorColor`.

### Select

Single-item interactive picker. Navigate with ↑↓ or number keys, confirm with Enter.

```ts
import { select } from 'termkit'

const env = await select('Deploy target?', [
  { label: 'Production',  description: 'live traffic' },
  { label: 'Staging',     description: 'QA sign-off required' },
  { label: 'Development', description: 'free-for-all' },
])
```

Pass `search: true` to add a type-to-filter input. Typing narrows the list; Backspace removes the last character. Number shortcuts are disabled in search mode — use ↑↓.

```ts
const pkg = await select('Pick a package:', packages, { search: true })
```

Pass `maxHeight` to cap the visible rows and enable scrolling. The viewport follows the cursor automatically.

```ts
const tz = await select('Timezone?', timezones, { maxHeight: 8 })
```

Both options compose freely:

```ts
const country = await select('Country?', countries, { search: true, maxHeight: 6 })
```

Options: `colors`, `colorCycle`, `shimmer`, `skipLabel`, `promptColor`, `promptGlyph`, `descriptionColor`, `selectedPrefix`, `selectedSuffix`, `interval`, `search`, `maxHeight`.

### MultiSelect

Multi-item interactive picker. Returns an array of the selected items.

```ts
import { multiSelect } from 'termkit'

const features = await multiSelect('Enable features?', [
  { label: 'Authentication' },
  { label: 'Rate limiting' },
  { label: 'Caching',     description: 'Redis-backed' },
  { label: 'Webhooks' },
])
```

Keyboard controls: ↑↓ navigate · Space/Tab toggle · → select · ← deselect · `a` select all · Enter confirm.

Enforce selection counts with `min` and `max`:

```ts
const roles = await multiSelect('Assign roles:', items, { min: 1, max: 3 })
```

Pass `search: true` to add a type-to-filter input. All printable characters go to the query; `a` select-all is disabled in search mode. Checked items are tracked by their position in the original list so toggling survives filtering.

```ts
const pkgs = await multiSelect('Add dependencies:', packages, { search: true })
```

Pass `maxHeight` to cap the visible rows with auto-scrolling:

```ts
const regions = await multiSelect('Deploy to:', regions, { maxHeight: 6 })
```

Options: `min`, `max`, `allowSkip`, `colors`, `colorCycle`, `shimmer`, `checkedPrefix`, `uncheckedPrefix`, `promptColor`, `promptGlyph`, `descriptionColor`, `errorColor`, `interval`, `search`, `maxHeight`.

### Log

`log` is a singleton logger. `Log` is the class for custom instances.

```ts
import { log } from 'termkit'

log.succeed('Build complete')
log.fail('Connection refused')
log.warn('Rate limited, retrying')
log.info('Listening on port 3000')
log.data({ user: 'alice', role: 'admin', active: true })
```

Custom instance with colors:

```ts
import { Log } from 'termkit'

const logger = new Log({ successColor: '#a855f7', failColor: '#ef4444' })
logger.succeed('Custom color')
```

### markup

Pretty-prints any value with syntax coloring — strings, numbers, booleans, `null`, `Date`, nested objects, and arrays.

```ts
import { markup } from 'termkit'

console.log(markup({ name: 'alice', roles: ['admin', 'editor'], active: true }))
```

Custom styles and value translations:

```ts
import { markup, Color } from 'termkit'

const out = markup(data, {
  styles: {
    number:  (v) => Color.hex('#f97316')(v),
    boolean: (v) => Color.hex('#a855f7')(v),
  },
  translations: {
    createdAt: (v) => new Date(v as string),
  },
})
console.log(out)
```

### Table

Renders tabular data with auto-sized columns, optional titles, alignment, and meta rows.

```ts
import { Table } from 'termkit'

const rows = [
  { name: 'Alice', role: 'admin',  active: true },
  { name: 'Bob',   role: 'editor', active: false },
]

new Table(rows).print()
```

Column configuration — pass a `columns` array to control ordering, titles, alignment, and value formatting:

```ts
new Table(rows, {
  title: 'Users',
  columns: [
    { key: 'name',   title: 'Name' },
    { key: 'role',   title: 'Role', align: 'center' },
    { key: 'active', title: 'Active', value: (v) => (v ? 'yes' : 'no'), align: 'right' },
  ],
  separator: '  ',
}).print()
```

Global alignment, margin, and meta rows (rendered below a separator after the data rows):

```ts
new Table(rows, {
  align: Table.center,   // Table.left | Table.center | Table.right
  margin: 1,             // extra space added to each column's padding
  meta: [{ name: 'Total', role: '', active: '' }],
}).print()
```

Passing a string shorthand instead of a `ColumnOptions` object uses the key as both key and title:

```ts
new Table(rows, { columns: ['name', 'role'] }).print()
```

### Chart

The `Chart` namespace provides horizontal bar, vertical column, heatmap, and scatter visualizations. Every chart class has a `.print()` method that writes to stdout and a `.toString()` method that returns the rendered string.

All chart constructors accept optional `paddingX` and `paddingY` options to add whitespace around the output.

#### Chart.Bar

Horizontal bar chart. Each item maps a label to a value; the bar width scales to fill the terminal.

```ts
import { Chart } from 'termkit'

new Chart.Bar([
  { key: 'Mon', value: 42 },
  { key: 'Tue', value: 67 },
  { key: 'Wed', value: 31 },
]).print()
```

Custom style and `null` gaps (blank rows):

```ts
import { Chart, Color } from 'termkit'

new Chart.Bar([
  { key: 'Errors',   value: 12, style: Color.red },
  { key: 'Warnings', value: 45, style: Color.yellow },
  null,
  { key: 'OK',       value: 89, style: Color.green },
]).print()
```

Pass `character` to use a custom fill character instead of a solid block:

```ts
new Chart.Bar([
  { key: 'CPU', value: 72, character: '▪' },
  { key: 'RAM', value: 55, character: '▪' },
]).print()
```

Pass `width` to override the terminal column width used for scaling:

```ts
new Chart.Bar(data, { width: 60, paddingX: 2, paddingY: 1 }).print()
```

#### Chart.Column

Vertical column chart using Unicode block characters with fractional height resolution.

```ts
new Chart.Column([
  { key: 'M', value: 10 },
  { key: 'T', value: 25 },
  { key: 'W', value: 18 },
  { key: 'T', value: 30 },
  { key: 'F', value: 22 },
], { height: 8, colWidth: 3 }).print()
```

Pass `null` items to insert gaps between column groups:

```ts
new Chart.Column([
  { key: 'A', value: 15, style: Color.blue },
  { key: 'B', value: 28, style: Color.blue },
  null,
  { key: 'C', value: 10, style: Color.magenta },
], { height: 10 }).print()
```

Pass `width` to have `colWidth` auto-calculated to fill a fixed total width:

```ts
new Chart.Column(data, { width: 40, height: 12 }).print()
```

#### Chart.Heatmap

2-D grid colored by value intensity between a configurable low and high color.

```ts
new Chart.Heatmap(
  [
    [1, 5, 9, 3],
    [2, 6, 3, 8],
    [8, 4, 7, 2],
  ],
  {
    rowLabels: ['Row A', 'Row B', 'Row C'],
    colLabels: ['C1', 'C2', 'C3', 'C4'],
    colors: ['#0000ff', '#ff0000'],
  }
).print()
```

Multi-stop color scale and explicit range:

```ts
new Chart.Heatmap(data, {
  colors: ['#0000ff', '#00ffff', '#ffff00', '#ff0000'],
  min: 0,
  max: 100,
  cellWidth: 3,
}).print()
```

#### Chart.Scatter

2-D scatter plot with optional labeled axes. Points outside the plot bounds are silently clipped.

```ts
new Chart.Scatter([
  { x: 1, y: 2 },
  { x: 3, y: 5 },
  { x: 7, y: 3 },
]).print()
```

Custom characters, per-point styles, and explicit axis bounds:

```ts
import { Chart, Color } from 'termkit'

new Chart.Scatter([
  { x: 10, y: 20, character: '●', style: Color.green },
  { x: 30, y: 50, character: '●', style: Color.red },
], {
  width: 60,
  height: 20,
  xMin: 0,
  xMax: 40,
  yMin: 0,
  yMax: 60,
}).print()
```

Disable axes for a raw grid output:

```ts
new Chart.Scatter(data, { axes: false }).print()
```

#### Chart.Line

Line chart that interpolates between data points. Accepts the same axis options as `Chart.Scatter`.

```ts
import { Chart } from 'termkit'

new Chart.Line(
  Array.from({ length: 40 }, (_, i) => ({ x: i, y: Math.sin(i * 0.3) * 4 })),
  { height: 12 }
).print()
```

Per-point styles and optional fill below the line:

```ts
import { Chart, Color } from 'termkit'

new Chart.Line(data, { fill: true, style: (s) => Color.cyan(s) }).print()
```

Options: `width`, `height`, `xMin`, `xMax`, `yMin`, `yMax`, `character`, `axes`, `fill`, `paddingX`, `paddingY`.

#### Chart.Sparkline

Returns a single-line sparkline string using Unicode block characters. Useful for inline metrics.

```ts
import { Chart, Color } from 'termkit'

const samples = [12, 45, 23, 67, 89, 55, 34, 78, 61]
console.log('CPU  ' + Chart.Sparkline(samples, { style: (s) => Color.green(s) }))
// CPU  ▁▃▁▅█▄▂▆▄
```

Options: `min`, `max`, `style`.

### Bar — ETA and rate tracking

Attach progress tracking to an animated `Bar` with `.track()` and `.tick()`.

```ts
import { Bar } from 'termkit'

const total = 500
const bar = new Bar({ progress: 0 })
bar.track(total, { showRate: true, showEta: true, unit: 'files' })
bar.message('Processing…')
bar.start()

for await (const item of items) {
  await process(item)
  bar.tick()
}

bar.stop()
bar.succeed(`Done — ${total} files processed`)
```

Each `tick(n?)` increments the completed count, updates `progress`, and appends a live `12.3/s · ETA 8s` suffix that shrinks the bar to keep the full line within terminal width.

Raw values are available as getters at any time:

```ts
bar.rate  // units per second (number)
bar.eta   // estimated seconds remaining (number)
```

Options on `track(total, opts?)`: `unit` (label appended to rate), `showRate` (default `true`), `showEta` (default `true`). Both can also be set via constructor: `new Bar({ showRate: true, showEta: true, rateUnit: 'MB' })`.

### MultiBar

Renders multiple `Bar` instances as a synchronized block. Each bar animates independently; calling `.succeed()`, `.fail()`, `.warn()`, or `.info()` on a bar freezes that line while the others keep running. The group stops automatically when every bar is finalized.

```ts
import { MultiBar, Bar } from 'termkit'

const multi = new MultiBar()
const download = multi.add({ text: 'Downloading', progress: 0, colors: Bar.COLORS.cool })
const build    = multi.add({ text: 'Building',    progress: 0, colors: Bar.COLORS.heat })
const deploy   = multi.add({ text: 'Deploying' })  // indeterminate until started

multi.start()

await runDownload(p => { download.progress = p })
download.succeed('Downloaded')

await runBuild(p => { build.progress = p })
build.succeed('Built')

deploy.progress = 0
await runDeploy(p => { deploy.progress = p })
deploy.succeed('Deployed')

multi.stop()
```

Each `add()` call accepts the same options as `Bar` and returns a `Bar` instance — `.message()`, `.tick()`, `.track()`, `.progress`, and the completion methods all work the same way. Bars must be added before `.start()`.

Options: `interval`.

### truncate

ANSI-aware string truncation. Measures visible length ignoring escape codes, and appends a configurable suffix.

```ts
import { truncate } from 'termkit'

truncate('The quick brown fox jumps over the lazy dog', 20)
// 'The quick brown fox…'

truncate(coloredString, 40, ' [more]')
```

### wrap

ANSI-aware word wrap. Breaks at spaces to keep each line within a given column width.

```ts
import { wrap } from 'termkit'

console.log(wrap(longParagraph, 60))
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
| `configure` | `(opts) => void` | Set global display options (color, glyphs) |
| `markup` | `(data, options?) => string` | Pretty-print a value with syntax coloring |
| `input` | `(prompt, options?) => Promise<string \| number \| boolean \| null>` | Interactive text prompt |
| `confirm` | `(prompt, options?) => Promise<boolean \| null>` | Boolean yes/no prompt |
| `select` | `(prompt, items, options?) => Promise<T \| null>` | Single-item interactive picker |
| `multiSelect` | `(prompt, items, options?) => Promise<T[] \| null>` | Multi-item interactive picker |
| `Chart.Sparkline` | `(data, options?) => string` | Single-line sparkline string |
| `truncate` | `(s, maxLength, suffix?) => string` | ANSI-aware string truncation |
| `wrap` | `(s, width) => string` | ANSI-aware word wrap |
| `padLeft` | `(s, width) => string` | Right-align a string within a fixed width |
| `padRight` | `(s, width) => string` | Left-align a string within a fixed width |
| `padSides` | `(s, width) => string` | Center a string within a fixed width |
| `stringLength` | `(s) => number` | Visual length of a string, stripping ANSI escape codes |

### Classes

`Command`, `Option`, `Variable`, `TermKit`, `Bar`, `MultiBar`, `Spinner`, `Input`, `Select`, `MultiSelect`, `Log`, `Table`, `Column`, `Chart.Bar`, `Chart.VerticalBar`, `Chart.Heatmap`, `Chart.Scatter`, `Chart.Line`

### Types

`ActionFn`, `MiddlewareFn`, `ParsedOptions`, `CommandDefaults`, `VariableType`, `BarMode`, `BarOptions`, `MultiBarOptions`, `SpinnerOptions`, `InputOptions`, `InputReturn`, `InputType`, `SelectItem`, `SelectOptions`, `MultiSelectItem`, `MultiSelectOptions`, `LogOptions`, `TableOptions`, `ColumnOptions`, `ColumnAlign`, `MarkupOptions`, `MarkupStyleFn`, `MarkupStyles`, `HelpColor`, `Chart.BarItem`, `Chart.BarOptions`, `Chart.VerticalBarItem`, `Chart.VerticalBarOptions`, `Chart.HeatmapOptions`, `Chart.ScatterPoint`, `Chart.ScatterOptions`, `Chart.LinePoint`, `Chart.LineOptions`, `Chart.SparklineOptions`

## Authors

**Jay Deaton** — [GitHub](https://github.com/jayrdeaton)

## License

MIT
