# 日常巩固

class 和modules 会自动设置“use strict”，因此无需单独进行设置

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