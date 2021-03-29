// import { StackArray } from '../../src/js/data-structures/stack-array.mjs';
import { StackObject } from "./stackObject.mjs";

// const stack = new StackArray();
const stack = new StackObject();
console.log(stack.isEmpty()); // true
stack.push(5);
stack.push(8);
console.log(stack.toString());
// console.log(stack.peek());
// stack.push(11);
// console.log(stack.size());
// console.log(stack.isEmpty());
// stack.push(15);
// stack.pop();
// stack.pop();
// console.log(stack.size());
