# 架构设计和项目结构

## 目录结构

`Vue.js` 源码目录结构主要如下所示：

```js
|-- dist              # 构建后的文件
|-- flow              # flow 的类型声明，类似于 TypeScipt
|-- packages          # 单独的 NPM 包发布，例如 vue-server-renderer 和 vue-template-compiler
|-- scripts           # 构建相关的脚本和配置文件
|-- test              # 端到端测试和单元测试用例
|-- src               # 源代码
|   |-- compiler      # 编译相关代码
|   |-- core          # 核心代码，与平台无关的运行时代码
|   |-- platforms     # 跨平台代码
|   |-- server        # 服务端渲染相关代码
|   |-- sfc           # .vue文件解析逻辑
|   |-- shared        # 工具函数/共享代码
|-- types
		|-- test          # 类型定义测试
```

- `dist` 目录存放经 Rollup 构建之后的相关文件，在这个目录里面会有很多不同的 Vue.js 构建版本，其中就包括完整版 `runtime + compiler` 和 `runtime-only` 版本，两者的主要差别后面将会说明。

- `packages` 目录中包含 `vue-server-render` 和 `vue-template-compiler` ，将会在构建的时候自动从源码中生成，并始终与 `Vue.js` 保持相同版本。前一个包服务端渲染会用到，后一个包在我们通过脚手架生成项目，使用 `.vue` 文件进行开发的时候会用到。

- `scripts` 主要是 `Rollup` 构建配置及相关脚本文件，可以针对不同的环境构建不同的版本。

- `src/compiler` 包含编译相关代码，主要是将模板解析成 AST，然后遍历 AST 语法树标记静态节点相关优化，最后生成代码。当使用 `vue-loader` 和 `vueify` 进行构建的时候，会将 `*.vue` 文件内部的模板进行编译，因此使用 `runtime-only` 版本即可，同时其比完整版的的体积要小，因此推荐使用 `runtime-only` 版本进行开发，两者区别如下所示：

  ```js
  // runtime + compiler
  new Vue({
  	data() {
  		hi: 'hello'
  	},
  	template: `<div>{{ hi }}</div>`
  })
  
  // runtime-only
  new Vue({
  	data() {
  		hi: 'hello'
  	},
  	render(h) {
  		return h('div', this.hi)
  	}
  })
  ```

  如果希望使用完整版，则需要在打包工具中进行如下设置：

  ```js
  // for webpack
  module.exports = {
  	resolve: {
  		alias: {
  			'vue$': 'vue/dis/vue.esm.js'
  		}
  	}
  }
  ```

- `src/core` 是 `Vue.js` 的核心代码，这部分代码逻辑与平台无关，主要是响应式、虚拟 `DOM` 、全局 `API` 、内置组件 `keep-alive` 相关

  ```js
  |-- core
  |   |-- components      # 内置组件 keep-alive
  |   |-- global-api      # 全局API
  |   |-- instance        # Vue 构造函数及原型方法
  |   |-- observer        # 响应式
  |   |-- util            # 工具函数
  |   |-- vdom            # 虚拟DOM
  ```

## 架构相关

上面主要介绍了 `Vue.js` 的目录结构，下面主要主要展示其整体结构，主要分为三个部分：核心代码、跨平台相关和公用工具函数。

![architect](/vue/architect.png)

以构建 Web 平台下运行文件为例，如果我们构建的是完整版本，首先会从 Web 平台入口开始构建，这个入口文件最终会导出一个 Vue 的构造函数。在导出之前，会向 Vue 构造函数里面添加一些方法，其流程是现在其原型 prototype 上添加一些方法，其次在构造函数自身添加一些全局 API，接着将平台特有的代码导入，最后将编译器导入进来，最终将所有的代码连同 Vue 构造函数一起导出去。