# JavaScript 小知识点

class 和 modules 会自动设置“use strict”，因此无需单独进行设置

`globalThis` 作为全局对象的标准名称加入到了 JavaScript 中

使用 `new Function` 创建的函数，它的 `[[Environment]]` 指向全局词法环境，而不是函数所在的外部词法环境。它有助于降低我们代码出错的可能，详见[文档](https://zh.javascript.info/new-function#zong-jie)

## 运算符

**|| 或运算寻找第一个真值**

当给定多个参与或运算的值

```js
const value = ret1 || ret2 || ret3
```

- 从左到右依次计算操作数
- 对每个操作数将其转换布尔值计算，如果为 true,则直接返回操作数的原始值
- 如果到最后一个操作数都为false，则返回最后一个操作数的原始值

即返回第一个操作数为真的值，如果都为假值，则返回最后一个操作数的原始值

```js
console.log(1|| 0) // 1
console.log(null||0||1) // 1
console.log(false||null|| 0) // 0
```

**&& 与运算寻找第一个假值**

其与或运算符相反，返回第一个操作数为假值得值，如果都为真值，则返回最后一个操作数的原始值

```js
console.log(1 && 2) // 2
console.log(null && true && 1) // null
console.log(true && 2 && 1 && false) // false
```

**非运算符** **!** **的优先级在所有逻辑运算符里面最高，所以它总是在** **&&** **和** **||** **之前执行， 与运算** **&&** **的优先级比** **||** **高，**

```js
alert( alert(1) || 2 || alert(3) ); // 1 // 2
```

**对** **alert** **的调用没有返回值。或者说返回的是** **undefined****

计算第一个操作数会执行alert(1)。然后返回undefined,在或运算符判断为false,则进行下一个操作数判断，2为真，则直接返回2，不进行下一个操作数的计算

## 函数相关

**函数表达式，仅在代码执行到达时进行创建，并仅在那一刻起函数才可用**

执行到 var fun = ...，这一刻起函数才会被创建，跟变量赋值是相同的

```js
say() // 'just say hi'

function say() {
  console.log('hello world')
}
say() // 'just say hi'
function say() {
  console.log('just say hi')
}
hello() //如果用var 声明 hello is not a function  如果用let 或者const 声明，则会报  Uncaught ReferenceError: Cannot access 'hello' before initialization  
// let hello = () => console.log('hello hello')
const hello = () => console.log('hello hello')

hello() // 'hello hello'
```

**严格模式下，当一个函数声明在一个代码块内时，它在该代码块内的任何位置都是可见的。但在代码块外不可见**

**在函数内部我们可以通过new.target来判断该函数是否是通过new 关键字来进行调用的**

```js
// 我们可以在构造函数中通过new.target来确保通过new关键字调用函数
function User(name) {
    if(!new.target) {
        return new User(...arguments)    
    }
    this.name = name
}
```

## 同名变量提升和函数提升

```js
console.log(a)
var a=2;
function a() {
   console.log('hello world');
}
console.log(typeof a);

// 经过变量提升之后，代码变为如下形式
console.log(a)
var a
function a() {
   console.log('hello world');
}
a=2;
console.log(typeof a);
```

JS 代码执行分为词法分析和执行两个阶段

**函数在运行的瞬间会生成一个活动对象 `Active Object`，简称 `AO`。**

1. 分析形参
   1. 如果函数有形参，则给当前活动对象增加属性，赋值为 `undefined`
2. 分析变量
   1. 如果 AO 上没有 XX 属性，则给当前活动对象增加属性，赋值为 undefined
   2. 如果 AO 上已经存在 XX 属性，则什么也不做
3. 分析函数
   1. 把函数赋值给 AO.fun 属性
   2. 如果此前已经存在 fun 属性，则对其进行覆盖（即函数提升优先级高于变量）

上述代码则会按照以下进行提升，首先由于是全局环境，因此可以理解为自执行函数，没有形参，然后按照 2.1 进行赋值 AO.a = undefined，其次会按照 3.2 直接用函数进行覆盖。

**多个函数声明时，由最后一个函数声明覆盖之前的声明**

## 数组对象 concat

**通过对对象设置 [Symbol.isConcatSpreadable] 属性，从而可以将类数据对象使用 concat 方法**

```js
const arr = [1,2]
const arrLike = {  0: 'aa',  1: 'bb',  [Symbol.isConcatSpreadable]: true,  length: 2 } arr.concat(arrLike)// [ 1, 2, 'aa', 'bb' ]
```

## 可迭代对象

**只有可迭代对象，才可以使用 for..of 语法，所谓可迭代对象即需要具有[Symbol.iterator]方法，并返回next方法**

for...of 运行

- for...of 第一次运行时，会调用[Symbol.iterator]方法，该方法需要返回一个迭代器**iterator**对象——即具有next方法的对象
- 从这时开始，for...of 只适用于next方法
- 当for...of循环期望获取下一个值，那么会调用next方法
- next方法返回的值需要是{done: Boolean, value: any}，当 done=true 时，表示迭代结束，否则 value 是下一个值

```js
let range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    this.current = this.from
    return this;
  },
  next() {
    if(this.current <= this.to) {
      return { done: false, value: this.current++ }
    } else {
      return { done: true }
    }
  }
}

for(let i of range)  console.log(i)
```

**可迭代（iterable）和类数组（array-like）**

- Iterable如上所述，是实现了Symbol.iterator方法的对象。
- Array-like是有索引和length属性的对象，所以它们看起来很像数组。

[Object.entries：从对象创建 Map](https://zh.javascript.info/map-set#objectentries-cong-dui-xiang-chuang-jian-map)

```js
const obj = {  name: 'lf',  age: 23 }
const map = new Map(Object.entries(obj))
map.has('name') // true
```

[Object.fromEntries：从 Map 创建对象](https://zh.javascript.info/map-set#objectfromentries-cong-map-chuang-jian-dui-xiang)

```js
let prices = Object.fromEntries([  ['orange', 13],  ['banana', 24] ])
prices // { orange: 13, banana: 24 }
const aa = Object.fromEntries(new Map([  ['orange', 13],  ['banana', 24] ]).entries())
aa // { orange: 13, banana: 24 }
```

## WeakMap

**WeakMap键值只能为对象，且不会阻止垃圾回收机制对作为键的对象（key object）的回收**

```js
let a = {
  name: 'afds'
}

const map = new WeakMap()
map.set(a,'sfds')
a = null

map.get(a) // null
map.has(a) // false
```

其只有以下几种方法

- weakMap.get(key)
- weakMap.set(key, value)
- weakMap.delete(key)
- weakMap.has(key)

JavaScript 引擎可能会选择立即执行内存清理，如果现在正在发生很多删除操作，那么 JavaScript 引擎可能就会选择等一等，稍后再进行内存清理。因此WeakMap当前元素数量是未知的

**[典型使用场景](https://zh.javascript.info/weakmap-weakset#shi-yong-an-li-ewai-de-shu-ju)**

- 额外数据存储
- 缓存

WeakMap 和 WeakSet 最明显的局限性就是不能迭代，并且无法获取所有当前内容。那样可能会造成不便，但是并不会阻止 WeakMap/WeakSet 完成其主要工作 — 成为在其它地方管理/存储“额外”的对象数据。

## 用let结构赋值的陷阱

```js
let title, width, height;

// 这一行发生了错误 // SyntaxError: Unexpected token '='
{title, width, height} = {title: "Menu", width: 200, height: 100};
```

这是由于 JavaScript 把主代码流（即不在其他表达式中）的{}当作一个代码块，因此这就是上述报错的原因，可以使用（）将上述代码包裹起来，从而告诉 JavaScript 这不是一个代码块

```js
let title, width, height;

// 这一行发生了错误
({title, width, height} = {title: "Menu", width: 200, height: 100});
```

## formatDate

```js
function formatDate(date) {
  const diff = Date.now() - date
  if(diff < 1000) {
    return 'right now'
  }
  const sec = Math.floor(diff/1000)
  
  if(sec < 60) {
    return sec + ' sec. ago'
  }
  
  const min = Math.floor(sec/60)
  
  if(min < 60) {
    return min + ' min. ago'
  }
  
  const d = [
    '0' + (date.getMonth() + 1),
    '0' + date.getDate(),
    '0' + date.getHours(),
    '0' + date.getMinutes(),
    '0' + date.getSeconds()
  ].map(time => time.slice(-2))
  
  const year = date.getFullYear() + ''
  
  return year + '.' + d.slice(0,2).join('.') + ' ' + d.slice(2).join(':')
}

formatDate(new Date(new Date - 1)) // 'right now'
formatDate(new Date(new Date - 30 * 1000)) // '30 sec. ago'
formatDate(new Date(new Date - 5 * 60 * 1000)) // '5 min. ago'
formatDate(new Date(new Date - 86400 * 1000)) // '2021.03.13 23:54:58'
```

## JSON

由于JSON是无关语言的纯数据规范，因此调用 JSON.stringify 一些特定的JavaScript对象属性会被跳过

- 函数属性（方法）
- Symbol类型的属性
- undefined 属性

**循环引用，会进行报错**

```js
let room = {
  number: 23
};

let meetup = {
  title: "Conference",
  participants: ["john", "ann"]
};

meetup.place = room;       // meetup 引用了 room
room.occupiedBy = meetup; // room 引用了 meetup

JSON.stringify(meetup); // Error: Converting circular structure to JSON
```

 转换 JSON 的完整语法如下： `JSON.stringify(value[, replacer, space])`

其中 replacer 为要进行编码的数据，或者映射函数 `function(key, value)` 对上述数据进行如下处理可得：

```js
JSON.stringify(meetup, function replacer(key, value) {
  return (key == 'occupiedBy') ? undefined : value;
}, 2)
// 
'{
  "title": "Conference",
  "participants": [
    {
      "name": "John"
    },
    {
      "name": "Alice"
    }
  ],
  "place": {
    "number": 23
  }
}'
```

**自定义 toJSON**

我们可以在对象中提供 `toJSON` 方法来进行 JSON 转换

```js
const numObj = {
  num: 12,
  toJSON() {
    return this.num
  }
}
JSON.stringify(numObj) // '12'
```

`JSON.parse(str, [reviver])`  其中 receiver 函数将为每个 `(key, value)` 进行调用，并对值进行转换

## 递归和堆栈

**执行上下文**是一个内部数据结构，包含函数执行时的详细细节，每次函数调用都会产生一个全新的执行上下文

简单来说函数内部调用其本身称之为递归调用，其执行细节：

- 当前函数暂停
- 与其关联的执行上下文保存在一个特殊的**执行上下文堆栈**数据结构中
- 执行嵌套调用
- 当嵌套调用结束后，从执行上下文堆栈中恢复之前的执行上下文

一般来说 JavaScript 引擎所支持的最大递归深度为 1000，虽然一些自动优化可以帮助减轻这种情况（[尾部调用优化](https://www.ruanyifeng.com/blog/2015/04/tail-call.html)），但尚未完全支持,递归函数可用于以更优雅的方式解决问题。

```js
// 斐波那契数 序列有这样的公式： Fn = Fn-1 + Fn-2     1, 1, 2, 3, 5, 8, 13, 21...
function fib(num) {
  if (typeof num !== 'number') {
    throw new TypeError('num must be a number')
  }
  return num <= 1 ? num : fib(num - 1) + fib(num - 2)
}

console.time()
console.log(fib(30))
console.timeEnd() // default: 14.211ms

function fib2(num) {
  if (typeof num !== 'number') {
    throw new TypeError('num must be a number')
  }
  let a = 1;
  let b = 1;
  for (let i = 3; i <= num; i++) {
    let c = a + b;
    [a, b] = [b, c];
  }
  return b
}

console.time()
console.log(fib2(30))
console.timeEnd() // default: 0.099ms
```

这里递归函数产生了太多的子调用。同样的值被一遍又一遍地计算，从而在计算数比较大的情况会耗时特别久。

例如，我们看下计算 `fib(5)` 的片段：

```js
...
fib(5) = fib(4) + fib(3)
fib(4) = fib(3) + fib(2)
```

## Spread 语法

- `Array.from` 适用于类数组对象也适用于可迭代对象。
- Spread 语法只适用于可迭代对象。

因此，对于将一些“东西”转换为数组的任务，`Array.from` 往往更通用。

## 任意数量的括号求和

写一个函数 `sum`，它有这样的功能：

```javascript
sum(1)(2) == 3; // 1 + 2
sum(1)(2)(3) == 6; // 1 + 2 + 3
sum(5)(-1)(2) == 6
sum(6)(-1)(-2)(-3) == 0
sum(0)(1)(2)(3)(4)(5) == 15
```

- 为了任意数量的调用，`sum` 的结果必须是函数
- 该函数需要将两次调用的当前值保存在内存中
- 由于返回的是函数，为了正常比较，需要提供自定义转换规则

```js
function sum(a) {
	let currentSum = a
	function f(b) {
		currentSum += b
		return f
	}
	f[Symbol.toPrimitive] = function() {
		return currentSum
	}
	return f
}
```

## 原型、继承

**访问原型上的属性和对象直接访问自身的属性，哪个速度快？**

```
let head = {
  glasses: 1
};

let table = {
  pen: 3,
  __proto__: head
};

let bed = {
  sheet: 1,
  pillow: 2,
  __proto__: table
};

let pockets = {
  money: 2000,
  __proto__: bed
};
```

在现代引擎中，从性能的角度来看，我们是从对象还是从原型链获取属性都是没区别的。它们（引擎）会记住在哪里找到的该属性，并在下一次请求中重用它。并且引擎足够聪明，一旦有内容更改，它们就会自动更新内部缓存，因此，该优化是安全的

# F.prototype

- 当我们通过构造函数来创建对象的时候，如果 `F.prototype` 属性（其与对象的 `[[Prototype]]` 不是同一个东西） 是一个对象，那么 `new` 操作符会使用它为新对象设置 `[[Prototype]]`， `F.prototype` 仅在 `new F` 被调用的时候使用
- `F.prototype` 的值要么是一个对象，要么为 `null`
- 默认情况下，所有函数都有 `F.prototype = {constructor: F}`，所以可以通过访问其 `"constructor"` 属性来获取一个对象的构造器

只有 `undefined` 和 `null` 没有包装器对象

## 类

**重写 constructor**

如果一个类扩展（extends）了另一个类，并且没有 `constructor` ，那么将生成下面这样的 “空” `contructor`

```js
class Rabbit extends Animal {
  // 为没有自己的 constructor 的扩展类生成的
  constructor(...args) {
    super(...args);
  }
}
```

**继承类的 constructor 必须在使用 `this` 之前调用 `super()` 方法**

继承类（派生构造器）的构造函数与其它函数之间相比，具有特殊的内部属性 `[[ConstructorKind]]: "derived"`，其会影响它的 `new` 行为：

- 当 `new` 执行常规函数的时候，会创建一个对象，并将这个空对象赋值给 `this`
- 当继承的 constructor 执行时，其不会执行这个操作，会期望父类的 constructor 来完成这项工作，因此必须调用 `super` 来执行父类的 constructor，否则 `this` 指向的对象将不会被创建

**父类构造器总会使用它自己的字段值，而不是被重写的那个**

```js
class Animal {
  name = 'animal'
  constructor() {
    console.log(this.name)
  }
}

class Rabbit extends Animal {
  name = 'rabbit'
}

new Animal() // animal
new Rabbit() // animal
```

而使用方法是，则会使用被重写的方法

```js
class Animal {
  showName() {
    console.log('animal')
  }
  constructor() {
    this.showName()
  }
}

class Rabbit extends Animal {
  showName() {
    console.log('rabbit')
  }
}

new Animal() // animal
new Rabbit() // rabbit
```

这是由于字段初始化顺序导致：

- 对于基类（尚未继承任何东西），在构造函数调用前初始化
- 对于派生类，在 `super()` 后立即初始化

所以第一个 `new Rabbit()` 的时候调用了自动生成的空构造器中的 `super(...args)`，因此执行了父类构造器，根据字段生成顺序，只有在这之后 `Rabbit` 类字段才会被初始化，因此父构造器在执行的时候，会使用 `Animal` 类的字段。

内部：

- 方法在内部的 `[[HomeObject]]` 属性中记住了它们的类/对象。这就是 `super` 如何解析父方法的。
- `[[HomeObject]]` 是为类和普通对象中的方法定义的。但是对于对象而言，方法必须确切指定为 `method()`
- 因此，将一个带有 `super` 的方法从一个对象复制到另一个对象是不安全的。

我们可以把一个方法赋值给类的函数本身，而不是赋给它的 `"prototype"`。这样的方法被称为 **静态的（static）**。静态属性类型，静态属性和方法都是可以继承的。

**“extends” 语法会设置两个原型：**

1. 在构造函数的 `"prototype"` 之间设置原型（为了获取实例方法）。
2. 在构造函数之间会设置原型（为了获取静态方法）