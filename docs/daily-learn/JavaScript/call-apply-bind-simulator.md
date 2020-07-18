# 模拟 JavaScript 中常见的内置方法

`call()` 、 `apply()` 、和 `bind()` 等都是函数的内置方法，用来改变this的指向问题, 这里只是简单的模拟，随着之后更加深入的学习，会逐渐完善和修改本片文章
<!-- more -->

## call

语法：

> ```js
> fun.call(thisArg, arg1, arg2, ...)
> ```

参数：

1. `thisArg`函数运行时this的指向，即改变函数执行的上下文
2. ` arg1, arg2, ...`指定的参数列表

当第一个参数设置为`null`或者`undefined`，则在非严格模式下，`this`会指向全局对象（浏览器中为window,Node中为global），若在严格模式下，设置什么即指向什么

返回值： 返回调用给定 `this` 值和参数的函数

### 简易的内部实现步骤

```js
Function.prototype.call2 = function () {
  var contxt = arguments[0] ? Object(arguments[0]) : window;
  contxt.fn = this;
  var args = [];
  for (var i = 1; i < arguments.length; i++){
    args.push('arguments['+i+']');
  }
  var result = eval('contxt.fn(' + args + ')');
  delete contxt.fn;
  return result;  
}

// ES6 的语法形式
Function.prototype.call2 = function () {
  // var args = Array.from(arguments);
  var args = [...arguments];
  var obj = args.shift();
  var contxt = obj ? Object(obj) : window;
  contxt.fn = this;
  var result = contxt.fn(...args);
  delete contxt.fn;
  return result;
}
```

### call中的this怎么调用

```js
function f1() {
  console.log(1)
}

function f2() {
  console.log(2)
}

f2.call()// 2
// call执行时，未设置参数则里面的this在非严格模式下指向window，严格模式下this为undefined
// 让this执行，就是让f2执行

f2.call(f1)// 2
// call 执行时，this()里面的this指向变为f1，然后让call中的this执行实际上执行的thisf2

f2.call.call(f1)// 1
// 执行第二个call时，this()里面的this指向变为f1，然后再执行this实际上执行的是f2.call
// 执行f2.call时，由于没有传参，所以就直接执行this()，也就是上一步设置的f1,因此执行f1()函数

f2.call.call.call(f1)
// 后面再多call都已经没有意义，因为倒数第二个call中的this（实质f2.call）指向f1(),因此后面无论调用多少此call都是调用的f1
```

**注：arguments实质是类数组对象，虽然其有length的属性**


## apply

**apply()** 方法与**call()**方法类似，只不过`call()`方法接受的是参数列表，而`apply()`方法接受的是一个数组（或类数组对象）

语法：

> ```
> func.apply(thisArg, [argsArray])
> ```

### 简易的内部实现步骤

```js
Function.prototype.apply2 = function () {
  var contxt = arguments[0] ? Object(arguments[0]) : window;
  contxt.fn = this;
  var paramArr = arguments[1],
    result;
  if (!arguments[1]) {
    result = contxt.fn();
  } else {
    var args = [];
    for (var i = 0; i < paramArr.length; i++){
      args.push('paramArr['+i+']');
    }
    console.log(args);
    result = eval('contxt.fn(' + args + ')');
  }
  delete contxt.fn;
  return result;  
}

// ES6 的语法形式
Function.prototype.apply2 = function () {
  // var args = Array.from(arguments).flat()
  var args = [...arguments].flat();
  var obj = args.shift();
  var contxt = obj ? Object(obj) : window;
  contxt.fn = this;
  var result = contxt.fn(...args);
  delete contxt.fn;
  return result;
}
```

## bind

`bind()` 返回一个**新函数**，该新函数将第一个参数作为 `this` 的上下文。这个新函数后面无论被如何调用，他的 **`this` 都不会被改变**，其余参数将作为新函数的参数供调用时使用。

语法：

> ```
> function.bind(thisArg[, arg1[, arg2[, ...]]])
> ```

- `bind`改变函数中绑定的`this`，此时函数并没有运行，而是将返回值赋给一个变量
- 返回的函数执行时，如果再传参数，会与`bind()`传的参数（除第一个参数）结合起来
- `bind()`返回的函数与原先的函数不再是同一个函数

**IE9以下bind不兼容**

### polyfill（低版本兼容填补工具）

这是[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)网上提供的低版本兼容工具，这里模拟了`bind`的内部实现机制

```js
// profill
// 判断是否存在Function.prototype.bind
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    // 判断当前调用bind的类型是否为Function ,不是则抛出类型错误 ，绑定的不是函数
    if (typeof this !== 'function') {
      throw new TypeError('Function.prototype.bind - what is trying to bound is not a function')
    }
    var that = this,
    // 获取调用bind时传递参数中除第一个参数之后的所有参数
      arg = [].slice.call(arguments, 1),
    // var arg = Array.prototype.slice.call(arguments, 1)
    // var arg = [...arguments].shift(1)
    // var arg = Array.from(arguments).shift(1)
      fNOP = function(){},
      fBound = function () {
      // this instanceof fBound === true 时，说明返回的fBound被当做new的构造函数调用（导致一个新的内建对象作为其this），而不是传递过来的硬绑定，这里用到了this的判定顺序，YDKJS中有详述
      // 这里arg连接的是bind调用返回的函数，返回函数调用时，再次传递的参数，也可以像上面的方法一样获取参数数组
        return that.apply(this instanceof fBound ? this:oThis, arg.concat(...arguments))
      }
      // 维护原型关系
    if (this.prototype) {
        // Function.prototype doesn't have a prototype property
        fNOP.prototype = this.prototype
    }
    // 下行的代码使fBound.prototype是fNOP的实例,因此
    // 返回的fBound若作为new的构造函数,new生成的新对象作为this传入fBound,新对象的__proto__就是fNOP的实例
    fBound.prototype = new fNOP()

    return fBound
  }
}
```

ES6 实现代码

```js
Function.prototype.bind3 = function () {
  if (typeof this != 'function') {
    throw new Error('Function.prototype.bind3-what you are trying to bind is not a function');
  }

  var contxt = arguments[0] ? Object(arguments[0]) : window;
  var args = [...arguments].slice(1);
  var self = this;
  return function F() {
    if (this instanceof F) {
      return new self(...args, ...arguments);
    } else {
      return self.apply(contx, args.concat(...arguments));
    }
  }
}
```

## new 操作符做了什么

- 创建一个全新的对象，最为将要返回的对象实例
- 将这个对象的原型指向构造函数的 prototype 属性
- 将这个空对象赋值给函数内部的 this 关键字
- 除非函数自身返回一个他自己的对象，否则返回这个创建的对象

```js
// 避免设置一个对象的 [[Prototype]]。相反，你应该使用 Object.create()来创建带有你想要的[[Prototype]]的新对象。
function _new() {
  var Constructor = ([]).shift.call(arguments);
  // 第一种方法将对象原型指向构造函数的prototype属性 bad
  // var obj = {};
  // obj.__proto__ = constructor.prototype;
  // 第二种方法 not good
  //var obj = {};  Object.setPrototypeOf(obj, Constructor.prototype );
  // 第三种方法 good
  var obj = Object.create(Constructor.prototype);
  var result = Constructor.apply(obj, arguments);
  return (typeof result === 'object' && result != null) ? result : obj;
```

## Object.create() polyfill

```js
if (!Object.create()) {
  Object.create = function (o) {
    var F = function () { };
    F.prototype = o;
    return new F();
  }
}
```

## 示例

### bind返回的是一个全新的函数

`bind`返回的是一个新的匿名函数，每一次返回的都不一样，不是相同的堆内存

```js
function f1(){}
var f2 = f1.bind(null)
var f3 = f1.bind(null)
console.log(f1 === f2) // false
console.log(f1 === f3) // false
console.log(f2 === f3) // false

```

### bind返回的新函数this不会改变

`bind`调用之后返回的新函数后面无论如何怎么调用，其`this`指向都不会再变

```js
// bind调用之后返回的新函数，不论怎么调用，其this指向都不会变
function f4() {
  console.log(this.a)
}
var obj = {
  a: 12
}
var obj2 = {
  a: 34
}
var f4O = f4.bind(obj)
f4O() // 12
var f4O2 = f4O.bind(obj2)
f4O2() // 12

```

### 模拟console.log方法

定义一个函数`log`，传入任意参数，在模拟`console.log`的同时，在输出内容前添加（app)

```js
function log() {
  let arg = [].slice.call(arguments)
  // let arg = [...arguments]
  // let arg = Array.prototype.slice.call(arguments)
  // let arg = Array.from(arguments)
  arg.unshift('(app)')
  console.log.apply(console,arg)
}
log('hello world')

```

### 通过bind将修改setTimeout中的this指向

通过`bind`和`class`结合的方式可以修改`setTimeout`中this的指向

```js
class latest{
  constructor() {
    this.age = Math.ceil(Math.random()*12+1)
  }
  declare() {
    console.log('I\'m '+this.age+' years old')
  }
  set() {
    window.setTimeout(this.declare.bind(this),10)
  }
}
var lat = new latest()
lat.declare()

```

### bind可以科里化参数（预设值）

```js
function fun(a, b) {
  console.log('a: '+a,'b: '+b)
}

// 使用apply()将数组散开作为参数
fun.apply(null, [2, 3])// a: 2 b: 3

// 通过bind实现科里化
let f1 = fun.bind(null, 1)
f1(2)// a: 1 b: 2

```

**注：**当不想用`this`的绑定功能时，如果通过传入`null`来实现，可能会导致某些未知的bug，可能会由于默认的绑定规则而将其绑定在`global`或者`window`对象上

建议使用 **Object.create(null)**来创建一个比`{}`还要干净彻底的空对象

### 使用call方法调用父构造函数

在子函数中，通过调用父构造函数的`call`方法来实现继承

```js
function Product(name,price) {
  this.name = name
  this.price= price
}

function Toy (){
  Product.apply(this,[...arguments])
  this.category ='toy'
}

function Food(name,price) {
  Product.call(this,name,price)
  this.category = 'food'
}

var toy = new Toy('luffy', 23)
var food = new Food('bread', 34)
console.log(toy) // Toy { name: 'luffy', price: 23, category: 'toy' }
console.log(food) // Food { name: 'bread', price: 34, category: 'food' }
```
