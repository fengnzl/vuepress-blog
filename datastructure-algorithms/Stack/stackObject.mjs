class Stack {
  constructor() {
    this.count = 0;
    this.items = {};
  }

  push(element) {
    this.items[this.count] = element;
    this.count++;
  }

  pop() {
    if (this.isEmpty()) {
      // 如果为空
      return undefined;
    }
    this.count--;
    const result = this.items[this.count];
    delete this.items[this.count];
    return result;
  }

  peek() {
    if (this.isEmpty) {
      return undefined;
    }
    return this.items[this.count--];
  }

  clear() {
    this.items = {};
    this.count = 0;
    // 或者遵循栈的 LIFO 规则
    // while (!this.isEmpty()) {
    //   this.pop();
    // }
  }

  size() {
    return this.count;
  }

  isEmpty() {
    return this.count === 0;
  }

  toString() {
    if (this.isEmpty()) {
      return "";
    }
    let objString = this.items[0];
    for (let i = 1; i < this.count; i++) {
      objString = `${objString},${this.items[i]}`;
    }
    return objString;
  }
}

export { Stack as StackObject };
