const { models } = require('./src'),
  { Command, Middleware, Option } = models

let base

let command = (name, variables, info) => {
  let command = new Command({name, variables, info})
  if (!base) base = command
  return command
}
let middleware = (action) => {
  return action
}
let option = (short, long, variables, info) => {
  return new Option({short, long, variables, info})
}

let parse = (array) => {
  return base.parse(array)
}

module.exports = { command, middleware, option, parse }
