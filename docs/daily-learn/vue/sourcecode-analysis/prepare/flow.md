# 认识 Flow

[Flow](https://flow.org/en/docs/getting-started/) 是 JavaScript 代码的静态类型检查器。其官网上表示它能让你更有效率。使您更快、更聪明、更有信心、更大规模地编写代码。Vue.js  2.X  版本的源码利用了 Flow 做静态类型检查，3.X 版本之后使用 TypeScript 来进行类型检查，其当初选择 Flow 的大致理由可参考[尤大的回答](https://www.zhihu.com/question/46397274)。但对于 2.X 版本了解 FLow 有利于我们更好的理解源码。

## 安装和使用

通过以下命令我们可以安装 flow

```bash
$> #npm install -g flow-bin
$> yarn add -g flow-bin
```

安装完成后我们在要执行静态检查的文件跟目录下执行一下 flow init ，这个命令会生成  .flowconfig 文件，在这个文件中我们可以进行一些高级配置，如忽略的目、指定版本、指定声明文件等（详情请戳官网）。

```bash
$> mkdir flow-test
$> cd flow-test
$> flow init
```

在生成 .flowconfig 文件之后，我们就可以通过对需要进行 Flow 检查的文件，在开头增加标识，告诉 Flow 你得检查这个文件。

```js
/* @flow */
// @flow  只要带上面这两个注释，都会进行类型检测

# 或者
/* @flow weak */ 只对有加类型注解的变量进行类型检测
```

###  使用 Flow

在有了 . flowconfig 文件之后，你可以立即检测目录及子目录下所有带检测文件

```bash
$> flow check
```

但是它不是最高效的，因为这个命令每次都会将目录下所有的文件进行检测，如果我们想每次只检测修改的文件，那么可以使用 flow server，来检测只有修改的文件，首先使用 `flow` 来开启服务，然后修改文件之后再次运行 `flow` 即可，代项目完成则关闭 flow server 即可。

```bash
$> flow # 开启一个后台服务，输出首次检测结果
$> flow # 后续使用flow，连接正在运行的后台服务，输出检测结果
$> flow stop # 关闭flow server
```

## 工作方式

Flow 主要有两种类型检查方式：

- **类型推断**：Flow 拥有自动类型的推导机制，可以通过变量的上下文来推导其类型，并持续跟踪检测
- **类型注释**：我们可以通过注释变量的类型，来对变量进行检测

### 类型推断

该方法只需要在文件头部增加 flow 标识，即可完成类型检查，这就是类型推断。比如：

```js
// @flow
let name = 'vue';
console.log(name - 1);

function join(arr) {
    return arr.join('');
}
join('123')
```

上述代码中，我们声明变量 `name` 为 vue ，Flow 会自动推断出 `name` 的类型为 string 类型，如果后续对 name 进行了不适用字符串的操作，那么就会报错（注：如果是这样 `console.log(name + 1)` 则不会报错，因为在 JS 中加操作符中字符串和数字相加是合法的）。同理我们声明的函数 `join` 期待的参数是数组，而我们输入了字符串。

### 类型注释

类型注释通常以 ：开头，可以用在变量声明，方法参数和返回值当中，下面是一些常用的类型注释：

#### 基本类型

``` js
// @flow
let str: string = 'aa';
let num: number = 12;
let bool: boolean = false;
let unde: void = undefined; // undefined 的类型是 void
let nu: null = null; // null 的类型是 null
```

**注意：**在 Flow 中，像 string、number 等类型名称还有以大写开头的类型名称，代表其对应值是 new 关键字所创建。

```js
// @flow
const a: string = 'a';  // 字面量值对应的类型名称是小写 
const b: string = String('b');  // String 函数是将参数转化成一个字符串，类型仍是小写
const c: String = new String('c'); // 大写开头的类型名称，其对应的值是 new 创建出来的类型实例；
```

#### 函数

```js
// @flow
function fun (x: string, y: string): string {
  return x + y;
}

const add = (a: number, b: number): void => {
  console.log(a + b);
}

add('11', 2);
```

上述代码 Flow 即可检测出错误，因为函数参数期待为数字，而我们却传递了字符串。

#### 数组

``` js
// @flow
var arr: Array<string> = ['1', '2', '3']

// arr.push(1)

var arr2: [number, boolean, string] = [1, false, 'aa'];

// var arr3: [number, boolean, string] = ['1', false, 'aa'];
```

数组类型注释是 `Array<T> ` ，其中 T 代表类型，当指定类型之后，我们再向数组中添加不符合类型的元素，Flow 检查就会报错。同时另一种是元组类型的注释，如 arr2 ，其每一项的元素类型都会被标注出来，数组不能被改变，因此通常用于函数返回值的检测。

#### 类和对象

对象的类型注释，需要指定对象属性的类型，对于较多属性的对象，我们通常将类型定义和属性内容相分离。同时类的类型注释与对象类似，其既可以对类自身属性做类型检测，也可以对构造函数的参数进行类型检测。

``` js
// @flow
class Foo {
  x: string;
  y: string | number; // y 可以是字符串或者数字

  constructor(x: string, y: string | number) {
    this.x = x
    this.y = y
  }
}

type objType = {
  a: string,
  b: Array<number>,
  c: Foo
}

var obj: objType= {
  a: 'hello',
  b: [1, 2],
  d: new Foo('hello', 3)
}
```

#### 变量可选类型和对象可选属性

```js
// @flow

var a: ?string = undefined;

var obj = {
  b?: number,
  c: boolean
}
```

其中若想  `?T`  代表变量除了规定的类型之外，还可以为 `null` 或者 `undefined` 。而对象中问号在属性名后，冒号前代表该对象可以没有这个属性，但是如果存在这个属性，就必须为规定的 number 类型。

基本上常用的几种类型注释就是上面几种，如果想要了解更多的类型，请移步[官方文档](https://flow.org/en/docs/types/)。