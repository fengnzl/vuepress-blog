# 从零搭建脚手架之准备工作

## 整体结构

脚手架架构图如下所示：

![cli-constructor](/scaffold/cli-constructor.png)

根据以上架构图可知，脚手架主要分为以下四个模块

- 核心模块：core
- 命令模块：commands
  - 初始化
  - 发布
  - 缓存清除
- 模型模块：models
  - Command 命令
  - Project 项目
  - Component 组件
  - Npm 模块
  - Git 仓库
- 支撑模块：utils
  - Git 操作
  - 云构建
  - API 请求

## 准备过程

脚手架准备阶段主要分为以下步骤：

- 检测脚手架版本号
- 检测 node 版本
- 检查 root 账户及降级权限
- 检查用户主目录
- 入参检查及 Debug 模式开发
- 检查环境变量
- 检查新版本及提示更新

### 自定义 log 方法

首先我们在新建文件夹下通过 npm 和 lerna 初始化之后，修改 lerna.json 文件中的相关字段

```json
"packages": [
  "core/*",
  "utils/*",
  "models/*",
  "commands/*"
],
```

之后我们首先通过 `lerna create log utils` 命令在 utils 文件夹下新增辅助 log 模块，之后通过 `lerna add npmlog utils/log` 安装 npmlog 包，经过相关自定义之后，导出即可，主要代码如下所示：

```js
'use strict';

const log = require('npmlog')

// 设置提示等级
log.level = process.env.LOG_LEVEL ? rocess.env.LOG_LEVEL : 'info'

// log信息自定义前缀
log.heading = 'test-cli'
// 自定义heading 样式 fg 字体样式  bg 背景颜色
log.headingStyle = { fg: 'black', bg: 'white' }

// 添加自定义success 命令
log.addLevel('success', 2000, { fg: 'green', bold: true })

module.exports = {
  log
};
```

### 脚手架执行文件处理

我们首先通过 `lerna create cli core` 在 core 目录增加 cli 模块，之后在其 package.json 文件中增加 bin 字段并引入自定义 log 模块

```json
"bin": {
  "test-cli": "bin/index.js"
},
"dependencies": {
  "@test-cli/log": "file:../../utils/log"
},
```

之后在该目录下执行 `npm install` 和 `npm link` 将引入的仓库安装，并将 `test-cli` 命令注册为全局命令，之后我们在命令的入口文件判断如果全局 node_modules 和本地 node_modules 都存在该包，则优先使用本地包，并进行提示。

```js
// bin/index.js
#!/usr/bin/env  node

const importLocal = require('import-local')

if (importLocal(__filename)) {
  require('@test-cli/log').info('cli', 'using local version of test-cli')
} else {
  require('../lib')(process.argv.slice(2))
}
```

### 检测脚手架版本号

之后我们在 lib/inde.js 文件中检测脚手架版本号，如下所示：

```js
'use strict';

const { log } = require('@test-cli/log')
const pkg = require('../package.json')

function core () {
  checkVersion()
}

function checkVersion () {
  log.notice('cli', pkg.version)
}

module.exports = core
```

### 检测 node 版本号

通过 process.version 可以获取当前 node 版本，我们可以在 lib/const.js 中自定义脚手架所需 node 的最低版本，并通过 semver 包来比较两个版本号并给出相应的提示，首先我们通过 `npm install chalk` 来安装 chalk 包，用于终端输出美化。

**注**：由于当前 lerna 问题，通过 `lerna add pkg [loc]` 的方式安装之后，还需进入该模块下执行 `npm install` 才可正常引入该包，因此我们直接在该模块下通过 `npm install pkg` 的形式来引入。

```js
//lib/const.js
const LOWEST_NODE_VERSION = 'v16.0.0'
module.exports = {
  LOWEST_NODE_VERSION
}

//lib/index.js
'use strict';
const chalk = require('chalk')
const semver = require('semver')
const { LOWEST_NODE_VERSION } = require('./const')
function core () {
  try {
    ...
    checkNodeVersion()
  } catch (e) {
    log.error(e.message)
  } 
}

function checkNodeVersion () {
  const currentVersion = process.version
  if (!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
    throw new Error(chalk.red(`current node version is ${currentVersion}, the lowest required node version is ${LOWEST_NODE_VERSION}, please ungrade node`))
  }
}
```

执行 `test-cli` 命令，我们可以得到以下提示信息：

![node-version](/scaffold/node-version.png)

### 检查 root 账户及降级权限

在创建项目的时候，我们需要避免使用 root 账户取创建，如果使用 root 账户创建，那么将自动将账户进行降级，因为使用 root 账户创建的文件，其他账号将无法进行更改。

我们可以通过 `process.getuid()` 来获取账号权限，在 Mac 下其值为 501，通过 sudo 执行的命令则为 0，这里我们通过 root-check包来实现用户权限的降级。

```js
// 经过 root-check 处理后，在使用 sudo 执行，结果就是 501
// 原理：通过 process.setuid 、 process.setgid 来动态修改了用户及其分组的权限
function checkRoot() {
    const rootCheck = require('root-check');
    rootCheck()
    console.log(process.geteuid()) // 501
}
```

### 检查用户主目录

获取用户的主目录，并检测该目录是否存在

```js
const { homedir } = require('os')
const fs = require('fs')
function checkUserHome () {
  const homeDirName = homedir()
  if (!homeDirName || !fs.existsSync(homeDirName)) {
    throw new Error('The current user home directory does not exist')
  }
}
```

### 获取入参及开启 debug 模式

我们可以通过 `minimist` 来将入参转换为对象形式，具体可[查看文档](https://www.npmjs.com/package/minimist)

```js
function checkInputArgs () {
  const argv = require("minimist")(process.argv.slice(2));
  console.log(argv)
  log.level = argv.debug ? 'verbose' : 'info'
}
```

这时我们运行命令的时候，添加 `--debug`  即可开启调试模式。
