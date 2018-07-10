let Option = require('./option'),
  cosmetic = require('cosmetic'),
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
  help(source) {
    let table = [];
    let program = this.name.toLowerCase() || 'Program';
    if (this.variables) {
      for (let variable of this.variables) {
        program += ` ${variable.raw}`;
      };
    };
    if (this.optionsArray.length > 0) program += ' [...options]';
    table.push({ title: '\nCommand', info: program, data: [] });
    if (this.info) table.push({ title: 'Info', info: this.info, data: [] });
    if (this.optionsArray.length > 0) {
      let section = { title: 'Options', data: []};
      for (let option of this.optionsArray) {
        let name = '';
        if (option.short) name = `-${option.short}`;
        if (option.short && option.long) { name += ', ' };
        if (option.long) name += `--${option.long}`;
        if (option.variables) for (let variable of option.variables) name += ` ${variable.raw}`;
        let info = option.info || '';
        section.data.push([name, info]);
      };
      table.push(section);
    };
    if (this.commandsArray.length > 0) {
      let section = { title: 'Subcommands', data: []};
      for (let command of this.commandsArray) {
        let name = command.name;
        if (command.variables) for (let variable of command.variables) name += ` ${variable.raw}`;
        let info = command.info;
        section.data.push([name, info]);
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
      if (section.title) { lines.push(cosmetic.cyan.underline(section.title)) } else { lines.push('') };
      if (section.versionString) lines.push(`v${section.versionString}`)
      if (section.info) lines.push(section.info);
      for (let array of section.data) {
        let line;
        for (let [index, string] of array.entries()) {
          if (padding[index] && padding[index] !== string.length) {
            while (string.length < padding[index]) string += ' ';
          };
          if (line) {
            line += `  ${string}`;
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
  async parse (array) {
    let command = this;
    let err;
    let result = {
      _source: Array.from(array)
    };
    let options = {};
    let locations = array.splice(0, 2);
    let variables;
    variables = findCommandVariables(array, command);
    if (variables) Object.assign(options, variables);
    while (array.length > 0) {
      if (array[0].startsWith('-')) {
        let newOptions;
        newOptions = findOptions(array, command);
        Object.assign(options, newOptions);
      } else {
        let newCommand;
        newCommand = findCommand(array, command.commandsArray);
        if (!newCommand && array[0] === 'help') return command.help(result._source);
        if (!newCommand) throw new SyntaxError(`Unknown command: ${array[0]}`);
        let name = command.name || '_base';
        if (!result._parents) result._parents = {};
        result._parents[name.toLowerCase()] = options;
        options = {};
        command = newCommand;
        let newVariables;
        if (!array.includes('help')) newVariables = findCommandVariables(array, command);
        if (newVariables) Object.assign(options, newVariables);
      };
    };
    Object.assign(result, options);
    if (command.actionFunction) return command.actionFunction(result);
    throw new Error(`No action for command: ${command.name || '_base'}`);
  };
};

let findCommand = (array, commands) => {
  let result;
  for (let command of commands) {
    if (array[0] === command.name) {
      array.shift();
      return command;
    };
  };
  return null;
};
let findOptions = (array, command) => {
  let options = command.optionsArray;
  let result = {};
  while (array.length > 0 && array[0].startsWith('-')) {
    if (array[0].startsWith('--')) {
      let string = array.shift();
      string = string.replace('--', '');
      let option = findOption(string, options);
      if (!option) throw new Error(`Unknown Option: --${string}`);
      let vars;
      try {
        vars = findVariables(option.long, array, option.variables, command.commandStrings);
      } catch(err) {
        err.message += ` for --${option.long}`;
        throw err
      };
      Object.assign(result, vars);
    } else {
      while (array.length > 0 && array[0].startsWith('-')) {
        let string = array.shift();
        let substring = string.slice(1, 2);
        let option = findOption(substring, options);
        if (!option) throw new Error(`Unknown Option: -${substring}`);
        string = string.replace(substring, '');
        if (string !== '-') array.unshift(string);
        let vars;
        try {
          vars = findVariables(option.long, array, option.variables, command.commandStrings);
        } catch(err) {
          err.message += ` for --${option.long}`;
          throw err;
        };
        Object.assign(result, vars);
      };
    };
  };
  return result;
};
let findOption = (string, options) => {
  for (let option of options) {
    if (option.short === string || option.long === string) {
      return option;
    };
  };
};
let findCommandVariables = (array, command) => {
  let variables = findVariables(null, array, command.variables, command.commandStrings);
  if (variables[null]) variables = variables[null];
  for (let key of Object.keys(variables)) {
    if (variables[key] === true) delete variables[key];
  };
  if (Object.keys(variables).length === 0) return null;
  return variables;
};
let findVariables = (base, array, variables, commands) => {
  let result = {};
  if (!variables) {
    if (base) result[base] = true;
    return result;
  };
  if (variables.length > 1) result[base] = {};
  for (let variable of variables) {
    let newVar = findVariable(array, variable, commands);
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
  return result;
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
  if (!result && variable.required) throw new Error(`Missing required variable <${variable.name}>`);
  if (!result) result = true;
  return result;
};
