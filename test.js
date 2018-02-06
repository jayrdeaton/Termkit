let term = require('./');

let program = term.command('appName')
  .version(process.env.npm_package_version)
  .description('Program description')
  .variable('[dir]')
  .options([
    term.option('a', 'array', '[arr...]', 'Option with array variable'),
    term.option('r', 'required', '<reqA> <reqB>', 'Option with required variable'),
    term.option('o', 'optional', '[opt]', 'Option with optional variable'),
    term.option('b', 'boolean', null, 'Option with no variable')
  ])
  .action((err, options) => {
    if (err) {
      console.log('\u001b[31mError:\u001b[39m', err);
      return;
    };
    let source = options._source;
    options._source = source.join(' ');
    console.log('Program with options: \n', options, '\n');
  })
  .commands([
    term.command('one', '<req>', 'Description of one')
    .option('a', 'array', '[arr...]', 'Option with array variable')
    .option('r', 'required', '<req>', 'Option with required variable')
    .option('o', 'optional', '[opt]', 'Option with optional variable')
    .option('b', 'boolean', null, 'Option with no variable')
    .action((err, options) => {
      if (err) {
        console.log('\u001b[31mError:\u001b[39m', err);
        return;
      };
      let source = options._source;
      options._source = source.join(' ');
      console.log('Command One with options: \n', options, '\n');
    }),
    term.command('two', null, 'Description of two')
    .option('a', 'array', '[arr...]', 'Option with array variable')
    .option('r', 'required', '<req>', 'Option with required variable')
    .option('o', 'optional', '[opt]', 'Option with optional variable')
    .option('b', 'boolean', null, 'Option with no variable')
    .action((err, options) => {
      if (err) {
        console.log('\u001b[31mError:\u001b[39m', err);
        return;
      };
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
        if (err) {
          console.log('\u001b[31mError:\u001b[39m', err);
          return;
        };
        let source = options._source;
        options._source = source.join(' ');
        console.log('Command Three with options: \n', options, '\n');
      }),
      term.command('four', null, 'Description of four')
      .option('a', 'array', '[arr...]', 'Option with array variable')
      .option('r', 'required', '<req>', 'Option with required variable')
      .option('o', 'optional', '[opt]', 'Option with optional variable')
      .option('b', 'boolean', null, 'Option with no variable')
      .action((err, options) => {
        if (err) {
          console.log('\u001b[31mError:\u001b[39m', err);
          return;
        };
        let source = options._source;
        options._source = source.join(' ');
        console.log('Command Four with options: \n', options, '\n');
      })
    ])
  ]);
// let testA = '_ _ -a arr0 arr1 arr2 -r requiredA requiredB -o -b';
// let testB = '_ _ test -r requiredA requiredB one -r requiredC';
// let testC = '_ _ test -a arr0 arr1 one -r required';
// let testD = '_ _ -r reqA reqB';
// let testE = '_ _ dir -r reqA reqB -a arr1 arr2 arr3 -o optional one required';
// let testF = '_ _ two four -a arr0 arr1 arr2 -r required -ob'
// let testG = '_ _ shortcut'
let testH = '_ _ help'

// term.parse(testA.split(' '));
// term.parse(testB.split(' '));
// term.parse(testC.split(' '));
// term.parse(testD.split(' '));
// term.parse(testE.split(' '));
// term.parse(testF.split(' '));
// term.parse(testG.split(' '));
term.parse(testH.split(' '));
