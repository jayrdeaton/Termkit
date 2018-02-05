let Variable = require('../models/variable');

module.exports = (string) => {
  let results = [];
  let variables = string.split(' ');
  for (let variable of variables) {
    variable.trim();
    if (variable.startsWith('<') && variable.endsWith('>')) {
      variable = variable.replace('<', '').replace('>', '');
      results.push(new Variable({name: variable, required: true}));
    } else if (variable.startsWith('[') && variable.endsWith('...]')) {
      variable = variable.replace('[', '').replace('...]', '');
      results.push(new Variable({name: variable, array: true}));
    } else if (variable.startsWith('[') && variable.endsWith(']')) {
      variable = variable.replace('[', '').replace(']', '');
      results.push(new Variable({name: variable}));
    } else {
      throw `Unrecognized variable description: ${variable}`;
    };
  };
  return results;
};
