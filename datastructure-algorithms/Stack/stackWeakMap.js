const items = new WeakMap(); // 声明一个 WeakMap 类型的变量 items

class Stack {
  constructor() {
    items.set(this, []); // 以this(Stack类自己的引用为键)，把代表栈的数组存入items
  }

  push(element) {
    const s = items.get(this); // 从weakMap中取出值
    s.push(element);
  }

  pop() {
    const s = items.get(this);
    return s.pop();
  }

  isEmpty() {
    const s = items.get(this);
    return s.length === 0;
  }

  peek() {
    const s = items.get(this);
    return s[s.length - 1];
  }

  size() {
    const s = items.get(this);
    return s.length;
  }

  toString() {
    const s = items.get(this);
    return s.toString();
  }

  print() {
    console.log(this.toString());
  }
}

const stack = new Stack();
console.log(stack.isEmpty()); // true
stack.push(2); // 1
stack.push(5);
stack.print(); // 2,5
