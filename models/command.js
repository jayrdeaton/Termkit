let Option = require('./option'),
  helpers = require('../helpers'),
  getVariables = helpers.getVariables;

module.exports = class Command {
  constructor(name, description, variables) {
    this.actionFunction = null;
    this.commandsArray = [];
    this.commandStrings = [];
    this.description = null;
    this.name = null;
    this.options = [];
    this.variables = null;
    this.versionString = null;

    if (description) this.description = description;
    if (name) this.name = name;
    if (variables) this.variables = getVariables(variables);
  };
  action(actionFunction) {
    this.actionFunction = actionFunction;
    return this;
  };
  commands(commands) {
    this.commandsArray = commands
    for (let command of commands) {
      this.commandStrings.unshift(command.name);
    };
    return this;
  };
  option(short, long, description, variable) {
    this.options.push(new Option(short, long, description, variable));
    return this;
  };
  version(version) {
    this.versionString = version;
    return this;
  };
  // get commands() {
  //   return this.commandsArray;
  // };
  parse(array) {
    let command = this;
    let parents = [];
    let options;
    let locations = array.splice(0, 2);
    let [err, variables] = findCommandVariables(array, command);
    if (variables) options = variables;
    if (err) {
      command.actionFunction(err);
      return;
    };
    while (array.length > 0) {
      if (array[0].startsWith('-')) {
        let [err, newOptions] = findOptions(array, command);
        if (err) {
          command.actionFunction(err);
          return;
        };
        if (options) {
          Object.assign(options, newOptions);
        } else {
          options = newOptions;
        };
      } else {
        let [err, newCommand] = findCommand(array, command.commandsArray);
        if (!newCommand) {
          if (options) {
            options._input = array;
          } else {
            options = { _input: array };
          }
          command.actionFunction(null, options);
          array = [];
        } else {
          if (options) {
            options = {
              _parents: options
            };
          }
          command = newCommand;
        };
      };
    };
    command.actionFunction(null, options);
  };
};

let findCommand = (array, commands) => {
  let result;
  for (let command of commands) {
    if (array[0] === command.name) {
      array.shift();
      return [null, command];
    };
  };
  return [];
};
let findOptions = (array, command) => {
  let options = command.options;
  let result = {};
  while (array.length > 0 && array[0].startsWith('-')) {
    if (array[0].startsWith('--')) {
      let string = array.shift();
      string = string.replace('--', '');

      let option = findOption(string, options);
      if (!option) return [`Unrecognized Option: --${string}`];
      let [err, vars] = findVariables(option.long, array, option.variables, command.commandStrings);
      Object.assign(result, vars);
      if (err) return [`${err} for: --${option.long}`];
    } else {
      while (array.length > 0 && array[0].startsWith('-')) {
        let string = array.shift();
        let substring = string.slice(1, 2);
        let option = findOption(substring, options);
        if (!option) return [`Unrecognized Option: -${substring}`];
        string = string.replace(substring, '');
        if (string !== '-') array.unshift(string);
        let [err, vars] = findVariables(option.long, array, option.variables, command.commandStrings);
        Object.assign(result, vars);
        if (err) return [`${err} for: --${option.long}`];
      };
    };
  };
  return [null, result];
};
let findOption = (string, options) => {
  for (let option of options) {
    if (option.short === string || option.long === string) {
      return option;
    };
  };
};
let findVariables = (base, array, variables, commands) => {
  let result = {};
  if (base) result[base] = true;
  if (!variables) {
    if (base) result[base] = true;
    return [null, result];
  } else {
    for (let variable of variables) {
      if (array.length > 0 && !array[0].startsWith('-') && !variable.array) {
        if (!commands.includes(array[0]) || variable.required) result[variable.name] = array.shift();
      } else if (array.length > 0 && variable.array) {
        result[variable.name] = [];
        while(array.length > 0 && !array[0].startsWith('-')) {
          if (commands.includes(array[0])) break;
          result[variable.name].push(array.shift());
        };
      };
      if (!result[variable.name] && variable.required) return [`Missing required variable: ${variable.name}`];
      if (!result[variable.name]) result[variable.name] = true;
    };
    return [null, result];
  };
};
let findCommandVariables = (array, command) => {
  let [err, variables] = findVariables(null, array, command.variables, command.commandStrings);
  if (err) return err;
  for (let key of Object.keys(variables)) {
    if (variables[key] === true) delete variables[key];
  };
  if (Object.keys(variables).length === 0) return [err, null];
  return [err, variables];
};
