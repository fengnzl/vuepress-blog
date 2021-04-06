export class Node {
  constructor(element, next) {
    this.element = element; // 要加入链表中元素的值
    this.next = next; // 链表中下一个元素的指针
  }
}

export class DoublyNode extends Node {
  constructor(element, next, prev) {
    super(element, next);
    this.prev = prev; // 链表中上一元素的指针
  }
}
