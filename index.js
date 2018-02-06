// Termikit Comterm Termcom?

let models = require('./models'),
  Command = models.Command,
  Option = models.Option;

let base;

let command = (name, variables, info) => {
  let command = new Command({name, variables, info});
  if (!base) base = command;
  return command;
};
let option = (short, long, variables, info) => {
  return new Option({short, long, variables, info});
};

let parse = (array) => {
  return base.parse(array);
};

module.exports = { command, option, parse };
