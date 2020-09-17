const Option = require('./Option'),
  cosmetic = require('cosmetic'),
  { findCommand, findCommandVariables, findOptions, getVariables } = require('../helpers')

module.exports = class Command {
  constructor(data) {
    this.actionFunction = null
    this.commandsArray = []
    this.commandStrings = ['help']
    this.info = null
    this.name = null
    this.middlewaresArray = []
    this.optionsArray = []
    this.variables = null
    this.versionString = null

    if (!data) return

    if (data.info) this.info = data.info
    if (data.name) this.name = data.name
    if (data.variables) this.variables = getVariables(data.variables)
    if (data.middlewares) this.middlewaresArray = [...data.middlewares]
    if (data.options) this.optionsArray = [...data.options]
  }
  description(info, description) {
    this.info = info
    this.description = description
    return this
  }
  variable(string) {
    let variable = getVariables(string)
    if (variable && !this.variables) {
      this.variables = variable
    } else if (variable) {
      this.variables.push(variable)
    }
    return this
  }
  action(actionFunction) {
    this.actionFunction = actionFunction
    return this
  }
  command(command) {
    this.commandsArray.push(command)
    return this
  }
  commands(commands) {
    this.commandsArray = commands
    commands.map(c => this.commandStrings.unshift(c.name))
    for (let command of commands) {
      this.commandStrings.unshift(command.name)
    }
    return this
  }
  middleware(middleware) {
    this.middlewaresArray.push(middleware)
    return this
  }
  middlewares(middlewares) {
    this.middlewaresArray.push(...middlewares)
    return this
  }
  option(short, long, variables, info) {
    this.optionsArray.push(new Option({short, long, variables, info}))
    return this
  }
  options(options) {
    this.optionsArray.push(...options)
    return this
  }
  version(version) {
    this.versionString = version
    return this
  }
  help(source) {
    let table = []
    let program = this.name || 'Program'
    if (this.variables) {
      for (let variable of this.variables) {
        program += ` ${variable.raw}`
      }
    }
    if (this.optionsArray.length > 0) program += ' [...options]'
    table.push({ title: '\nCommand', info: program, data: [] })
    if (this.info) table.push({ title: 'Info', info: this.info, data: [] })
    if (this.optionsArray.length > 0) {
      let section = { title: 'Options', data: []}
      for (let option of this.optionsArray) {
        let name = ''
        if (option.short) name = `-${option.short}`
        if (option.short && option.long) { name += ', ' }
        if (option.long) name += `--${option.long}`
        if (option.variables) for (let variable of option.variables) name += ` ${variable.raw}`
        let info = option.info || ''
        section.data.push([name, info])
      }
      table.push(section)
    }
    if (this.commandsArray.length > 0) {
      let section = { title: 'Subcommands', data: []}
      for (let command of this.commandsArray) {
        let name = command.name
        if (command.variables) for (let variable of command.variables) name += ` ${variable.raw}`
        let info = command.info
        section.data.push([name, info])
      }
      table.push(section)
    }
    let padding = {}
    for (let section of table) {
      for (let array of section.data) {
        for (let [index, string] of array.entries()) {
          if (!padding[index] || string.length > padding[index]) {
            padding[index] = string.length
          }
        }
      }
    }
    let lines = []
    for (let section of table) {
      if (section.title) { lines.push(cosmetic.cyan.underline(section.title)) } else { lines.push('') }
      if (section.versionString) lines.push(`v${section.versionString}`)
      if (section.info) lines.push(section.info)
      for (let array of section.data) {
        let line
        for (let [index, string] of array.entries()) {
          if (padding[index] && padding[index] !== string.length) {
            while (string.length < padding[index]) string += ' '
          }
          if (line) {
            line += `  ${string}`
          } else {
            line = string
          }
        }
        lines.push(line)
      }
      lines.push('')
    }
    for (let line of lines) {
      console.log(line)
    }
  }
  async parse (array) {
    array.splice(0, 2)
    let command = this
    let err
    let options = {
      _source: Array.from(array)
    }
    let variables
    if (!array.includes('help')) variables = findCommandVariables(array, command)
    if (variables) Object.assign(options, variables)
    while (array.length > 0) {
      if (array[0].startsWith('-')) {
        let newOptions
        newOptions = findOptions(array, command)
        Object.assign(options, newOptions)
      } else {
        if (!array.includes('help')) for (const middleware of command.middlewaresArray) await middleware(options)
        let newCommand
        newCommand = findCommand(array, command.commandsArray)
        if (!newCommand && array[0] === 'help') return command.help(options._source)
        if (!newCommand) throw new SyntaxError(`Unknown command: ${array[0]}`)
        let name = command.name || '_base'
        if (!options._parents) options._parents = {}
        options._parents[name] = {}
        for (const key of Object.keys(options)) {
          if (!key.startsWith('_')) {
            options._parents[name][key] = options[key]
            delete options[key]
          }
        }
        command = newCommand
        let newVariables
        if (!array.includes('help')) newVariables = findCommandVariables(array, command)
        if (newVariables) Object.assign(options, newVariables)
      }
    }
    for (const middleware of command.middlewaresArray) await middleware(options)
    if (command.actionFunction) return command.actionFunction(options)
    if (options._source.length == 2) return command.help(options._source)
    throw new Error(`No action for command: ${command.name || '_base'}`)
  }
}
