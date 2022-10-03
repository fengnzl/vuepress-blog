# 从零搭建脚手架之 Lerna 和 Yargs

> 本文主要介绍 Lerna 及 Yargs 使用。首先我们来看原生脚手架开发时的痛点：

- 痛点一：重复操作
  - 多Package本地link
  - 多Package依赖安装
  - 多Package单元测试
  - 多Package代码提交
  - 多Package代码发布
- 痛点二：版本一致性
  - 发布时版本一致性
  - 发布后相互依赖版本升级

且管理复杂度随着 package 的增多而增高。

## Lerna 

> Lerna is a tool that optimizes the workflow around managing multi-package repositories with git and npm.

Lerna 是一个基于 git 和 npm 的多 package 项目的优化流程的管理工具。

通过 Lerna 我们可以大幅减少重复工作，使操作更加标准化。Lerna 是架构优化的产物，其出现表明：当项目复杂度提升之后，就需要对项目进行架构优化，而目标往往都是以效能为核心。

### 开发流程

![lerna-workflow](/scaffold/lerna-workflow.png)

### 常用命令

- `lerna init`:

  会自动完成`git`初始化，并创建 lerna.json 文件

- `lerna create`:

  ```js
  lerna add <module> [loc]
  ```

  为了可以安装在指定的路径，我们需要在 `learna.json` 文件中设置 `packages` 字段，否则默认安装到 `core` 目录下

  ```json
  {
    "packages": [
      "core/*",
      "utils/*",
      "models/*",
      "commands/*"
    ],
    "version": "0.0.0"
  }
  ```

- `lerna add`：

  - 第一个参数：添加npm包名
  - 第二个参数：本地package的路径
  - 选项：
    - `--dev`：将依赖安装到`devDependencies`，不加时安装到`dependencies`

  ```bash
  lerna add <package> [loc] --dev
  ```

- `lerna link`：

  如果未发布上线，需要手动将依赖添加到`package.json`，再执行`npm link`

- `lerna clean`：

  只会删除`node_modules`，不会删除`package.json`中的依赖

- `lerna exec`和`lerna run`：

  `--scope`属性后添加的是包名，而不是`package`的路径，这点和`lerna add`用法不同

- `lerna publish`

  - 发布时会自动执行：`git add package-lock.json`，所以package-lock.json不要加入`.gitignore`文件
  - 先创建远程仓库，并且同步一次master分支
  - 执行`lerna publish`前先完成`npm login`
  - 如果发布的npm包名为：`@xxx/yyy`的格式，需要先在npm注册名为：xxx的organization，否则可能会提交不成功
  - 发布到`npm group`时默认为private，所以我们需要手动在`package.json`中添加如下设置

```json
"publishConfig":{
  "access":"public"
}
```

**建议:** 在搭建脚手架，内部相关的库互相引用时，建议通过如下方式进行配置，然后 `npm install` 安装，这样最后在根目录发布脚手架时就无需 各种`npm unlink` 操作，直接 `lerna publish` 即可， lerna 会帮我们分析相关依赖关系。

```json
"dependencies": {
    "@recovery-test/util": "file:../util"
  },
```

## Yargs

> Yargs helps you build interactive command line tools, by parsing arguments and generating an elegant user interface.

Yargs 用于帮助构建交互式命令行的工具，它会解析命令行参数，并生成一个美观的用户界面。

其基本用法如下所示，建议配置一个命令即可观察其具体效果。

```js
#!/usr/bin/env node

const dedent = require("dedent");
const yargs = require("yargs/yargs");
const pkg = require('./package.json')
const {
  hideBin
} = require("yargs/helpers");
const arg = hideBin(process.argv);
//console.log(arg); // recovery-test --help 则为['--help']

const context = {
  recoveryTestVersion: pkg.version
}

const globalOptions = (yargs) => {
  const opt = {
    debug: {
      type: 'boolean',
      describe: 'Bootstrap debug mode',
      alias: 'd'
    },
    devtool: {
      type: 'boolean',
      describe: 'Devtool mode',
      alias: 't'
    }
  }

  // 将其统一添加到 global options 组下
  const globalKeys = Object.keys(opt).concat(['help', 'version'])

  return yargs.options(opt).group(globalKeys, 'Global Options')
}

// 如果调用 yargs 时就传递参数，则最后调用需要增加 .argv
// const cli = yargs(arg);
// const cli = yargs(process.argv.slice(2))
// 如果要增加自定义参数在调用中，则 yargs() 不传递参数，最后链式调用改为.parse(argv, userParam)
const cli  = yargs()

// 配置 底部提示信息 dedent 用于去除缩进 换行则保留
globalOptions(cli)
  // 配置第一行的使用提示
  .usage("Usage: $0 <command> [options]")
  //配置提示用户使用脚手架时至少接收一个命令
  .demandCommand(
    1,
    "A command is required. Pass --help to see all available commands and options."
  )
  // 没有匹配的命令会提供相近的命令提示
  .recommendCommands()
  // 配置严格模式，无法识别的命令也将报错，在不配置demandCommand 的情况下
  // 输入 recovery-test --aa 则提示：无法识别的选项 aa
  .strict()
  .fail((msg, err) => {
    console.log(msg);
  })
  // 给命令设置别名，默认存在 --help 和 --version 命令
  .alias("h", "help")
  .alias("v", "version")
  // 设置提示信息的宽度，可以设置数字  这里是终端的宽度
  .wrap(cli.terminalWidth())
  // 配置 registory 命令
  .option("registory", {
    type: "string",
    describe: "Define registory url",
    alias: "r",
  })
  .group(["registory"], "Extra Options")
  // 配置隐藏命令，可以开发的时候使用
  .option("ci", {
    type: "boolean",
    hidden: true,
  })
  // 配置命令的两种方法
  .command(
    "init [name]",
    "Do init a project",
    (yargs) => {
      yargs.option("name", {
        type: "string",
        describe: "name of project",
        alias: "n",
      });
    },
    (argv) => {
      console.log(argv);
    }
  )
  .command({
    command: "list",
    aliases: ["ls", 'll', 'la'],
    describe: 'list local package',
    builder (yargs) { },
    handler (argv) {
      console.log(argv)
    }
  }).epilogue(dedent`
    When a command fails, all logs are written to lerna-debug.log in the current working directory.

    For more information, find our manual at https://github.com/lerna/lerna
  `)
  // 初始调用不传递参数，最后解析
  .parse(process.argv.slice(2), context)
  // 初始调用传递 argv
  // .argv;
```

