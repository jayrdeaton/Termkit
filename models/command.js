let Option = require('./option'),
  helpers = require('../helpers'),
  getVariables = helpers.getVariables;

module.exports = class Command {
  constructor(data) {
    this.actionFunction = null;
    this.commandsArray = [];
    this.commandStrings = ['help'];
    this.info = null;
    this.name = null;
    this.optionsArray = [];
    this.variables = null;
    this.versionString = null;

    if (!data) return;

    if (data.info) this.info = data.info;
    if (data.name) this.name = data.name;
    if (data.variables) this.variables = getVariables(data.variables);
  };
  description(info, description) {
    this.info = info;
    this.description = description;
    return this;
  };
  variable(string) {
    let variable = getVariables(string);
    if (variable && !this.variables) {
      this.variables = variable;
    } else if (variable) {
      this.variables.push(variable);
    };
    return this;
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
  option(short, long, variables, info) {
    this.optionsArray.push(new Option({short, long, variables, info}));
    return this;
  };
  options(options) {
    for (let option of options) {
      this.optionsArray.push(option);
    };
    return this;
  };
  version(version) {
    this.versionString = version;
    return this;
  };
  help() {
    let table = [];
    let title = this.name || 'Program';
    title = `\n${title}`;
    if (this.variables) {
      for (let variable of this.variables) {
        title += ` ${variable.raw}`;
      };
    };
    let info = this.info;
    table.push({ title, info, data: [] });
    if (this.commandsArray.length > 0) {
      let section = { title: 'Commands', data: []};
      for (let command of this.commandsArray) {
        let left = command.name;
        if (command.variables) for (let variable of command.variables) left += ` ${variable.raw}`;
        let right = command.info;
        section.data.push([left, right]);
      };
      table.push(section);
    };
    if (this.optionsArray.length > 0) {
      let section = { title: 'Options', data: []};
      for (let option of this.optionsArray) {
        let left = `-${option.short}, --${option.long}`;
        if (option.variables) for (let variable of option.variables) left += ` ${variable.raw}`;
        let right = option.info;
        section.data.push([left, right]);
      };
      table.push(section);
    };
    let padding = {};
    for (let section of table) {
      for (let array of section.data) {
        for (let [index, string] of array.entries()) {
          if (!padding[index] || string.length > padding[index]) {
            padding[index] = string.length;
          };
        };
      };
    };
    let lines = [];
    for (let section of table) {
      lines.push(section.title);
      if (section.info) lines.push(section.info);
      for (let array of section.data) {
        let line;
        for (let [index, string] of array.entries()) {
          if (padding[index] && padding[index] !== string.length) {
            while (string.length < padding[index]) string += ' ';
          };
          if (line) {
            line += `    ${string}`;
          } else {
            line = string;
          };
        };
        lines.push(line);
      };
      lines.push('');
    };
    for (let line of lines) {
      console.log(line);
    };
  };
  // get commands() {
  //   return this.commandsArray;
  // };
  async parse (array) {
    let command = this;
    let err;
    let result = {
      // _source: Array.from(array)
    };
    let options = {};
    let locations = array.splice(0, 2);
    let variables;
    [err, variables] = findCommandVariables(array, command);
    if (variables) Object.assign(options, variables);
    if (err) {
      command.actionFunction(err);
      return;
    };
    while (array.length > 0) {
      if (array[0].startsWith('-')) {
        let newOptions;
        [err, newOptions] = findOptions(array, command);
        if (err) {
          command.actionFunction(err);
          return;
        };
        Object.assign(options, newOptions);
      } else {
        let newCommand;
        [err, newCommand] = findCommand(array, command.commandsArray);
        if (!newCommand && array[0] === 'help') return command.help();
        if (!newCommand) return command.actionFunction(`Unknown command: ${array[0]}`);
        let name = command.name || '_base';
        if (!result._parents) result._parents = {};
        result._parents[name] = options;
        options = {};
        command = newCommand;
        let newVariables;
        if (!array.includes('help')) [err, newVariables] = findCommandVariables(array, command);
        if (newVariables) Object.assign(options, newVariables);
      };
    };
    Object.assign(result, options);
    command.actionFunction(null, result);
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
  let options = command.optionsArray;
  let result = {};
  while (array.length > 0 && array[0].startsWith('-')) {
    if (array[0].startsWith('--')) {
      let string = array.shift();
      string = string.replace('--', '');
      let option = findOption(string, options);
      if (!option) return [`Unknown Option: --${string}`];
      let [err, vars] = findVariables(option.long, array, option.variables, command.commandStrings);
      Object.assign(result, vars);
      if (err) return [`${err} for: --${option.long}`];
    } else {
      while (array.length > 0 && array[0].startsWith('-')) {
        let string = array.shift();
        let substring = string.slice(1, 2);
        let option = findOption(substring, options);
        if (!option) return [`Unknown Option: -${substring}`];
        string = string.replace(substring, '');
        if (string !== '-') array.unshift(string);
        let [err, vars] = findVariables(option.long, array, option.variables, command.commandStrings);
        if (err) return [`${err} for: --${option.long}`];
        Object.assign(result, vars);
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
let findCommandVariables = (array, command) => {
  let [err, variables] = findVariables(null, array, command.variables, command.commandStrings);
  if (err) return [err];
  if (variables[null]) variables = variables[null];
  for (let key of Object.keys(variables)) {
    if (variables[key] === true) delete variables[key];
  };
  if (Object.keys(variables).length === 0) return [err, null];
  return [err, variables];
};
let findVariables = (base, array, variables, commands) => {
  let result = {};
  if (!variables) {
    if (base) result[base] = true;
    return [null, result];
  };
  if (variables.length > 1) result[base] = {};
  for (let variable of variables) {
    let [err, newVar] = findVariable(array, variable, commands);
    if (err) return [err];
    if (variables.length > 1) {
      result[base][variable.name] = newVar;
    } else {
      if (base) {
        result[base] = newVar;
      } else {
        result[variable.name] = newVar;
      };
    };
  };
  return [null, result];
};
let findVariable = (array, variable, commands) => {
  let result;
  if (array.length > 0 && !array[0].startsWith('-') && !variable.array) {
    if ((!commands.includes(array[0]) || variable.required) && array[0] !== 'help') result = array.shift();
  } else if (array.length > 0 && variable.array) {
    result = [];
    while(array.length > 0 && !array[0].startsWith('-')) {
      if (commands.includes(array[0])) break;
      result.push(array.shift());
    };
  };
  if (!result && variable.required) return [`Missing required variable: ${variable.name}`];
  if (!result) result = true;
  return [null, result];
};
