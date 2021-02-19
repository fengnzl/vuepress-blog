## Vue 实例入口

在 `src/core/index.js` 我们可以看到如下代码。

```js
import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'

initGlobalAPI(Vue)

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})

Vue.version = '__VERSION__'

export default Vue。
```

首先从 `instance/index` 中导入 Vue，然后在其原型上添加一些属性和方法，由于会先执行导入文件中的代码，因此，我们后面在详细介绍其具体做了什么。我们把目光投向 `instance/index` 文件，可以看到如下代码：

```js
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
```

## initMixin 实现

首先其导入的一系列文件，因此我们需要整体了解下 `instance` 目录文件的大致作用。

```js
|-- instance
|   |-- render-helpers      # render渲染相关的工具函数目录
|   |-- events.js           # 事件处理相关 $on、$emit、$once 等方法
|   |-- init.js             # _init等方法相关
|   |-- inject.js           # inject和provide相关
|   |-- lifecycle.js        # 生命周期相关 $forceUpdate、$destory等
|   |-- proxy.js            # 代理相关
|   |-- render.js           # 渲染相关包括 nextTick _render函数
|   |-- state.js            # 数据状态 data props等相关
|   |-- index.js            # 入口文件
```

这里只是简单介绍了 `instance` 目录各文件的作用，让我们继续来看其入口文件

- 首先定义了 Vue 函数，然后判断在非生产环境下，如果不是使用 `new` 操作符进行访问，则会进行报错提示，如果通过 `new` 操作符调用，则会执行原型上的 `_init` 方法。
- 其次是执行各种 `mixin` 方法，在 Vue 对象或者原型上进行扩展。

这里我们就先弄清楚 `initMixin` 具体做了什么，我们可以在 `init.js` 文件中看到 `initMixin` 方法定义如下：

```js
let uid = 0
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}
```

这里首先在原型定义了 `_init` 方法，从而在 `new` 实例化时可以调用 `this._init（options）` 方法，即：

```js
// 实例化时，会调用this._init()方法。
new Vue({
  data: {
    msg: 'hello world'
  }
})
```

## 整体流程

通过对上述方法进行分析，可知其整体流程如下所示：

![init](/vue/newVue.png)