import { equalsFn } from "../util.mjs";
import { Node } from "../models/LinkedListModels.mjs";
import LinkedList from "./LinkedList.mjs";
export class CircularLinkedList extends LinkedList {
  constructor(equalsFn) {
    super(equalsFn);
  }
  push(element) {
    const node = new Node(element);
    if (this.head == null) {
      this.head = node;
    } else {
      const current = this.getElementAt(this.size() - 1);
      current.next = node;
    }
    node.next = this.head;
    this.count++;
  }

  insert(element, index) {
    if (index >= 0 && index <= this.count) {
      const node = new Node(element);
      let current = this.head;
      if (index === 0) {
        // 没有元素
        if (this.head == null) {
          this.head = node;
          node.next = this.head;
        } else {
          node.next = current;
          // 获取最后一个元素, 正常获取最后一个元素应该是 this.size() - 1
          // 这里使用 this.sizez() 是因为已经多了新增的 node 元素
          current = this.getElementAt(this.size());
          this.head = node;
          // 将最后一个元素指向第一个元素
          current.next = this.head;
        }
      } else {
        const previous = this.getElementAt(index - 1);
        node.next = previous.next;
        previous.mext = node;
      }
      this.count++;
      return true;
    }
    return false;
  }

  removeAt(index) {
    if (index >= 0 && index < this.count) {
      let current = this.head;
      if (index === 0) {
        if (this.size() === 1) {
          this.head = undefined;
        } else {
          const removed = this.head;
          // 最后一个元素
          current = this.getElementAt(this.size() - 1);
          this.head = removed.next;
          current.next = this.head;
          current = removed;
        }
      } else {
        // 不需要改变循环列表的最后一个元素
        const previous = this.getElementAt(index - 1);
        current = previous.next;
        previous.next = current.next;
      }
      this.count--;
      return current.element;
    }
    return undefined;
  }
}
