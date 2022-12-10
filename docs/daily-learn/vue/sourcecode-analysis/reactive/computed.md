# 计算属性

计算属性的处理逻辑是在 `initState` 中，其首先判断在组件中使用了计算属性，那么就初始化计算属性。

```js
// src/core/instance/state.js
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  // ...
  if (opts.computed) initComputed(vm, opts.computed)
}
```

## initComputed

首先我们来看定义的初始化计算属性 `initComputed` 方法

```js
const computedWatcherOptions = { lazy: true }

function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()

  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}
```

- 首先创建 `vm._computedWatchers` 空对象，用与存储当前组件实例所有计算属性的 `watcher` 实例。

- 之后会遍历 `computed`，对所有定义的计算属性进行类型判断，如果是函数类型，那么 `getter` 就为函数，否则是用户自定了 `get/set` 的对象类型，这时获取到计算属性的 `getter` 就为定义的 `get`。如果最终在开发环境没有获取到该计算属性的 `getter`，那么会提示错误信息。

  ```js
  // 计算属性两种形式
  export default {
    data() {
      return {
        age: 23,
        firstName: 'miss',
        lastName: 'st'
      };
    },
    computed: {
      fullName: {
        get() {
          return this.firstName + ' ' + this.lastName
        },
        set(newVal) {
          const names = newValue.split(' ')
          this.firstName = names[0]
          this.lastName = names[names.length - 1]
        }
      },
      realAge() {
        return this.age + 10
      }
    }
  };
  ```

  上述方式获取到计算属性的 `getter` 分别如下所示：

  ```js
  // fullName
  const getter = function(){
  	return this.firstName + ' ' + this.lastName
  }
  
  // realAge
  const getter = function() {
  	return this.age + 10
  }
  ```

- 判断不是服务端渲染的情况下，会在 `vm._computedWatchers` 空对象上保存计算属性的 `Watcher` 实例。

  ```js
  // 其中服务端判断函数位于 src/core/util/env.js
  export const inBrowser = typeof window !== 'undefined'
  export const inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform
  // this needs to be lazy-evaled because vue may be required before
  // vue-server-renderer can set VUE_ENV
  let _isServer
  export const isServerRendering = () => {
    if (_isServer === undefined) {
      /* istanbul ignore if */
      if (!inBrowser && !inWeex && typeof global !== 'undefined') {
        // detect presence of vue-server-renderer and avoid
        // Webpack shimming the process
        _isServer = global['process'] && global['process'].env.VUE_ENV === 'server'
      } else {
        _isServer = false
      }
    }
    return _isServer
  }
  ```

  便利后最终 `vm._computedWatchers` 如下所示：

  ```js
  {
  	fullName: Watcher实例，
  	realAge: Watcher实例
  }
  ```

- 最后如果定义的计算属性尚不在 `vm` 实例上，那么将会调用 `defineComputed(vm, key, userDef)` 方法，否则在开发环境，会判断当前计算属性是否已经在 `data` 和 `props` 中定义，如果已经定义则进行错误提示。

  **注意：**从代码注释我们可以看出，对于子组件中的计算属性已经在 `vm` 上，所以这里将不会再次调用 `defineComputed` 方法，对于子组件来说真正初始化计算属性是在 `Vue.extend` 中，后面组件化章节将会详细介绍。

## defineComputed

接下来我们来看 `defineComputed` 的实现：

```js
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```

首先我们根据不同方法设置的 `computed`，来对 `sharedPropertyDefinition` 的 `get` 和 `set` 赋值，其未初始化状态如下所示

```js
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}
```

在非服务端渲染的情况下，`get` 属性的值通过 `createComputedGetter(key)` 返回值定义，如果 `computed` 是对象类型则其 `get` 为我们自定义的 `getter` 函数，否则是内置的函数，用于开发环境我们更改计算属性值的时候报错提示。`createComputedGetter` 、`defineComputed` 函数均与 `initComputed` 函数定义在同一个文件中。

```js
function createComputedGetter (key) {
  return function computedGetter () {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}
```

我们可以看到 `createComputedGetter` 方法返回了一个函数，当我们访问计算属性时，该方法就会调用，如组件渲染的时候：

```js
<template>
  <div>{{fullName}}</div>
</template>
<script>
//...
computed: {
	fullName: {
      get() {
        return this.firstName + ' ' + this.lastName
      },
      set(newVal) {
        const names = newValue.split(' ')
        this.firstName = names[0]
        this.lastName = names[names.length - 1]
      }
    },
}
</script>
```

当组件渲染，获取 `fullName` 属性的时候，会调用 `computedGetter` 方法，该方法执行时，首先会获取该属性的 `watcher` 实例，如果存在，则判断 `watcher.dirty` 属性，该属性是在实例化 `Watcher` 时赋值的，之前讲到 `initComputed`时，会遍历对计算属性通过 `new Watcher(vm, getter || noop, noop, computedWatcherOptions)`实例化 `Watcher`，其中 `computedWatcherOptions` 为 `{ lazy: true }`，在 `watcher` 构造函数中有：

```js
class Watcher {
	//...
	construtor(vm, expOrFn, cb, options, isRenderWatcher){
	    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy 
    //...
    this.value = this.lazy
      ? undefined
      : this.get()
	}
}
```

由于我们传递的 `lazy` 为 `true`，因此在执行构造函数时，并不会执行 `this.get` 函数来获取计算属性的值。回到之前的 `createComputedGetter` 函数中，当组件渲染获取计算属性时，`watcher.dirty` 条件判断为真，这时会执行 `watcher.evaluate()` 方法，之后会判断 `Dep.target` 如果存在，就进行依赖收集。之前的[文章](https://fengnzl.github.io/daily-learn/vue/sourcecode-analysis/reactive/getters.html#watcher)提到过 `Dep.target` 实际上就是一个 `watcher` 实例，在组件渲染时，它是一个**渲染 `watcher`**，之后会执行 `watcher.depend`，也就是将渲染 `watcher` 收集到当前计算属性 `watcher` 的依赖中，从而后面计算属性发生变化时，页面可以重新渲染。之后 `createComputedGetter` 会返回 `watcher.value` 值。下面我们来看 `watcher.evaluate()`方法的实现

```js
 /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }
```

可以看到其做的事很简单，就是通过调用传递的 `getter` 函数获取计算属性的值，由于当前已对 `data` 和 `props` 进行初始化，已经转换成响应式，因此调用计算属性 `getter` 时，首先会将 `Dep.target` 设置为当前计算属性的 `watcher`，然后会触发 `firstName` 和 `lastName` 的 `getter`，从而对当前计算属性的 `watcher` 收集。

当计算属性 `getter` 求值之后，会将 `dirty` 设置为 `false`，也就是下次执行计算属性的 `getter` 时，其内部属性不会再次进行依赖收集，而是直接返回 `watcher.value`。

## 更新 computed

我们下面来看计算属性的更新过程，仍然以上面的 `fullName` 为例，当我们改变 `firstName`的值时，会触发 `firstName` 的 `setter`，从而会派发更新 `dep.notify`， 根据之前的[派发更新章节](https://fengnzl.github.io/daily-learn/vue/sourcecode-analysis/reactive/setters.html#%E6%B4%BE%E5%8F%91%E6%9B%B4%E6%96%B0%E8%BF%87%E7%A8%8B)可知其内部会依次调用收集到的 `watcher` 实例的 `update` 方法，首先是 `computed watcher`

![computed-watcher](/vue/computed-watcher.png)

```js
class Watcher {
  // 省略其它
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }
}
```

当 `computed watcher` 执行该方法时，只会将 `this.dirty` 设置为 `true`，之后会执行渲染 `watcher` 的 `update` 方法，而该方法会执行 `queueWatcher` 方法，之前派发更新中提到，最后会执行如下方法：

```js
updateComponent = () => {
  vm._update(vm._render(), hydrating)
}
```

该方法会对组件重新渲染，这时会再次读取 `fullName` 的值，这时 `dirty` 的值已经被重置为 `true`，因此会再次执行计算属性的 `getter` 函数，重复上面所述过程。

通过上面分析可知，除了组件首次渲染以及相关响应式依赖发生改变的时候他们才会重新求值，也就是 **计算属性是基于它们的响应式依赖进行缓存的，其本质是一个 lazy Wathcer**