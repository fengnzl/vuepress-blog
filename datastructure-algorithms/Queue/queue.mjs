class Queue {
  constructor() {
    this.items = [];
    this.count = 0;
    this.lowestCount = 0; // 用来追踪第一个元素
  }

  size() {
    return this.count - this.lowestCount;
  }

  isEmpty() {
    return this.size() === 0;
  }
  // 添加新的项
  enqueue(item) {
    this.items[this.count] = item;
    this.count++;
  }

  // 移除队列第一项
  dequeue() {
    if (this.isEmpty()) {
      return undefined;
    }

    const result = this.items[this.lowestCount];
    delete this.items[this.lowestCount];
    this.lowestCount++;
    return result;
  }

  // 返回第一项
  peek() {
    return this.items[this.lowestCount];
  }

  // 清空队列
  clear() {
    this.items = {};
    this.count = 0;
    this.lowestCount = 0;
  }

  // 添加 toString 方法
  toString() {
    if (this.isEmpty()) {
      return "";
    }
    let objString = `${this.items[this.lowestCount]}`;
    for (let i = this.lowestCount + 1; i < this.count; i++) {
      objString = `${objString},${this.items[i]}`;
    }
    return objString;
  }
}

export { Queue };

const queue = new Queue();
console.log(queue.isEmpty()); // outputs true
queue.enqueue("John");
queue.enqueue("Jack");
console.log(queue.toString()); // John,Jack
queue.enqueue("Camila");
console.log(queue.toString()); // John,Jack,Camila
console.log(queue.size()); // outputs 3
console.log(queue.isEmpty()); // outputs false
queue.dequeue(); // remove John
queue.dequeue(); // remove Jack
console.log(queue.toString()); // Camila
