# 从零搭建一个脚手架（一）

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
ln -s ./vue vue2

// 创建之后
lrwxr-xr-x  1 xxx  admin    39B  2  7 23:56 vue -> ../lib/node_modules/@vue/cli/bin/vue.js
lrwxr-xr-x  1 xxx  admin     5B  5  3 01:11 vue2 -> ./vue
```

脚手架执行全过程流程图

![scaffol-run](/scaffold/scaffold-run.png)