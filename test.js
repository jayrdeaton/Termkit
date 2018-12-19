let { command, middleware, option} = require('./');

let program = command('appName')
  .version(process.env.npm_package_version)
  .description('Program description', 'This is some super extensive detail about this command')
  .variable('[dir]')
  .middlewares([
    middleware((options) => console.log('here', options))
  ])
  .options([
    option('a', 'array', '[arr...]', 'Option with array variable'),
    option('r', 'required', '<reqA> <reqB>', 'Option with required variable'),
    option('o', 'optional', '[opt]', 'Option with optional variable'),
    option('b', 'boolean', null, 'Option with no variable')
  ])
  .action((options) => {
    let source = options._source;
    options._source = source.join(' ');
    // console.log('Program with options: \n', options, '\n');
  })
  .middlewares([

  ])
  .commands([
    command('one', '[reqA] [reqB]', 'Description of one')
    .option('a', 'array', '[arr...]', 'Option with array variable')
    .option('r', 'required', '<req>', 'Option with required variable')
    .option('o', 'optional', '[opt]', 'Option with optional variable')
    .option('b', 'boolean', null, 'Option with no variable')
    .action((options) => {
      let source = options._source;
      options._source = source.join(' ');
      // console.log('Command One with options: \n', options, '\n');
    }),
    command('two', '<req>', 'Description of two')
    .option('a', 'array', '[arr...]', 'Option with array variable')
    .option('r', 'required', '<req>', 'Option with required variable')
    .option('o', 'optional', '[opt]', 'Option with optional variable')
    .option('b', 'boolean', null, 'Option with no variable')
    .action((options) => {
      let source = options._source;
      options._source = source.join(' ');
      // console.log('Command Two with options: \n', options, '\n');
    })
    .commands([
      command('three', null, 'Description of three')
      .option('a', 'array', '[arr...]', 'Option with array variable')
      .option('r', 'required', '<req>', 'Option with required variable')
      .option('o', 'optional', '[opt]', 'Option with optional variable')
      .option('b', 'boolean', null, 'Option with no variable')
      .action((options) => {
        let source = options._source;
        options._source = source.join(' ');
        // console.log('Command Three with options: \n', options, '\n');
      })
      .commands([
        command('help')
        .action((options) => {
          // console.log('custom usage printout')
        })
      ]),
      command('four', '[optA] [optB]', 'Description of four')
      .option('a', 'array', '[arr...]', 'Option with array variable')
      .option(null, 'required', '<req>', 'Option with required variable')
      .option('o', null, '[opt]', 'Option with optional variable')
      .option('b', 'boolean', null, 'Option with no variable')
      .action((options) => {
        let source = options._source;
        options._source = source.join(' ');
        // console.log('Command Four with options: \n', options, '\n');
      })
    ])
  ]);

program.parse('_ _ --array arr0 arr1 arr2 --required req1 req2 --optional test --boolean'.split(' '));
program.parse('_ _ -a arr0 arr1 arr2 -r req1 req2 -o -b'.split(' '));
program.parse('_ _ one testA testB'.split(' '));
program.parse('_ _ test -r requiredA requiredB one -r requiredC'.split(' '));
program.parse('_ _ test -a arr0 arr1 one -br required'.split(' '));
program.parse('_ _ -r reqA reqB'.split(' '));
program.parse('_ _ dir -r reqA reqB -a arr1 arr2 arr3 -o optional one fail'.split(' '));
program.parse('_ _ two four -a arr0 arr1 arr2 -r required -ob'.split(' '));
program.parse('_ _ shortcut'.split(' '));
// program.parse('_ _ help'.split(' '));
// program.parse('_ _ two three help'.split(' '));
// program.parse('_ _ two help'.split(' '));
// program.parse('_ _ two four help'.split(' '));
program.parse('_ _ two required four optionalA optionalB'.split(' '));
program.parse('_ _ two required four optionalA'.split(' '));
