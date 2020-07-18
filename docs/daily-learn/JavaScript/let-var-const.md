# JS中let、var、和const的区别

`let` 和 `const` 都是ES6中的提出的新的定义变量方法，其中 `let` 可以看作是更完美的 `var` ，因为 `let` 具有**块级作用域和暂时性锁区**。

<!-- more -->

首先我们需要知道**变量提升**这个概念

``` js
var a = 123 // 全局变量
fun(); // 因为函数会被提升到作用域顶部进行声明，因此可以在这直接调用
console.log(a) // 123 // 输出全局变量
function fun() {
  console.log(a) //undefined 输出的是下面定义的变量a声明提升，默认值为undefined
  var a = 234 // 局部变量  
  console.log(a) // 从当前局部作用域开始寻找变量a 所以输出234
}
```

## let具有块级作用域

因为在ES6之前，使用var声明变量，只有函数局部作用域和全局作用域，因此在块级声明的变量相当于全局变量

所以会出现以下情形：

``` js
{
  var a = 'a'
  let b = 'b'
}
console.log(a) // a 
console.log(b) // ReferenceError b is not defined
```

**let声明的变量拥有块级作用域。**

## let 防止循环变量过度共享

当我们使用var变量进行for循环时，会出现以下情况

``` js
for (var i = 0; i < 3; i++) {
  setTimeout(() => { // 同步注册回调函数到 异步的任务队列
    console.log(i) // 执行这一步时 ，同步代码for循环已执行完成
  }, 0)
}
// 输出3个3
console.log(i) // 3
```

这是由于 `for` 循环本身及回调函数都共享唯一的全局变量 `i` ，也就是说 `console.log(i)` 输出的都指向同一个 `i` 即循环之后的变量 `i` 。

而使用 `let` 申明变量，则 `for` 循环每次执行都是一个全新的独立作用域，相互之间不会影响，同时JavaScript引擎会记住每一次 `let` 的值，因此下一次创建时，会自动在此数值上累加，同时注意这里 `let i=0` ，只执行了一次，后面循环只会执行 `i++` 的步骤，而不会再次重新初始化变量

``` js
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
      console.log(i) // 0 1 2
    }
  }
```

同时，需要注意 `for` 循环设置**循环变量的那部分是一个父作用域，而循环提内部是一个单独的作用域**

``` js
for (let i = 0; i < 3; i++) {
  let i = 123
  console.log(i) // 123 123 123
}
```

## 暂时性锁区

`let` 所声明的变量一定要在变量之后使用，否则会报如下错误

``` js
console.log(a) // ReferenceError: a is not defined
let a = 123
// 下面可以安全使用
```

> ES6 明确规定，如果区块中存在 `let` 和 `const` 命令，这个区块对这些命令声明的变量，从一开始就形成了封闭作用域。凡是在声明之前就使用这些变量，就会报错。

``` js
var a = 1; {
  console.log(a); // ReferenceError: Cannot access 'a' before initialization
  let a = 123;
}
```

**注意**： `let` 其实也是存在变量提升，只不过与 `var` 变量提升不同的是， `var` 变量提升主要是在函数作用域而不是块级作用域，同时 `let` 与 `const` 在变量提升的时候不会将其初始化，它是一个未初始化的状态（uninitialized state），而 `var` 将其初始化为undefined，未初始化就意味着你不能访问它，知道你在那个作用域运行 `let` 或者 `const` 声明语句。

> 总之，在代码块内，使用 `let` 命令声明变量之前，该变量都是不可用的。这在语法上，称为“暂时性死区”（temporal dead zone，简称 TDZ）。

上边的表示如下：

``` js
// TDZ开始
a = 123
console.log(a) // ReferenceError: a is not defined
let a // TDZ 结束
console.log(a) // undefined
a = 456
console.log(a) // 456
```

这时，如果在 `let` 前面使用 `typeof` 检测变量类型就会返回错误，而不是 `undefined`

## 变量不允许重复声明

``` js
let a = 123
let a = 234 // SyntaxError: Identifier 'a' has already been declared
```

## let声明的全局变量不是全局对象的属性

这意味这你不能再通过 `window.变量名` 的方式进行变量的访问，他们只存在于一个不可见的块作用域中，这个块理论上是Web页面中运行的所有JS代码的外层块。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20190809141530.png)

## let不能重定义变量

`let` 不允许在相同作用域下重复声明一个变量

``` js
let a = 123
let a = 234
// SyntaxError: Identifier 'a' has already been declared
```

## const命令

`const` 用于声明一个常量，一旦声明，就不能再改变这个常量的值，因此在声明时，就必须立即初始化

``` 
const a = 12
a=34
// TypeError: Assignment to constant variable.

const a
a=34
// SyntaxError: Missing initializer in const declaration
```

`const` 与 `let` 作用域相同，存在块级作用域，同时也存在暂时性锁区。

`const` 实质上是保证变量所指向的内存地址的数据不得改变，对于简单数据，值保存在变量所指向的内存地址，等同于常量；而对于对象和数组等复杂数据，变量指向的内存地址，保存的只是一个指向实际数据的指针。

更多相关文档见阮一峰大神的[ECMAScript 6 入门](http://es6.ruanyifeng.com/)
