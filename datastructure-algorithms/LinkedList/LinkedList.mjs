import { defaultEquals } from "../util.mjs";
import { Node } from "../models/LinkedListModels.mjs";

export class LinkedList {
  constructor(equalsFn = defaultEquals) {
    this.count = 0; // 链表中存储的数量
    this.head = undefined; // 第一个元素的引用
    this.equalsFn = equalsFn; // 用于比较链表中的元素是否相同，也可以实例化时自行传
  }
  // 尾部添加新元素
  push(element) {
    const node = new Node(element);
    if (!this.count) {
      this.head = node;
    } else {
      let current = this.head;
      // 获取最后一项
      while (current.next != undefined) {
        current = current.next;
      }
      // 将 next 赋为新元素，建立链接
      current.next = node;
    }
    this.count++;
  }

  // 返回链表中特定位置的元素
  getElementAt(index) {
    if (index >= 0 && index <= this.count) {
      let node = this.head;
      for (let i = 0; i < index && node != null; i++) {
        node = node.next;
      }
      return node;
    }
    return undefined;
  }

  // 向链表的特定位置插入元素
  insert(element, index) {
    if (index >= 0 && index <= this.count) {
      const node = new Node(element);
      // 在首位插入
      if (index === 0) {
        const current = this.head;
        node.next = current;
        this.head = node;
      } else {
        const previous = this.getElementAt(index - 1);
        const nextNode = previous.next;
        node.next = nextNode;
        previous.next = node;
      }
      this.count++;
      return true;
    }
    return false;
  }

  // 链表中移除指定位置的元素
  removeAt(index) {
    if (index >= 0 && index < this.count) {
      let current = this.head;
      if (index === 0) {
        this.head = current.next;
      } else {
        const previous = this.getElementAt(index - 1);
        current = previous.next;
        previous.next = current.next;
      }
      this.count--;
      return current.element;
    }
    return undefined;
  }

  // 返回元素在链表中的索引
  indexOf(element) {
    let current = this.head;
    for (let i = o; i < this.count && current != null; i++) {
      if (this.equalsFn(current.element, element)) {
        return i;
      }
      current = current.next;
    }
    return -1;
  }

  // 移除元素
  remove(element) {
    const index = this.indexOf(element);
    return this.removeAt(element, index);
  }

  size() {
    return this.count;
  }

  isEmpty() {
    return this.count === 0;
  }

  getHead() {
    return this.head;
  }

  clear() {
    this.count = 0;
    this.head = undefined;
  }

  toString() {
    if (this.isEmpty()) {
      return "";
    }
    let current = this.head.next;
    let objString = `${this.head.element}`;
    for (let i = 1; i < this.count && current != null; i++) {
      objString = `${objString},${current.element}`;
      current = current.next;
    }
    return objString;
  }
}
