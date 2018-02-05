module.exports = class Variable {
  constructor(data) {
    this.array = false;
    this.name = null;
    this.required = false;
    this.value = null;

    if (!data) return;
    
    if (data.array) this.array = data.array;
    if (data.name) this.name = data.name;
    if (data.required) this.required = data.required;

    if (this.array) this.value = [];
  };
};
