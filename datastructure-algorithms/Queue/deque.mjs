class Deque {
  constructor() {
    this.items = {};
    this.count = 0;
    this.lowestCount = 0;
  }

  size() {
    return this.count - this.lowestCount;
  }

  isEmpty() {
    return this.size() === 0;
  }

  clear() {
    this.items = {};
    this.count = 0;
    this.lowestCount = 0;
  }

  addBack(item) {
    this.items[this.count] = item;
    this.count++;
  }

  addFront(item) {
    if (this.isEmpty()) {
      this.addBack(item);
    } else if (this.lowestCount > 0) {
      this.lowestCount--;
      this.items[this.lowestCount] = item;
    } else {
      for (let i = this.count; i > 0; i--) {
        this.items[i] = this.items[i - 1];
      }
      this.count++;
      this.lowestCount = 0;
      this.items[0] = item;
    }
  }

  removeBack() {
    if (this.isEmpty()) {
      return undefined;
    }
    this.count--;
    const result = this.items[this.count];
    delete this.items[this.count];
    return result;
  }

  removeFront() {
    if (this.isEmpty()) {
      return undefined;
    }
    const result = this.items[this.lowestCount];
    delete this.items[this.lowestCount];
    this.lowestCount++;
    return result;
  }

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

export { Deque };
const deque = new Deque();
console.log(deque.isEmpty()); // outputs true
deque.addBack("John");
deque.addBack("Jack");
console.log(deque.toString()); // John,Jack
deque.addBack("Camila");
console.log(deque.toString()); // John,Jack,Camila
console.log(deque.size()); // outputs 3
console.log(deque.isEmpty()); // outputs false
deque.removeFront(); // remove John
console.log(deque.toString()); // Jack,Camila
deque.removeBack(); // Camila decides to leave
console.log(deque.toString()); // Jack
deque.addFront("John"); // John comes back for information
console.log(deque.toString()); // John,Jack
