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

