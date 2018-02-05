let helpers = require('../helpers'),
  getVariables = helpers.getVariables;

module.exports = class Option {
  constructor(short, long, description, variables) {
    this.short = null;
    this.long = null;
    this.description = null;
    this.variables = null;

    if (short) this.short = short;
    if (long) this.long = long;
    if (description) this.description = description;
    if (variables) this.variables = getVariables(variables);
  };
};
