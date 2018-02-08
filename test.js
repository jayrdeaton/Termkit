let term = require('./');

let program = term.command('appName')
  .version(process.env.npm_package_version)
  .description('Program description', 'This is some super extensive detail about this command')
  .variable('[dir]')
  .options([
    term.option('a', 'array', '[arr...]', 'Option with array variable'),
    term.option('r', 'required', '<reqA> <reqB>', 'Option with required variable'),
    term.option('o', 'optional', '[opt]', 'Option with optional variable'),
    term.option('b', 'boolean', null, 'Option with no variable')
  ])
  .action((err, options) => {
    if (err) return console.log(`\u001b[31m${err.name}:\u001b[39m ${err.message}`);
    let source = options._source;
    options._source = source.join(' ');
    console.log('Program with options: \n', options, '\n');
  })
  .commands([
    term.command('one', '[reqA] [reqB]', 'Description of one')
    .option('a', 'array', '[arr...]', 'Option with array variable')
    .option('r', 'required', '<req>', 'Option with required variable')
    .option('o', 'optional', '[opt]', 'Option with optional variable')
    .option('b', 'boolean', null, 'Option with no variable')
    .action((err, options) => {
      if (err) return console.log(`\u001b[31m${err.name}:\u001b[39m ${err.message}`);
      let source = options._source;
      options._source = source.join(' ');
      console.log('Command One with options: \n', options, '\n');
    }),
    term.command('two', '<req>', 'Description of two')
    .option('a', 'array', '[arr...]', 'Option with array variable')
    .option('r', 'required', '<req>', 'Option with required variable')
    .option('o', 'optional', '[opt]', 'Option with optional variable')
    .option('b', 'boolean', null, 'Option with no variable')
    .action((err, options) => {
      if (err) return console.log(`\u001b[31m${err.name}:\u001b[39m ${err.message}`);
      let source = options._source;
      options._source = source.join(' ');
      console.log('Command Two with options: \n', options, '\n');
    })
    .commands([
      term.command('three', null, 'Description of three')
      .option('a', 'array', '[arr...]', 'Option with array variable')
      .option('r', 'required', '<req>', 'Option with required variable')
      .option('o', 'optional', '[opt]', 'Option with optional variable')
      .option('b', 'boolean', null, 'Option with no variable')
      .action((err, options) => {
        if (err) return console.log(`\u001b[31m${err.name}:\u001b[39m ${err.message}`);
        let source = options._source;
        options._source = source.join(' ');
        console.log('Command Three with options: \n', options, '\n');
      })
      .commands([
        term.command('help')
        .action((err, options) => {
          if (err) return console.log(`\u001b[31m${err.name}:\u001b[39m ${err.message}`);
          console.log('custom usage printout')
        })
      ]),
      term.command('four', '[optA] [optB]', 'Description of four')
      .option('a', 'array', '[arr...]', 'Option with array variable')
      .option('r', 'required', '<req>', 'Option with required variable')
      .option('o', 'optional', '[opt]', 'Option with optional variable')
      .option('b', 'boolean', null, 'Option with no variable')
      .action((err, options) => {
        if (err) return console.log(`\u001b[31m${err.name}:\u001b[39m ${err.message}`);
        let source = options._source;
        options._source = source.join(' ');
        console.log('Command Four with options: \n', options, '\n');
      })
    ])
  ]);

term.parse('_ _ --array arr0 arr1 arr2 --required req1 req2 --optional test --boolean'.split(' '));
term.parse('_ _ -a arr0 arr1 arr2 -r req1 req2 -o -b'.split(' '));
term.parse('_ _ test -r requiredA requiredB one -r requiredC'.split(' '));
term.parse('_ _ test -a arr0 arr1 one -br required'.split(' '));
term.parse('_ _ -r reqA reqB'.split(' '));
term.parse('_ _ dir -r reqA reqB -a arr1 arr2 arr3 -o optional one fail'.split(' '));
term.parse('_ _ two four -a arr0 arr1 arr2 -r required -ob'.split(' '));
term.parse('_ _ shortcut'.split(' '));
term.parse('_ _ help'.split(' '));
term.parse('_ _ two three help'.split(' '));
term.parse('_ _ two help'.split(' '));
term.parse('_ _ two four help'.split(' '));
term.parse('_ _ two required four optionalA optionalB'.split(' '));
term.parse('_ _ two required four optionalA'.split(' '));
