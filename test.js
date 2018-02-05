let term = require('./');

let program = term.program('Description', '[dir]')
  .version(process.env.npm_package_version)
  // .description()
  // .options([
  //   term.option(),
  //   term.option(),
  //   term.option()
  // ])
  .option('a', 'array', 'Option with array variable', '[arr...]')
  .option('r', 'required', 'Option with required variable', '<reqA> <reqB>')
  .option('o', 'optional', 'Option with optional variable', '[opt]')
  .option('b', 'boolean', 'Option with no variable')
  .action((err, options) => {
    if (err) {
      console.log('\u001b[31mError:\u001b[39m', err);
      return;
    };
    console.log('Program with options:', options);
  })
  .commands([
    term.command('one', 'Description of one', null)
    .option('a', 'array', 'Option with array variable', '[arr...]')
    .option('r', 'required', 'Option with required variable', '<req>')
    .option('o', 'optional', 'Option with optional variable', '[opt]')
    .option('b', 'boolean', 'Option with no variable')
    .action((err, options) => {
      if (err) {
        console.log('\u001b[31mError:\u001b[39m', err);
        return;
      };
      console.log('Command One with options:', options);
    }),
    term.command('two', 'Description of two', null)
    .option('a', 'array', 'Option with array variable', '[arr...]')
    .option('r', 'required', 'Option with required variable', '<req>')
    .option('o', 'optional', 'Option with optional variable', '[opt]')
    .option('b', 'boolean', 'Option with no variable')
    .action((err, options) => {
      if (err) {
        console.log('\u001b[31mError:\u001b[39m', err);
        return;
      };
      console.log('Command Two with options:', options);
    })
    .commands([
      term.command('three', 'Description of three', null)
      .option('a', 'array', 'Option with array variable', '[arr...]')
      .option('r', 'required', 'Option with required variable', '<req>')
      .option('o', 'optional', 'Option with optional variable', '[opt]')
      .option('b', 'boolean', 'Option with no variable')
      .action((err, options) => {
        if (err) {
          console.log('\u001b[31mError:\u001b[39m', err);
          return;
        };
        console.log('Function Three with options:', options);
      }),
      term.command('four', 'Description of four', null)
      .option('a', 'array', 'Option with array variable', '[arr...]')
      .option('r', 'required', 'Option with required variable', '<req>')
      .option('o', 'optional', 'Option with optional variable', '[opt]')
      .option('b', 'boolean', 'Option with no variable')
      .action((err, options) => {
        if (err) {
          console.log('\u001b[31mError:\u001b[39m', err);
          return;
        };
        console.log('Function Four with options:', options);
      })
    ])
  ]);
// let testA = '_ _ -a arr0 arr1 arr2 -r requiredA requiredB -o -b';
// let testB = '_ _ test -r requiredA requiredB one -r requiredC';
let testC = '_ _ test -a arr0 arr1 one -r requiredC';

// term.parse(testA.split(' '));
// term.parse(testB.split(' '));
term.parse(testC.split(' '));
