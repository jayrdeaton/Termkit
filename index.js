// Termikit Comterm Termcom?

let models = require('./models'),
  Command = models.Command;

let base;

let command = (name, description, variables) => {
  return new Command(name, description, variables);
};

let parse = (array) => {
  return base.parse(array);
};

let program = (description, variables) => {
  return base = new Command(null, description, variables);
};

module.exports = { command, parse, program };
