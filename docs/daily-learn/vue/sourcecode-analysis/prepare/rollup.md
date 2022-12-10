# 认识 Rollup

> Rollup 是一个 JavaScript 模块打包器，可以将小块代码编译成大块复杂的代码，例如 library 或应用程序。Rollup 对代码模块使用新的标准化格式，这些标准都包含在 JavaScript 的 ES6 版本中，而不是以前的特殊解决方案，如 CommonJS 和 AMD。ES6 模块可以使你自由、无缝地使用你最喜爱的 library 中那些最有用独立函数，而你的项目不必携带其他未使用的代码。ES6 模块最终还是要由浏览器原生实现，但当前 Rollup 可以使你提前体验。 — [官方文档](https://chenshenhai.github.io/rollupjs-note/note/chapter00/01.html)

由于 Vue.js 、React 等知名框架都会使用 Rollup 来进行打包，因此在学习其相关源码，或者自己编写小工具等，Rollup 的学习都是非常重要的。

## 快速开始

首先我们可以通过以下命令进行全局安装：

```js
npm i rollup -g
```

安装成功后我们就可以在命令行中使用 `rollup` 命令了，在没有传递参数的情况下，这与运行 `rollup --help` 和 `rollup -h` 的效果是一样的。

虽然我们可以直接使用 `rollup` 相关命令完成打包的基本操作，但是我们一般不会直接这么使用，因为命令行功能单一且无法使用插件，因此我们一般使用配置文件来操作。

### 快速配置文件

我们主要以最基本的配置文件，来编译 ES6 文件。文件目录如图所示：

``` bash
├── build # 编译脚本
│   └── rollup.config.js
├── dist # 编译结果
│   └── index.js
├── package.json
└── src # ES6源码
    └── index.js
```

然后我们需要在该目录下安装如下两个插件

```js
npm i -D rollup  @rollup/plugin-buble
```

其中 `@rollup/plugin-buble` 是 rollup 的 ES6 编译插件，类似于简化版的 `babel` 我们用的是 `-D` 而不是 `-S`，因为代码实际执行时不依赖这个插件——只是在打包时使用。

 我们在 `build/rollup.config.js` 文件中编写相关的配置：

```js
const path = require('path');
const bubble = require('@rollup/plugin-buble');

const resolve = filePath => path.join(__dirname, '..', filePath);

export default {
  input: resolve('src/index.js'),
  output: [
    {
      file: resolve('dist/index.js'),
      format: 'iife', // 生成包的格式
      banner: '// welcome to fengnzl.github.io', // 文件头部添加的内容
      footer: '// powered by fengnzl' // 文件末尾添加的内容
    }
  ],
  plugins: [
    bubble()
  ]
}
```

其中 input表示入口文件的路径，output表示输出文件的内容，它允许传入一个对象或一个数组，当为数组时，依次输出多个文件。相关配置请移步[官方文档]([https://www.rollupjs.com/guide/big-list-of-options/#%E6%A0%B8%E5%BF%83%E5%8A%9F%E8%83%BDcore-functionality](https://www.rollupjs.com/guide/big-list-of-options/#核心功能core-functionality))。

然后我们在 package.json 文件中配置如下命令：

``` json
 "scripts": {
    "build": "node_modules/.bin/rollup -c build/rollup.config.js"
  },
```

### 编译代码

首先我们在 `src/index.js` 文件中编写如下测试代码：

```js
const arr1 = [1, 2];
const arr2 = [3, 4];

const arr = [...arr1, arr2];

console.log(arr);
```

然后执行 `npm run build` 即可在 dist 文件夹中看到编译的文件，内容如下：

```javascript
// welcome to fengnzl.github.io
(function () {
	'use strict';

	var arr1 = [1, 2];
	var arr2 = [3, 4];

	var arr = arr1.concat( arr2);

	console.log(arr);

}());
// powered by fengnzl
```

## JavaScript API 打包

我们可以利用 Rollup.js 的 API，从而实现实现一些个性化的打包方式，这里我们新建一个打包文件 `build/build.js` ，其代码如下：

```js
const rollup = require('rollup');
const config = require('./rollup.config');

const inputOptions = config;
const outputOptions = config.output;

async function build (inputOptions, outputOptions) {
  // create a bundle
  const bundle = await rollup.rollup(inputOptions); // 根据 input 配置进行打包

  console.log(`[INFO] 开始编译 ${inputOptions.input}`);

  // generate code and a sourcemap
  const { code, map } = await bundle.generate(outputOptions);

  console.log(`[SUCCESS] 编译结束 ${outputOptions.file}`);

  // or write the bundle to disk
  await bundle.write(outputOptions); // 根据 output 输出文件

  console.log(`${outputOptions.file}生成成功！`)
}

(async function () {
  for (let i = 0; i < outputOptions.length; i++) {
    await build(inputOptions, outputOptions[i])
  }
})()
```

这里面主要使用三个 Rollup.js 的 API :

- `rollup.rollup(inputOptions)`得到打包对象
- `rollup.write(outputOptions)` 输出打包文件

由于 `rollup.rollup` 会返回一个 Promise 对象，因此我们可以是使用 async 和 await 来依次打印打包的文件。

我们先在 `package.json` 文件中进行如下配置：

```json
"scripts": {
    "node-build": "node build/build.js"
  },
```

然后执行 `npm run node-build` 即可在命令行中看到文件打包时的效果：

``` bash
[INFO] 开始编译 rollup-test\src\index.js
[SUCCESS] 编译结束 rollup-test\dist\index-es.js
rollup-test\dist\index-es.js生成成功！
```

这里主要是简单介绍了 Rollup.js 的基本打包的知识，因为本系列主要是分析 Vue 2.X 的源码，后续如果需要更多知识请查阅[官方文档](https://www.rollupjs.com/guide/introduction/)。

参考资料：

- [Rollup.js 实战学习笔记](https://chenshenhai.github.io/rollupjs-note/)
- [10分钟快速入门rollup.js](https://www.imooc.com/article/262083)