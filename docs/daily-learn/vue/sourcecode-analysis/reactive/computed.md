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

