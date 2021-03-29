const _items = Symbol("stackItems");

class Stack {
  constructor() {
    this[_items] = [];
  }

  push(element) {
    this[_items].push(element);
  }

  pop() {
    return this[_item].pop();
  }

  isEmpty() {
    return this[_items].length === 0;
  }

  peek() {
    return this[_items][this[_items].length - 1];
  }

  clear() {
    this[_items] = [];
  }

  size() {
    return this[_items].length;
  }

  toString() {
    return this[_items].toString();
  }

  print() {
    console.log(this.toString());
  }
}

const stack = new Stack();
stack.push(5);
stack.push(8);
let objSymbols = Object.getOwnPropertySymbols(stack);
console.log(objSymbols.length); // 1
console.log(objSymbols); // [ Symbol(stackItems) ]
console.log(objSymbols[0]); // Symbol(stackItems)
stack[objSymbols[0]].push(1);
stack.print(); // 5,8,1
