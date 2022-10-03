# 通过 PNPM workspaces 创建 Monorepo 并使用 Nx 加速！

::: tip

\* 原文：[Setup a Monorepo with PNPM workspaces and speed it up with Nx!](https://blog.nrwl.io/setup-a-monorepo-with-pnpm-workspaces-and-speed-it-up-with-nx-bc5d97258a7e)

\* 作者：[Juri Strumpflohner](https://medium.com/@juristr)

\* 翻译：[城南花已开](https://recoverymonster.github.io/)

:::
我们将学习如何使用PNPM运行命令,如何并行运行它们,最后我们将添加Nx以实现更复杂的任务调度

在本篇文章，我们将深入谈到如何使用 [PNPM workspaces](https://pnpm.io/workspaces) 创建新的 monorepo， 该工作区包含一个 Remix 应用和一个基于 React 的库。我们将学习如何使用 PNPM 运行命令，如何并行运行它们，最后我们将添加 Nx 来实现更复杂的任务调度，包括命令缓存等等。

**重要：** 如果你已经对 PNPM workspaces 的创建和配置非常熟悉，请直接跳转到文章末尾 Nx 部分。

**更喜欢实战视频？**


<iframe width="692" height="389" src="https://www.youtube.com/embed/ngdoUQBvAjo" title="Setup a monorepo with PNPM workspaces and add Nx for speed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## 初始化一个新的 PNPM workspaces

开始之前，请先确保你已安装了 PNPM。官方文档[安装页面](https://pnpm.io/installation)有详细的说明。我同时也推荐使用类似 [Volta](https://volta.sh/) 的工具，特别是当你需要处理多个不同的 NPM/PNPM 和 node 版本的时候。

让我们创建一个名为 `pnpm-mono` 的文件夹，cd 进入，然后运行 `pnpm init` 命令生成一个顶层的 `package.json` 文件。这将是我们 PNPM moonorepo 项目的 root `package.json`。

```bash
❯ mkdir pnpm-mono
❯ cd pnpm-mono
❯ pnpm init
```

初始化一个新的 Git 仓库也许会很方便，这样我们就可以在设置过程中提交和备份内容。

```bash
❯ git init
```

现在，我们还需要创建一个 `.gitignore` 文件，从而立刻可以排除类似 `node_modules` 和通用构建输出文件夹等内容。

```
# .gitignore
node_modules
dist
build
```

## 设置 Monorepo 结构

Monorepo 的结构通常与你打算使用它的目的而有所不同。以下是常用的两种目录结构：

- **package centric** 用于开发和发布一套可重复使用的软件包。这在开源世界中很常见的一种设置，可以在诸如 [Angular](https://github.com/angular/angular)，[React](https://github.com/facebook/react)，[Vue](https://github.com/vuejs/vue) 及其他许多仓库中可以看到。这些 repos 的特点是通常具有一个 `packages` 文件夹，并且通常会发布到类似 [NPM](https://www.npmjs.com/) 的公共注册中心。
- **app centric** 主要用于开发应用程序和产品的仓库。这在公司中是一种常见的设置。这些 repos 的特点是拥有 `apps` 和 `packages` 或者 `libs` 文件夹，其中 `apps` 文件夹里面包括可构建和可部署的应用，而 `packages` 和 `libs` 文件夹包含特定于 monorepo 中正在开发的一个或者多个应用程序的库。你仍然可以将其中一些 libs 发布到公共注册中心。

在这篇文章，我们将使用 `app centric` 的方法，演示如何让应用程序从 monorepo 中使用 packages。

在 `pnpm-mono` 文件夹中创建 `apps` 和 `packages` 文件夹：

```bash
❯ mkdir apps packages
```

现在让我们来配置 PNPM 以正确识别 monorepo 工作区。基本上，我们需要在 repository 的根目录下创建一个 `pnpm-workspace.yaml` 文件，定义 monorepo 的结构：

```yaml
# pnpm-workspace.yaml
packages:
  # executable/launchable applications
  - 'apps/*'
  # all packages in subdirs of packages/ and components/
  - 'packages/*'
```

## 添加 Remix 应用程序

现在我们已经完成了添加第一个应用的准备工作。我将选择 [Remix](https://remix.run/) 作为示例，但是你可以选择任意类型的应用，这并不重要：

> 提示： 我们将使用正常的 [Remix 安装和设置过程](https://remix.run/docs/en/v1)，你可以在它们的文档页面找到这些。

因为我们希望 app 在 `apps` 文件夹中，我们需要 `cd` 进入文件夹：

```bash
❯ cd apps
❯ npx create-remix@latest
```

你将会被要求输入应用名称。让我们使用 “my-remix-app”，我们将在这篇文章的后续部分用到它。显然，你可以取一个不同的名称。此外， Remix 设置过程会询问一些问题，以自定义确切的设置。这些特定选项与本文无关，所以您可以随意选择最适合您需求的选项。

现在你拥有了一个 Remix 应用，在 `apps/my-remix-app` 文件夹下或者你自己选取的名称。Remix 已经有一个 `package.json` 文件以及相应的脚本配置：

```json
{
  "private": true,
  "sideEffects": false,
  "scripts": {
    "build": "remix build",
    "dev": "remix dev",
    "start": "remix-serve build"
  },
  ...
}
```

通常，在一个 monorepo 中你想在仓库的根目录下执行命令而不是在文件夹中不断切换。 PNPM 工作区已经有方法可以实现上述操作，只需要一个 `filter` 参数，例如：

```bash
❯ pnpm --filter(-F) <package-name> <command>
```

现在（在本文的编写时），Remix 的默认 `pacakge.json` 文件中没有定义 PNPM 需要运行该包的 `name` 属性。因此，让我们在 `apps/my-remix-app/package.json` 文件中定义一个：

```json
{
  "name": "my-remix-app",
  "private": true,
  "sideEffects": false,
  ...
}
```

你可以通过以下命令在 dev 模式下运行 Remix 应用服务：

```bash
❯ pnpm --filter my-remix-app dev
```

![remix-serve](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20221003181628.png)

## 创建一个共享 UI 库

现在我们设置了我们的应用，让我们来创建一个可以被应用使用的 library package。

```bash
❯ cd packages
❯ mkdir shared-ui
```

下一步，让我们创建一个拥有以下内容的 `package.json` 文件（你也可以可以使用 `pnpm init` 创建，然后进行修改）：

```json
{
  "private": true,
  "name": "shared-ui",
  "description": "Shared UI components",
  "scripts": {},
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
  },
  "devDependencies": {
  }
}
```

注意，我们声明它为 `private` 是因为我们不想将其发布到 NPM 或者其他地方，而只是在我们的工作区本地中进行引用和使用。我还删除了 `version` 属性，因为它没有被用到。

作为技术栈，我选择使用 React(这样可以在 Remix 中使用) 和 Typescript(因为现今它被认为是标准)。让我们在工作区的根目录下安装这些依赖。

```bash
❯ pnpm --filter shared-ui add react
❯ pnpm --filter shared-ui add typescript -D
```

通过在安装命令中传入 `--filter shared-ui`，我们可以将这些 NPM 包本地安装到 `shared-ui` 库中。

> 提示：请注意这可能导致版本冲突如果我们库的 React/Typescript 版本与使用者（如我们的应用）的版本不同。采用[单一版本策略](https://opensource.google/documentation/reference/thirdparty/oneversion)，将包移动到 monorepo 的根目录，是一个可能的解决方案。

我们第一个组件是一个非常简单的 `Button` 组件。因此，我们来创建一个吧：

```tsx
// packages/shared-ui/Button.tsx
export function Button(props: any) {
  return <button onClick={() => props.onClick()}>{props.children}</button>;
}
export default Button;
```

我们同样希望有一个公共 API，可以用来导出组件，以便在 `shared-ui` 外部使用。

```tsx
// packages/shared-ui/index.tsx
export * from './Button';
```

为了方便起见，我们只是使用 Typescript 编译器来编译我们的组件。我们可以使用一些更复杂的配置将多个文件打包在一起，如 Rollup 或者其他你使用的构建工具，但这超出了本文的范围。

为了创建所需要的编译输出，我们需要创建 `packages/shared-ui/tsconfig.json` 文件并添加如下配置：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "allowJs": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "module": "commonjs",
    "outDir": "./dist"
  },
  "include": ["."],
  "exclude": ["dist", "node_modules", "**/*.spec.ts"]
}
```

> 在 monorepo 中，最好的做法是将公共配置抽离到更高一层的配置中（如根目录中），然后再各个项目中去扩展它。这是为了避免各种 monorepo 包中的大量重复。为了方便起见，我把它们都放在了一个地方。

正如你所见， `outDir` 指向本地包的 `dist` 文件夹。因此我们应该在 `shared-ui` 的 `package.json` 文件中添加主入口点。

```json
{
  "private": true,
  "name": "shared-ui",
  "main": "dist/index.js",
}
```

最后，实际的打包包括删除之前打包是创建的文件夹及执行 Typescript 编译器（tsc）。以下是 `packages/shared-ui/package.json` 完整文件。

```json
{
  "private": true,
  "name": "shared-ui",
  "description": "Shared UI components",
  "main": "dist/index.js",
  "scripts": {
    "build": "rm -rf dist && tsc"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "react": "^17.0.2"
  },
  "devDependencies": {
    "typescript": "^4.6.4"
  }
}
```

在 PNPM 工作区的根目录下运行以下命令来执行打包：

```bash
❯ pnpm --filter shared-ui build
```

如果构建成功，你会在 `packages/shared-ui/dist` 文件夹中看到编译的输出。

## 在 Remix 应用中使用我们的 shared-ui 包

我们的 `shared-ui` 库已经准备好了，因此我们可以在 `apps` 中的 Remix 应用中使用它。我们可以在 Remix 应用的 `package.json` 文件中手动添加依赖或者通过 PNPM 添加：

```bash
❯ pnpm --filter my-remix-app add shared-ui --workspace
```

这将会在 `apps/my-remix-app/package.json` 文件中添加依赖：

```json
{
  "name": "my-remix-app",
  "private": true,
  "sideEffects": false,
  ...
  "dependencies": {
    ...
    "shared-ui": "workspace:*"
  },
  ...
}
```

`workspace:*` 表明该包是在工作区本地进行解析的，而不是从一些远程注册中心（如 [NPM](https://www.npmjs.com/)）解析。`*` 简单的表示我们希望依赖于其最新版本，而不是特定的版本。如果你使用的是外部 NPM 包，那么使用特定的版本号是有意义的。

为了使用 `Button` 组件，我们需要在 Remix 一些路由中导入。将 `apps/my-remix-app/app/routes/index.tsx` 中的内容替换如下：

```tsx
// apps/my-remix-app/app/routes/index.tsx
import { Button } from 'shared-ui';
export default function Index() {
  return (
    <div>
      <Button onClick={() => console.log('clicked')}>Click me</Button>
    </div>
  );
}
```

现在如果你重新运行 Remix 应用，你将会看到 button 被渲染。

```bash
❯ pnpm --filter my-remix-app dev
```

如果你遇到如下错误，说明你需要先构建 `shared-ui`

```bash
Error: Cannot find module '/Users/juri/nrwl/content/pnpm-demos/pnpm-mono/apps/my-remix-app/node_modules/shared-ui/dist/index.js'. Please verify that the package.json has a valid "main" entry  
    at tryPackage (node:internal/modules/cjs/loader:353:19)  
    at Function.Module._findPath (node:internal/modules/cjs/loader:566:18)  
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:919:27)  
    at Function.Module._load (node:internal/modules/cjs/loader:778:27)  
    at Module.require (node:internal/modules/cjs/loader:1005:19)  
    at require (node:internal/modules/cjs/helpers:102:18)  
    at Object.<anonymous> (/Users/juri/nrwl/content/pnpm-demos/pnpm-mono/apps/my-remix-app/app/routes/index.tsx:1:24)  
    at Module._compile (node:internal/modules/cjs/loader:1105:14)  
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1159:10)  
    at Module.load (node:internal/modules/cjs/loader:981:32)
```

要构建它，请运行

```bash
❯ pnpm --filter shared-ui build
```

为什么？这是因为引用和解析本地依赖 PNPM 创建的符号连接。通过在 Remix 应用的 `package.json` 文件中 添加 `shared-ui: "workspace:*"`，你指示 PNPM 将软连接添加到 Remix 的 `node_modules` 文件夹中。

![symlink](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20221003200445.png)

## 通过 PNPM 运行命令

PNPM 提供了一些方便的特性，在 monorepo 工作区中运行命令。我们已经看到如何通过 `--filter` 在特定的包上使用命令。

```bash
❯ pnpm --filter my-remix-app dev
```

你同样可以通过 `-r` 标志在工作区中所有的包中递归运行一个命令。假如为所有的项目运行构建命令。

```bash
❯ pnpm run -r build
Scope: 2 of 3 workspace projects
packages/shared-ui build$ rm -rf dist && tsc
└─ Done in 603ms
apps/my-remix-app build$ remix build
│ Building Remix app in production mode...
│ The path "shared-ui" is imported in app/routes/index.tsx but shared-ui is not listed in your package.json 
│ Built in 156ms
└─ Done in 547ms
```

类似的，你可以通过 `--parallel` 并行的运行命令

```bash
❯ pnpm run --parallel -r build
Scope: 2 of 3 workspace projects
apps/my-remix-app build$ remix build
packages/shared-ui build$ rm -rf dist && tsc
apps/my-remix-app build: Building Remix app in production mode...
apps/my-remix-app build: The path "shared-ui" is imported in app/routes/index.tsx but shared-ui is not listed in your package.json dependencies. Did you forget to install it?
apps/my-remix-app build: Built in 176ms
apps/my-remix-app build: Done
packages/shared-ui build: Done
```

## 通过 Nx 加速

PNPM 工作区提供了一些基本的功能，在 monorepo 包中运行任务，甚至是并行。随着 monorepo 的增长，你或许想要一个更加复杂的方法可以执行以下操作：

- 只有在包内容改变的时候才会运行任务
- 根据文件内容的高级缓存，不运行之前已经计算过的任何内容
- 远程分布式缓存以加速 CI

这正是 [Nx](https://nx.dev/) 可以提供帮助的地方。它针对 monorepo 场景进行了优化，并带有高级任务调度机制。我们仍然依赖 PNPM 提供的安装包和包链接机制，但是通过 Nx 来更加高效的运行我们的任务。

## 安装 Nx

由于 [Nx](https://nx.dev/) 将在整个 monorepo 工作区中运行操作，我们将其安装在根目录的 `package.json` 中。

```bash
❯ pnpm add nx -D -w
```

就这样。

## 通过 Nx 运行命令

Nx 通过以下形式运行你的命令：

```bash
❯ npx nx <target> <project>
```

`taget` 是特定情况下你想要执行的 NPM 脚本。
让我们试着运行以下命令来打包 `shared-ui` 包：

```bash
❯ npx nx build shared-ui
```

这会产生以下输出

```bash
> nx run shared-ui:build
> shared-ui@ build /Users/juri/nrwl/content/pnpm-demos/pnpm-mono/packages/shared-ui
> rm -rf dist && tsc
 >  NX   Successfully ran target build for project shared-ui (1s)
```

Nx 自动找到 `shared-ui` 并且执行 `packages/shared-ui/pacakge.json` 文件中定义的 `build` 脚本。

类似的，要启动我们的 Remix 应用，运行 `npx nx dev my-remix-app`。

我们同样可以在跨项目中并行执行命令：

```bash
❯ npx nx run-many --target=build --all
    ✔  nx run my-remix-app:build (1s)
    ✔  nx run shared-ui:build (1s)
 >  NX   Successfully ran target build for 2 projects (1s)
```

或选择特定的项目

```bash
❯ npx nx run-many --target=build --projects=my-remix-app,shared-ui
    ✔  nx run my-remix-app:build (1s)
    ✔  nx run shared-ui:build (1s)
 >  NX   Successfully ran target build for 2 projects (1s)
```

> 注意我用 `npx` 作为命令的前缀，该命令在 `node_modules` 文件夹中 Nx 可执行文件。这样我就不用全局安装 `nx`，如果你更喜欢全局方式，请随意。

## 配置缓存

将 Nx 添加到 PNPM 工作区的一个主要好处是**通过缓存提高速度**。[计算缓存](https://nx.dev/concepts/how-caching-works#computation-caching)是一种收集不同输入(源文件、环境变量、命令标志等)并计算哈希,将其存储在本地文件夹中的特性。当下一次你运行命令的时候，Nx 会寻找匹配的 hash，如果找到则恢复它。这包括恢复终端输出及构建制品（如 `dist` 文件夹中的 JS 文件）。

并非所有操作都可以缓存,只有无副作用的操作可以缓存。例如，如果您运行具有相同输入的操作，它总是可靠的产生相同的输出。如果在执行的命令中调用了一些 API，那么它将无法缓存，因为给定相同的输入参数，API执行的结果可能会有所不同。

为了开启缓存，让我们来配置可以缓存的操作。为此我们在工作区的根目录创建 `nx.json` 文件，并添加以下内容。

```json
// nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test"]
      }
    }
  }
}
```

注意我们在 `cacheableOperations` 数组中指定了 `build` 和 `test`。你可以添加更多的操作如 `linting`。

启用了这个，如果我们第一次运行 Remix 应用构建，那么可以看到跟往常一样，大概需要 1 秒钟。

```bash
❯ npx nx build my-remix-app
> nx run my-remix-app:build
> my-remix-app@ build /Users/juri/nrwl/content/pnpm-demos/pnpm-mono/apps/my-remix-app
> remix build
Building Remix app in production mode...
The path "shared-ui" is imported in app/routes/index.tsx but shared-ui is not listed in your package.json dependencies. Did you forget to install it?
Built in 163ms
 >  NX   Successfully ran target build for project my-remix-app (1s)
```

如果你重新运行同样的命令，它现在将会从缓存中领取，并只需要几毫秒。

```bash
❯ npx nx build my-remix-app
> nx run my-remix-app:build  [existing outputs match the cache, left as is]
> my-remix-app@ build /Users/juri/nrwl/content/pnpm-demos/pnpm-mono/apps/my-remix-app
> remix build
Building Remix app in production mode...
The path "shared-ui" is imported in app/routes/index.tsx but shared-ui is not listed in your package.json dependencies. Did you forget to install it?
Built in 163ms
 >  NX   Successfully ran target build for project my-remix-app (9ms)
Nx read the output from the cache instead of running the command for 1 out of 1 tasks.
```

你可以在终端输出中看到如下提示 “existing outputs match the cache, left as is” 以及在末尾看到 “Nx read the output from the cache instead of running the command for 1 out of 1 tasks.”

适当的缓存可以极大的提升命令的运行时间。如果缓存是远程分布的，它也可以与 CI 的其他开发任务人员机器共享，那么这也将变得更加有用。就 Nx 而言，可以通过 [Nx Cloud](https://nx.dev/nx-cloud/set-up/set-up-caching) 实现，他将每月免费（无需信用卡）可节省 500h/M 和开源项目的无限时间。

## 精细调整缓存

默认情况下，缓存机制将所有[项目级文件作为输入](https://nx.dev/concepts/how-caching-works#source-code-hash-inputs)。我们可能想要根据执行的目标来区分哪些文件正在被考虑。例如：如果只更改了单元测试的规范文件，你可能不希望使构建任务的缓存失效。

为了在我们的示例中说明这一点，运行 `npx nx build my-remix-app` 两次，这样缓存就会被激活。下一步，改变 Remix 项目的 `READEME.md`（`apps/my-remix-app/READEME.md`） 文件。如果你再次构建 Remix 应用可以发现由于 README 文件的改动缓存失效了。这可能并不是期望的操作。

我们可以精细调整缓存，通过在 `nx.json` 文件中添加 `targetDefaults` 节点，然后定义 `build` 目标默认 `input` 应该排除的 `*md` 文件。

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "inputs": ["!{projectRoot}/**/*.md"]
    }
  }
}
```

通过这个改动，MD 文件的变化将不会作为缓存输入的一部分，无论何时运行 `build` 任务。

> 注意所有路径的 globs 都相对于工作区的根目录而言。这样可以避免混淆，因为输入可以在 `packages.json`（[更多细节](https://nx.dev/reference/project-configuration)）中进行项目级别的定义。你可以通过插值变量 `{projectRoot}` 和 `{workspaceRoot}` 来区分路径是针对项目特定文件还是工作区级别的文件。


## 重用 Globs 缓存输入

你还可以更进一步，你可以重用这个 glob 来排除一个假设 `test`目标中的 markdown 文件。你可以通过将 glob 提取到 `namedInputs` 属性来实现这点。

```bash
{
  "tasksRunnerOptions": {
      ...
  },
  "namedInputs": {
    "noMarkdown": ["!{projectRoot}/**/*.md"]
  },
  "targetDefaults": {
    "build": {
      "inputs": ["noMarkdown", "^noMarkdown"]
    },
    "test": {
      "inputs": ["noMarkdown", "^noMarkdown"]
    }
  }
}
```

通过在 `namedInput` 前添加 `^` 表明这个改变同样应用于项目中的任何依赖的更改。

## 定义任务依赖（即构建流水线）

我们先前已经看到当运行 Remix 开发服务，但是在这之前没有编译依赖的 `shared-ui` 包，我们会在运行的时候得到以下错误：

```bash
Error: Cannot find module '/Users/juri/nrwl/content/pnpm-demos/pnpm-mono/apps/my-remix-app/node_modules/shared-ui/dist/index.js'. Please verify that the package.json has a valid "main" entry  
    at tryPackage (node:internal/modules/cjs/loader:353:19)  
    at Function.Module._findPath (node:internal/modules/cjs/loader:566:18)  
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:919:27)  
    at Function.Module._load (node:internal/modules/cjs/loader:778:27)  
    at Module.require (node:internal/modules/cjs/loader:1005:19)  
    at require (node:internal/modules/cjs/helpers:102:18)  
    at Object.<anonymous> (/Users/juri/nrwl/content/pnpm-demos/pnpm-mono/apps/my-remix-app/app/routes/index.tsx:1:24)  
    at Module._compile (node:internal/modules/cjs/loader:1105:14)  
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1159:10)  
    at Module.load (node:internal/modules/cjs/loader:981:32)
```

为了修复它，我们需要先手动构建 `shared-ui`。通常你希望避免如此操作，这就是 Nx 为什么定义了 `targetDefaults`（通常也称为“构建管道”） 的原因。

作为第一个依赖项，我们希望定义当我们在一个项目进行目标构建时，构建目标所依赖的所有项目都应该先执行。我们可以在 `build` 任务定义处新增一个 `dependsOn` 属性。

```bash
{
  "tasksRunnerOptions": {
      ...
  },
  ...
  "targetDefaults": {
    "build": {
      ...
      "dependsOn": ["^build"]
    }
  },
}
```

与我们在 `inputs` 的定义中看到的类似，这里的 `^` 表示目标应该在所有相关的项目上运行。如果删除 `^`，那么将在相同的项目上调用目标。如果您有一个总是需要调用 `prebuild` 步骤的项目，那么这将非常有用。

下一步，我们同样希望对我们的 Remix `dev` 命令定义一个 targetDefault，就像 `build` 命令运行之前所有依赖的包（即 `shared-ui`）会运行。

```bash
{
  "tasksRunnerOptions": {
      ...
  },
  ...
  "targetDefaults": {
    "build": {
      ...
      "dependsOn": ["^build"]
    },
    "dev": {
      "dependsOn": ["^build"]
    }
  },
}
```

下面是完整的 `nx.json` 文件：

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test"]
      }
    }
  },
  "namedInputs": {
    "noMarkdown": ["!{projectRoot}/**/*.md"]
  },
  "targetDefaults": {
    "build": {
      "inputs": ["noMarkdown", "^noMarkdown"],
      "dependsOn": ["^build"]
    },
    "dev": {
      "dependsOn": ["^build"]
    }
  }
}
```

如果我们现在运行 `npx nx build my-remix-app`,我们可以看到 Nx 首先运行依赖项目上的任务,然后才运行我们调用的命令。

![dependsOn](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20221003233123.png)

## 只有变化才运行

除了提供缓存，Nx 同时也允许使用所谓的 “[affected command](https://nx.dev/concepts/affected)“ 在给定的基准分之发生变化时执行。

```bash
❯ npx nx affected:<target>
```

你可以使用工作区中定义的任何目标。例如

- `npx nx affected:build`
- `npx nx affected:test`
- `npx nx affected:lint`
- `npx nx affected:publish`

**这是如何运作的？** Nx 基于 monorepo 工作区中包之间的结构和依赖关系构建了一个项目图，让我们假设是下面的图：

![project-graph](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20221003234925.png)

当我们在某个分支运行 affected 命令，Nx 将所有的提交即相应的更改于基准分支进行比较。默认基准分支是 `main`，但是你可以在 `nx.json` 文件中进行设置：

```bash
{
  "affected": {
    "defaultBase": "main"
  }
}
```

如果 `lib2` 在特性分支上发生了变化，在工作区运行测试命令 `affected:test`，那么只会运行 `lib2` 和 `appB` 上面的测试。

![affected-test](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20221003235400.png)

但是要注意，如果我们运行 `affected:build` 命令，并且在 `nx.json` 中定义了一个依赖的项目需要首先构建(参见 “定义任务依赖” 部分)，那么 `affected:build` 命令将会构建：

- `lib3`
- `lib2`
- `appB`

它将不会构建 `lib1` 和 `appA`。

## 额外功能

除了速度和任务调度方面的改进，我们还通过将 Nx 添加到 PNPM 工作区中获得了一些额外的功能。让我们来探索一下。

## 动态终端输出

PNPM 并行运行任务会导致相当混乱的终端输出。日志很难解析，因为并行执行的不同命令的消息是交错的。

```bash
❯ pnpm run --parallel -r build
Scope: 2 of 3 workspace projects
apps/my-remix-app build$ remix build
packages/shared-ui build$ rm -rf dist && tsc
apps/my-remix-app build: Building Remix app in production mode...
apps/my-remix-app build: The path "shared-ui" is imported in app/routes/index.tsx but shared-ui is not listed in your package.json dependencies. Did you forget to install it?
apps/my-remix-app build: Built in 176ms
apps/my-remix-app build: Done
packages/shared-ui build: Done
```

当使用 Nx 运行任务时,你会得到一个动态终端,它只显示必要的和与当前执行的命令最相关的内容。在使用 Nx 时,运行相同的并行构建任务会得到以下输出：

![build-parallel](https://miro.medium.com/max/1400/1*GbaJL87ZfOpBQm-W6lBheQ.gif)

## 项目图表可视化

```bash
❯ npx nx graph
```

这加载了工作区的项目图的可视化交互，具有一些高级过滤，调试工作区结构等高级功能

![project-graph](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20221004001155.png)

> 作为旁注：你可以在任意的 PNPM 工作区运行项目图表，即使你没有安装 Nx，运行 `npx nx graph` 应该会起作用。

## 结论

我们做到了！下面是我们所覆盖到的一些知识：

- 如何基于 monorepo 工作区设置 PNPM
- 在 PNPM monorepo 中创建一个 Remix 应用和 React 库
- 如何运行不同的 PNPM 命令
- 如何添加 Nx 并在 monorepo 中逐步使用
- 在 PNPM monorepo 中添加 Nx 的好处及功能
  
你可以在 [Nx Recipe GitHub](https://github.com/nrwl/nx-recipes/tree/main/pnpm-workspace) 仓库中找到上述设置的例子。
