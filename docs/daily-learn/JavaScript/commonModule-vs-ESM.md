# export, export default和exports、module.exports的区别与联系

由于在项目中时常搞混import, require, exporthe exports导入和导出文件的命令，因此专门以此记录其区别与联系。

<!-- more -->

## 使用范围

首先我们来理理其各自的使用范围

``` js
export /
export default: ES6支持的导出
exports / module.exports: Node支持的导出
import: ES6支持的引入 静态加载 必须放在文件的最开始
require: Node支持的引入 动态加载， 按需随时可以引入
```

## export和export default

在创建JavaScript模块时， `export` 语句用于从模块中导出函数、对象或原始值，以便其他程序可以通过 [ `import` ](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/import) 语句使用它们。

无论您是否声明，导出的模块都处于[ `严格模式` ](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Strict_mode)。 export语句不能用在嵌入式脚本中。

### export

通过export导出变量有以下两种方式：

``` js
//第一种方式 demo.js
export let name = 'stt';
export let age = 24；
//第二种方式 demo.js（推荐）
let name = "stt";
let age = 24;
export {
  name,
  age
};
```

这里推荐使用第二种方式导出变量，这样可以很清晰的知道导出的变量有哪些

`export` 命令除了输出变量，还可以输出函数或类（class）。同时我们可以用as关键字进行重命名：

``` js
//对外输出一个函数divideFun
export function divideFun(x, y) {
  return x / y;
}

function h() {
  return 'Hello World';
}

function fun(a, b) {
  return a + b;
}
//用as 重命名，并且可以通过重命名输出两次
export {
  h as hello,
  fun as add,
  fun as add2
}
```

**这时在模块外面则只能识别重命名**

注意，下面的语法有严重错误：

``` js
//错误演示
// 报错
export 1;
// 报错
var m = 1;
export m;
```

这是因为export在导出接口的时候，必须与模块内部的变量具有一一对应的关系。也不可能在import的时候有一个变量与之对应。 `export m` 虽然看上去成立，但是 `m` 的值是一个数字，根本无法完成解构，不是一个接口，因此必须写成 `export {a}` 的形式。即使a被赋值为一个function，也是不允许的。

``` js
// 写法一
export var m = 1;

// 写法二
var m = 1;
export {
  m
};

// 写法三
var n = 1;
export {
  n as m
};

// 报错
function f() {}
export f;

// 正确
export function f() {};

// 正确
function f() {}
export {
  f
};
```

### default关键字

export其实和export default就是写法上面有点差别，一个是导出一个单独接口，一个是默认导出一个整体接口。使用import命令的时候，用户需要知道所要加载的变量名或函数名，否则无法加载。这里就有一个简单写法不用去知道有哪些具体的暴露接口名，就用export default命令，为模块指定默认输出。说白了，它其实是别名的语法糖：

``` js
//demo.js
function a() {};
export default a;
//等效于
export {
  a as
  default
} //即将a赋给defult
```

在import的时候，可以这样用：

``` js
import a from './demo.js';

// 等效于，或者说就是下面这种写法的简写，是同一个意思  即这时不用知原模块输出的函数名，可以为其指定任意名
import {
  default as a
} from './demo.js';
```

这个语法糖的好处就是import的时候，可以省去花括号{}。简单的说，如果import的时候，你发现某个变量没有花括号括起来（没有*号），那么你在脑海中应该把它还原成有花括号的as语法。

所以，下面这种写法你也应该理解了吧：

``` js
import $, {
  each,
  map
} from 'jquery';
```

import后面第一个 `$` 是 `{defalut as $}` 的替代写法

### export导出的值可以修改

`export` 导出的属性或者方法可以修改，但是 `export default` 导出的值不能修改，这是因为 `export` 导出的是值的引用，而 `export default` 导出的是浅拷贝的值

``` js
  //export.js
  let e1 = 'export 1';
  let e2 = 'export 2';
  export {
    e1
  };
  export default e2;
  e1 = 'export 1 modified';
  e2 = 'export 2 modified';
```

``` js
//index.js
import e2, {
  e1
} from "./export.js"; // 注意这里{}必须在后面，即不能写成import {e1}, e2的形式
console.log(e1); // export 1 modified
console.log(e2); // expor 2
```

### *符号

*就是代表所有，只用在import中，我们看下两个例子：

``` js
// export.js
let obj = {
  name: 'stt'
}

function foo() {
  console.log('this is a function')
}
export {
  obj,
  foo
}
```

``` js
// index.js
import * as ext from '../export'
console.log('obj', ext.obj) // obj {name: "stt"}
ext.foo() // this is a function
```

**注意：** `*` 不能导入模块默认导出值

``` js
// export.js
let obj = {
  name: 'stt'
}

function foo() {
  console.log('this is a function')
}
export default obj
export {
  foo
}
```

``` js
// index.js
import * as ext from '../export'
console.log('obj', ext.obj) // obj undefined
ext.foo() // this is a function
```

## exports和module.exports

`node` 遵循的是 `common.js` 的规范，它是由模块组成，每一个文件就是一个模块，有自己的作用域。	

> `CommonJS` 定义的模块分为: 模块标识( `module` )、模块定义( `exports` ) 、模块引用( `require` )
>
> CommonJS规范规定，每个模块内部， `module` 变量代表当前模块。这个变量是一个对象，它的 `exports` 属性（即 `module.exports` ）是对外的接口。加载某个模块，其实是加载该模块的 `module.exports` 属性。

``` js
exports = module.exports = {} // 他们指向相同的内存区域
```

如以下的例子：

``` js
// export.js
let name = 'stt'
let age = 27

console.log(module.exports) // {}
console.log(exports) // {}
console.log(module.exports === exports) //true
module.exports.name = name
exports.age = age
```

``` js
// index.js
const obj = require('../export')
console.log(obj.name) // stt
console.log(obj.age) // 27
```

也可以在导出时，自行设置导出名称

``` js
// export.js
let name = 'stt'
let age = 27

module.exports.aa = name
exports.bb = age

// index.js
const obj = require('../export')
console.log(obj.aa) // stt
console.log(obj.bb) // 27
```

用 `exports` 只能将属性或者方法一个一个导出，而 `module.exports` 可以直接导出整个对象，类似字面量形式和构造形式创建对象时声明属性的不同

``` js
// export.js
let name = 'stt'
let age = 27

module.exports = {
  aa: name, // 设置导出别名，写成键值对形式
  age // 如果不设置别名，则不需写成键值对形式
}

// index.js
const obj = require('../export')
console.log(obj.aa) // stt
console.log(obj.age) // 27
```

**注意： `exports` 不能导出函数**

``` js
// export.js
exports.foo = function() {
  console.log('this is a function')
}
```

在 `aa.js` 文件中执行会报如下错误

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190901233838.png)

所以要导出函数必须使用 `module.exports`

``` js
// export.js
module.exports = function() {
  console.log('this is a function')
}

//aa.js
require('../export')() //this is a function
```

## 参考

[阮一峰-Common.js规范](https://javascript.ruanyifeng.com/nodejs/module.html)

[exports、module.exports和export、export default到底是咋回事](https://segmentfault.com/a/1190000010426778)
