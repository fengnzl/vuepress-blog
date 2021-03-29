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

