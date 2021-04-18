import { defaultEquals, Compare, defaultCompare } from "../util.mjs";
import { Node } from "../models/LinkedListModels.mjs";
import LinkedList from "./LinkedList.mjs";

export class SortedLinkedList extends LinkedList {
  constructor(equalsFn = defaultEquals, compareFn = defaultCompare) {
    super(equalsFn);
    this.compateFn = compareFn;
  }
  push(element) {
    this.insert(element);
  }

  insert(element) {
    if (this.isEmpty()) {
      super.insert(element, 0);
    } else {
      const pos = this.getIndexNextSortedElement(element);
      super.insert(element, pos);
    }
  }

  getIndexNextSortedElement(element) {
    let current = this.head;
    let i = 0;
    for (; i < this.size() && current; i++) {
      const compare = this.compateFn(element, current.element);
      if (compare === Compare.LESS_THEN) {
        return i;
      }
      current = current.next;
    }
    return i;
  }
}
