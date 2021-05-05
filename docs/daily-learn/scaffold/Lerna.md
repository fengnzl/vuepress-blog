# 从零搭建脚手架之 Lerna

> 本文主要介绍 Lerna 使用及其源码的简单分析。首先我们来看原生脚手架开发时的痛点：

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