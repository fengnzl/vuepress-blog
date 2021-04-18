import { defaultEquals } from "../util.mjs";
import { DoublyNode } from "../models/LinkedListModels.mjs";
import { LinkedList } from "./LinkedList.mjs";

class DoublyLinkedList extends LinkedList {
  constructor(equalsFn = defaultEquals) {
    super(equalsFn);
    this.tail = undefined; // 链表最后一个元素的引用
  }

  insert(element, index) {
    if (index >= 0 && index <= this.count) {
      const node = new DoublyNode(element);
      let current = this.head;
      if (index === 0) {
        // 如果不存在首节点
        if (this.head == null) {
          this.head = node;
          this.tail = node;
        } else {
          node.next = this.head;
          current.prev = node;
          this.head = node;
        }
      } else if (index === this.count) {
        // 在最后进行插入
        current = this.tail;
        node.prev = current;
        current.next = node;
        this.tail = node;
      } else {
        const previous = this.getElementAt(index - 1);
        curernt = previous.next;
        node.next = current;
        previous.next = node;
        current.prev = node;
        node.prev = previous;
      }
      this.count++;
      return true;
    }
    return false;
  }

  removeAt(index) {
    if (this.count === 0) {
      return undefined;
    }
    if (index >= 0 && index < this.count) {
      let current = this.head;
      if (index === 0) {
        this.head = current.next;
        // 如果只有一个元素
        if (this.count === 1) {
          this.tail = undefined;
        } else {
          this.head.prev = undefined;
        }
      } else if (index === this.count - 1) {
        // 移除最后一个元素
        current = this.tail;
        this.tail = current.prev;
        this.tail.next = undefined;
      } else {
        current = this.getElementAt(index);
        const previous = current.prev;
        // 将previous 的下一项与 current 的下一项链接起来，跳过current
        previous.next = current.next;
        current.next.previous = previous;
      }
      this.count--;
      return current.element;
    }
    return undefined;
  }

  getTail() {
    return this.tail;
  }

  clear() {
    super.clear();
    this.tail = undefined;
  }

  inverseToString() {
    if (this.tail == null) {
      return "";
    }
    let objString = `${this.tail.element}`;
    let previous = this.tail.prev;
    while (previous != null) {
      objString = `${objString},${previous.element}`;
      previous = previous.prev;
    }
    return objString;
  }
}
