# 从零搭建脚手架之初步认识

开发脚手架的核心目标是：提升研发效能，通过脚手架，我们可以快速初始化一个项目，无需自己从零开始一步步配置，有效提升开发体验。

其核心价值主要是将研发过程：

- 自动化：项目重复代码拷贝/git操作/发布上线操作
- 标准化：项目创建/git flow/发布流程/回滚流程
- 数据化：研发过程数据化、系统化，使得研发过程可量化

## 脚手架简介

脚手架本质是一个操作系统的客户端，它通过命令行执行，比如：

```bash
vue create vue-test
```

上面命令由3个部分组成：

- 主命令：`vue`
- command：`create`
- command 的 params：`vue-test`

## 实现原理

![scaffold-principle](/scaffold/scaffold-principle.png)

脚手架执行原理如下：

- 当我们终端输入 `vue create vue-test`
- 终端解析出 `vue` 命令，并在环境变量找到 `vue` 命令
- 终端根据 `vue` 命令的软链接找到实际文件 `vue.js`
- 通过 node 执行 `vue.js`
- 解析并执行 `command/options`
- 执行完毕，退出命令

以上面的 `vue-cli` 为例，开发脚手架主要有以下步骤：

- 开发 `npm` 项目，该项目中应包含一个 `bin/vue.js` 文件，并将这个项目发布到 `npm`
- 将 `npm` 项目安装到 `node` 的 `lib/node_modules`
- 在 `node` 的 `bin` 目录下配置 `vue` 软连接指向 `lib/node_modules/@vue/cli/bin/vue.js`

这样我们在执行  `vue` 命令的时候就可以找到 `vue.js` 进行执行

**相关问题**

1. 为什么我们全局安装 `@vue/cli` 之后，创建项目却使用的是 `vue`。

   答： 我们可以在全局安装的 `/usr/local/lib/node_modules/@vue/cli` 文件夹中看到 `package.json` 文件中设置的 bin 字段为：

   ```js
   "bin":{
     "vue": "bin/vue.js"
   }
   ```

   bin 项用来指定各个内部命令对应的可执行文件的位置。上面的意思就是 `vue` 命令对应可执行文件为 bin 子目录下的 vue.js。

2. 全局安装 `@vue/cli` 时发生了什么？

   答：全局安装时，首先将 `@vue/vli` 下载到 `/usr/local/lib/node_modules` 文件夹中，之后通过 `package.json` 文件中的 `bin` 字段在 `/usr/local/bin` 中定义 `vue` 命令，及其软链接的 `bin/vue.js` 文件。

3. 执行`vue`命令时发生了什么？为什么`vue`指向一个`js`文件，我们却可以直接通过`vue`命令去执行它？

   答：终端首先在环境变量中寻找 `vue` 指令，相当于执行 `which vue` 命令，如果没有找到该命令，则会提示 `command not found`。如果找到了注册的 `vue` 命令，则会找到其软链接的 `/usr/local/lib/node_modules/@vue/cli/bin/vue.js` 文件，去执行文件中的代码。由于文件中第一行是 `#!/usr/bin/env node`，这行代码告诉系统在环境变量找到 node，并通过 node 来执行该文件。

## 原理进阶

**为什么说脚手架本质是操作系统的客户端？它和我们在 PC 上安装的应用/软件的区别是什么？**

答：node 在 windows 中是 node.exe，在 Mac 中是可执行文件，node 在操作系统中是一个可执行文件，而脚手架的本质是通过 node 执行 JS 文件，因此其本质也是操作系统的客户端。它与 PC 上安装的应用/软件没有区别，都是客户端，一个提供了 GUI 来方便操作，一个是命令行形式操作。

我们如果想为某个命令创建别名，可以在别名上增加软链接指向原命令，如下所示：

```js
ln -s  指向的文件路径(指令) 软连接名称
ln -s ./vue vue2

// 创建之后
lrwxr-xr-x  1 xxx  admin    39B  2  7 23:56 vue -> ../lib/node_modules/@vue/cli/bin/vue.js
lrwxr-xr-x  1 xxx  admin     5B  5  3 01:11 vue2 -> ./vue
```

脚手架执行全过程流程图

![scaffol-run](/scaffold/scaffold-run.png)

## 开发流程

开发一个脚手架最简单的流程如下所示：

1. 创建项目，并使用 `npm init` 初始化项目
2. 创建脚手架入口文件，并在第一行中添加 `#!/usr/bin/env node`
3. 配置 package.json 文件，添加 bin 属性
4. 编写并将脚手架发布

### 开发难点

- 分包：即将复杂的系统分成若干个小模块

- 命令注册：如 vue-cli 中

  ```bash
  vue create
  vue add
  vue invoke
  ```

- 参数解析

  ```bash
  vue command [options] <params>
  ```

  - options 全称：`--version`、`--help`

  - options 简写：`-V`、`-h`

  - 带 params 的 options：`--git initial commit`

  - 帮助文档：

    - global help
      - Usage
      - Options
      - Commands

    示例：`vue` 的帮助信息：

    ```bash
    Usage: vue <command> [options]
    
    Options:
      -V, --version                              output the version number
      -h, --help                                 output usage information
    
    Commands:
      create [options] <app-name>                create a new project powered by vue-cli-service
      add [options] <plugin> [pluginOptions]     install a plugin and invoke its generator in an already created project
      invoke [options] <plugin> [pluginOptions]  invoke the generator of a plugin in an already created project
      inspect [options] [paths...]               inspect the webpack config in a project with vue-cli-service
      serve [options] [entry]                    serve a .js or .vue file in development mode with zero config
      build [options] [entry]                    build a .js or .vue file in production mode with zero config
      ui [options]                               start and open the vue-cli ui
      init [options] <template> <app-name>       generate a project from a remote template (legacy API, requires @vue/cli-init)
      config [options] [value]                   inspect and modify the config
      outdated [options]                         (experimental) check for outdated vue cli service / plugins
      upgrade [options] [plugin-name]            (experimental) upgrade vue cli service / plugins
      migrate [options] [plugin-name]            (experimental) run migrator for an already-installed cli plugin
      info                                       print debugging information about your environment
    
      Run vue <command> --help for detailed usage of given command.
    ```

还有如：

- 命令行交互
- 日志打印
- 命令行文字变色
- 文件处理等

## 简易分包示例及参数解析

首先我们通过 `npm init` 初始化一个 `recovery-cli` 项目，然后在 package.json 文件中添加 `bin` 字段如下：

```json
"bin": {
    "recovery-cli": "bin/index.js"
  },
```

然后我们在该项目下新建 `bin/index.js` 文件，并编写如下代码：

```js
#!/usr/bin/env node

console.log("hello world");
```

为了可以使用 `recovery-cli` 命令，我们可以有如下两种方法：

1. 先通过 `npm publish` 发布，然后 `npm install -g recovery-cli` 全局安装该项目，之后就可以直接使用 `recovery-cli`

2. 在开发中，我们更推荐该方法，通过使用 `npm link` 命令，将 `recovery-cli` 注册到全局命令，然后软链接到本地项目，如下所示：

   ```bash
   // /usr/local/bin 目录中查看命令软链接
   lrwxr-xr-x  1 root  admin    45B  5  3 11:31 recovery-cli -> ../lib/node_modules/recovery-cli/bin/index.js
   // /usr/local/lib/node_modules 目录 
   lrwxr-xr-x   1 root  wheel    55B  5  3 11:31 recovery-cli -> ../../../../Users/fengliu/Desktop/test-cli/recovery-cli
   ```

### 分包示例

我们新建并初始化一个库文件夹 `recovery-lib`，之后在 package.json 文件中 `main` 字段指定该项目的入口文件：

```json
"main": "lib/index.js",
```

然后在该项目 `lib/index.js` 文件中编写如下代码：

```js
function sum(a, b) {
  return a + b;
}

function multi(a, b) {
  return a * b;
}

module.exports = {
  sum,
  multi,
};
```

然后通过在该项目使用 `npm link` 将该模块添加到全局 node_modules 中，这时我们在进入到 `recovery-cli` 主项目中，通过 `npm link recovery-lib` 中，从而将该模块中 node_modules 下指定库文件链接到全局 node_modules 文件夹。同时在主目录中的 package.json 文件中添加如下代码

```json
"dependencies": {
    "recovery-lib": "1.0.0"
  },
```

之后在 `recovery-cli` 主目录下执行 `npm install` 进行依赖安装，并在 `bin/index.js` 文件中，添加如下代码

```js
const { sum, multi } = require("recovery-lib");

console.log("2 + 3 =", sum(2, 3));
console.log("2 * 4 =", multi(2, 4));
```

这时我们运行 `recovery-cli` 命令，可以看到命令行中输出如下代码，即表明简单的分包已经完成：

```
hello world
2 + 3 = 5
2 * 4 = 8
```

### 参数解析

我们首先在 `recovery-cli` 主目录中添加 `bin/command.js` 文件，其中代码如下：

```js
function init({ option, param }) {
  console.log("执行 init 流程", option, param);
}

module.exports = {
  init,
};

```

然后我们在 `bin/index.js` 文件中引入，并进行简单的相关参数解析，代码如下：

```js
const args = process.argv;
const [command, userOption = "", param] = args.slice(2);
if (command) {
  if (commandFun[command]) {
    const option = userOption.replace(/--|-/g, "");
    commandFun[command]({ option, param });
  } else {
    // 如果是全局选型 --version -V
    if (command.startsWith("--") || command.startsWith("-")) {
      const gloabOption = command.replace(/--|-/g, "");
      if (gloabOption === "version" || gloabOption === "V") {
        console.log(version);
      }
      return;
    }
    console.log("无效的命令");
  }
} else {
  console.log("请输入命令");
}
```

然后我们在命令行中，输入以下命令，可以看到输出的结果如下：

```bash
~/Desktop/test-cli/recovery-cli » recovery-cli init --name test
hello world
2 + 3 = 5
2 * 4 = 8
执行 init 流程 name test
~/Desktop/test-cli/recovery-cli » recovery-cli -V
hello world
2 + 3 = 5
2 * 4 = 8
1.0.0
```

以上简单的命令解析已经完成，但实际上的命令及选项和参数远比这个复杂，这里只是简单的模拟。

## 本地 link 流程

**新建&连接本地脚手架**

```bash
mkdir recovery-cli
cd erdan-test
npm init -y
npm link
```

**新建本地库文件并在本地脚手架中使用**

```bash
mkdir recovery-lib
cd recovery-lib
npm init -y
npm link
cd recovery-cli
npm link recovery-lib
```

**取消链接本地库文件**

```bash
cd recovery-lib
npm unlink
cd recovery-cli
# link存在的情况下执行下面这行
npm unlink recovery-lib
# link不存在的情况下删除node_modules
# 从安装发布到远程仓库上的库文件
npm i -S recovery-lib
```

