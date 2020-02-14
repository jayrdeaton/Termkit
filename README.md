# Termkit

A terminal input parsing kit

## Getting Started

This is how to get started using Termkit

### Installing

Add this package to your project

```
npm install --save termkit
```

### Using

Configure your command line program

```
let { command, option } = require('termkit');

let program = command('myApp')
  .version('1.0.0')
  .description('Here is my example layout')
  .options([
    option('a', 'array', '[arr...]', 'Array variable'),
    option('r', 'required', '<reqA> <reqB>', 'Required variable'),
    option('o', 'optional', '[opt]', 'Optional variable'),
    option('b', 'boolean', null, 'No variable')
  ])
  .action((err, options) => {
    if (err) return console.log(err);
    console.log(options);
    // Do some fancy stuff here
  })
  .commands([
    command('first')
    .description('My first example nested command')
    .options([
      // Same style options as before
    ])
    .action((err, options) => {
      if (err) return console.log(err);
      console.log(options);
      // Do some different fancy stuff here
    })
    .commands([
      // So on and so forth
    ])
  ])
```

Command objects nest, and can have variables themselves

```
command('example').commands([
  command('another', '[optional]'),
  command('another', '<required>'),
  command('another', '[array...]')
])
```

All errors, variables, and options are passed into your action function.

```
command('example', <var>)
  .option('r', 'require', <req>, 'Another example')
  .action((err, data) => {
    console.log(data.require)
  })
```

After your done constructing your CLI flow, parse the input

```
program.parse(process.argv);
```

Stay tuned for more

## Authors

* **Jay Deaton** - [Github](https://github.com/jayrdeaton)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
