const { is, isnt } = require('amprisand'),
  { command, option} = require('../../');

let program, output;

describe('middleware', () => {
  describe('program = command()', () => {
    it('should create a program with middleware', () => {
      program = command('app')
        .version('0.0.0')
        .middleware((options) => output.push('middleware'))
        .action((options) => output.push('action'))
        .commands([
          command('nested')
          .middleware((options) => output.push('nested middleware'))
          .action((options) => output.push('nested action'))
        ]);
    });
  });
  describe('program.parse()', () => {
    it('middleware should be called before action', async () => {
      output = [];
      await program.parse('_ _'.split(' '));
      output.is(['middleware', 'action']);
    });
  });
  describe('program.parse()', () => {
    it('parent middleware should be called first', async () => {
      output = [];
      await program.parse('_ _ nested'.split(' '));
      output.is(['middleware', 'nested middleware', 'nested action']);
    });
  });
});
