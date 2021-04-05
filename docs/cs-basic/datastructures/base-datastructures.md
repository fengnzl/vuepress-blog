# 基本数据结构与算法

众所周知，Node.js 遵循的是 CommonJS 规范进行模块化开发，因为 ES6 在 JavaScript 标准中引入了官方的模块功能。因此，在这里都是用的是 ES6 模块导出。点击查看[相关差别及使用方法](https://recoverymonster.github.io/post/exportexport-default-he-exportsmoduleexports-de-qu-bie-yu-lian-xi/)。

由于 Node 中，ES6 导入还是一个实验功能，因此我们需要将文件扩展名由 js 修改为 mjs，并在 node 命令后添加 `--experimental-modules` 来执行代码。

## 栈

栈是一种遵循 **后进先出(LIFO)** 原则的有序集合。新添加或待删除的元素都保存在栈的一端，被称作栈顶，另一端叫做栈底。

栈中的方法一般有：

- `push(elements)`：添加一个或多个新元素到栈顶
- `pop()`：移除栈顶的元素，同时返回被移除的元素
- `peek()`：返回栈顶的元素，不对栈做任何修改（仅仅是返回）
- `isEmpty()`：判断栈里是否存在元素，没有则返回 true，否则返回 false
- `clear()`：移除栈里所有的元素
- `size()`：返回栈里的元素个数。该方法与数组中的 length 属性类似

我们可以通过数组来实现栈，但是其大部分的方法的时间复杂度为 `O(n)`，且为了保证其元素排列有序，他会占用更多的内存空间。因此我们可以选择使用对象来实现栈。

### 对象实现 Stack 类

首先我们要声明一个 `Stack` 类，并实现栈应有的方法即可，最终代码如下

```js
class Stack {
  constructor() {
    this.count = 0;
    this.items = {};
  }

  isEmpty() {
    return this.count === 0;
  }

  size() {
    return this.count;
  }

  clear() {
    this.count = 0;
    this.items = {};
  }

  push(item) {
    this.items[this.count] = item;
    this.count++;
  }

  pop() {
    if (this.isEmpty()) {
      return undefined;
    }
    this.count--;
    const result = this.items[this.count];
    delete this.items[this.count];
    return result;
  }

  peek() {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.items[this.count - 1];
  }

  toString() {
    if (this.isEmpty()) {
      return "";
    }
    let objString = `${this.items[0]}`;
    for (let i = 1; i < this.count; i++) {
      objString += `,${this.items[i]}`;
    }
    return objString;
  }
}
```

这里我们创建了 `toString` 方法，从而可以打印出栈的内容，除了该方法之外，其余的方法复杂度均为 `O(1)`

### 保护数据结构的内部元素

在创建别的开发这也可以使用的数据结构或者对象时，我们希望保护内部的元素，只有暴露出来的方法才能修改内部结构。但是 ES6 中的类时基于原型的，这就代表无法声明私有变量或者方法。因此只能使用以下方法来实现：

- 下划线命名约定，来标价一个属性为私有属性（实际上并不能保护数据）。
- 使用 Symbol 实现类，但这实际上仍然会被破坏，详见 [stackSymbol](https://github.com/recoveryMonster/vuepress-blog/datastructure-algorithms/Stack/stackSymbol.mjs) 文件。
- 使用 ES6 的 WeakMap 实现类，WeakMap 可以存储键值对，其中键是对象，值可以是任意数据，但采用这种方法，代码的可读性不强，且扩展该类时无法继承私有属性。详见 [stackWeakMap](https://github.com/recoveryMonster/vuepress-blog/datastructure-algorithms/Stack/stackWeakMap.mjs) 文件。

### 相关问题

我们可以通过栈来存储访问过的任务、路径或撤销的操作。这里我们只是简单介绍其解决十进制转二进制的问题，以及任意进制转换的算法。

```js
function decimalToBinary(decNumber) {
  const remStack = new Stack();
  let number = decNumber;
  let rem;
  let binaryString = "";

  while (number > 0) {
    rem = Math.floor(number % 2);
    remStack.push(rem);
    number = Math.floor(number / 2);
  }

  while (!remStack.isEmpty()) {
    binaryString += remStack.pop().toString();
  }
  return binaryString;
}

console.log(decimalToBinary(233)); // 11101001
console.log(decimalToBinary(10)); // 1010
console.log(decimalToBinary(1000)); // 1111101000
```

## 队列和双端队列

### 队列

队列遵循 **先进先出(FIFO)** 原则的一组有序的项。队列在尾部添加新元素，并从顶部移除元素。现实中，最常见的队列就是排队。

队列中一般可用的方法有：

- `enqueue(element(s))`：向队列尾部添加一个（ 或多个 ）新的元素。
- `dequeue()` ：移除队列的第一项（ 排在最前面的一项 ）并返回被移除的元素。
- `peek()`：返回队列中的第一个元素。
- `isEmpty()` ：队列中不包含任何元素，返回 true，否则返回 false。
- `size()`：返回队列中包含的元素个数。
- `clear()`：清除队列中的元素。
- `toString()`：返回队列的内容。

与栈类似，我们也可以通过数组来实现队列，但是为了获取元素更高效，我们同样通过对象来实现队列。

```js
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
```

### 双端队列

**双端队列**（ deque，或称 double-ended queue ）是把队列和栈相结合的一种数据结构。同时遵循了先进先出和后进先出的原则。例如电影中的队伍，一个刚买票的人如果只是需要简单询问信息，可以直接回到队伍头部。另外，在队伍末尾的人如果赶时间，他可以直接离开队伍。

双端队列中的方法有：

- `addFront(element)` ：该方法在双端队列前端添加新的元素。
- `addBack(element) `：该方法在双端队列后端添加新的元素（实现方法和  Queue 类中的 enqueue 方法相同）。
- `removeFront()` ：该方法会从双端队列前端移除第一个元素（实现方法和 Queue 类中的 dequeue 方法相同）。
- `removeBack()` ：该方法会从双端队列后端移除第一个元素（实现方法和 Stack 类中的 pop 方法一样）。
- `peekFront()` ：该方法返回双端队列前端的第一个元素（实现方法和 Queue 类中的 peek 方法一样）。
- `peekBack() `：该方法返回双端队列后端的第一个元素（实现方法和 Stack 类中的 peek 方法一样）。
- `isEmpty()`、`size()`、`clear()` 和 `toString() `方法

```js
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
```

### 相关问题

#### 击鼓传花

在队列实际应用过程中，我们会使用一些修改版本，其中就有**循环队列**，其中的典型的例子就是击鼓传花游戏。一群人围成一圈，把花尽快的传递到旁边的人，停止的时候花在谁手上就淘汰谁，直至剩下最后一人。

[循环队列-击鼓传花游戏](https://github.com/recoveryMonster/vuepress-blog/tree/master/datastructure-algorithms/Queue/hotPotato.mjs)

#### 回文检查器

**回文**是正反都能读通的单词、词组、数或一系列字符的序列，例如 madam 或 racecar。

[双端队列-回文检查器](https://github.com/recoveryMonster/vuepress-blog/tree/master/datastructure-algorithms/Queue/palindromeChecker.mjs)

## 链表

由于数组的大小是固定的，从数组的起点或中间插入或移除项的成本很高，需要移动元素。（ JavaScript 内部实现同样如此。）

链表存储有序的元素集合，但不同于数组，链表中的每个元素由一个存储元素本身的节点和一个指向下一个元素的引用（ 也称指针或链接 ）组成。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20200117090006.png)

链表的好处在于，添加或移除元素的时候不需要移动其他元素，然而链表需要使用指针，因此想要访问链表中间的一个元素，则需要从起点（ **表头** ）开始迭代链表直到找到所需的元素。就像寻宝元素一样，你只能从第一条线索顺着往下找。

### 创建链表

下面是 LinkedList 类的 ”骨架“。

```js
import { equalsFn } from "../util.mjs";
import { Node } from "../models/LinkedListModels.mjs";

class LinekedList {
  constructor() {
    this.count = 0; // 链表中存储的数量
    this.head = undefined; // 第一个元素的引用
    this.equalsFn = equalsFn; // 用于比较链表中的元素是否相同，也可以实例化时自行传
  }
}
```

这里默认的比较函数写在 util 文件中，便于复用：

```js
export function equalsFn(a, b) {
  return a === b;
}
```

然后需要一个助手类，用于表示链表中的元素：

```js
export class Node {
  constructor(element) {
    this.element = element; // 要加入链表中元素的值
    this.next = undefined; // 链表中下一个元素的指针
  }
}
```

**链表所需要的方法：**

`push(element)` ：向链表尾部添加一个新元素。

`insert(element, position)` ：向链表的特定位置插入一个新元素。

`getElementAt(index)`：返回链表中特定位置的元素。如果链表中不存在这样的元素，

  则返回 undefined 。

`remove(element)` ：从链表中移除一个元素。

`indexOf(element)` ：返回元素在链表中的索引。如果链表中没有该元素则返回 -1 。

`removeAt(position)` ：从链表的特定位置移除一个元素。

`isEmpty() `：如果链表中不包含任何元素，返回 true ，如果链表长度大于0则返回 false 。

`size()` ：返回链表包含的元素个数，与数组的 length 属性类似。

`toString()` ：返回表示整个链表的字符串。由于列表项使用了 Node 类，就需要重写继

  承自 JavaScript 对象默认的 toString 方法，让其只输出元素的值。

点击查看[链表数据结构代码实现](https://github.com/recoveryMonster/vuepress-blog/tree/master/datastructure-algorithms/LinkedList/LinkedList.mjs)