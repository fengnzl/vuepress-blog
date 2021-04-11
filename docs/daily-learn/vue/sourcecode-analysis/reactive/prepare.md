# 响应式对象

想必大家都知道 `Vue2` 中通过 `Object.defineProperty` 来实现其数据变化侦测原理的，这也是其不支持 IE8 浏览器的原因，知道了 `Object.defineProperty` 方法，那么我们可以写出以下函数。

## Object.defineProperty

```js
function defineReactive (target, key, val) {
  Object.defineProperty(target, key, {
    enumerable: true,
    configurable: true,
    get () {
      return val
    },
    set (newVal) {
      if (val === newVal) {
        return
      }
      val = newVal
    }
  })
}
```

这里我们对 `Object.defineProperty` 进行了简单的封装。从名字我们可以看出其作用是为了定义一个响应式数据，但上述代码其实并没有实际作用。我们希望在数据属性发生变化之后，可以通知到使用这个属性的地方。因此我们需要**在 getter 函数中收集依赖，在 setter 函数中派发更新**。

### initState

在 `Vue` 实例化时，会把 `props`、`data` 和 `computed` 等对象变为响应式，其过程主要是在实例化时，调用的 `this._init` 方法中的 `initState(vm)` 中，其所在文件为 `src/core/instance/state` 。

```js
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

这里我们为了阐述响应式过程，会简单介绍 `props` 的处理过程，后面讲解生命周期时，会详细介绍其中的处理过程。首先我们来看 `initProps` 是如何处理 `props` 相关的逻辑的：

```js
function initProps (vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}
```

上面主要做了三件事：遍历配置通过 ` validateProp` 对 `prop` 校验求值、`defineReactive` 方法实现 `prop` 的响应式、通过 `proxy` 方法将 `vm._props.xxx` 访问代理到 `vm.xxx` 上。

## Proxy 代理

上面提到的 `proxy` 方法所在文件与上述提到的 `initState` 方法在同一文件中，代码如下

```js
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```

其作用主要是将 `prop` 和 `data` 上的属性代理到 `vm` 实例上，通过 `Object.defineProperty` 方法将 `target[sourcekey][key]` 的读写变为 `target[key]` 的读写，从而对于 `vm._props.xxx` 我们可以通过 `vm.xxx` 来进行读写，对于 `data` 中定义的数据也是如此。如我们可以这样访问 `props` 和 `data`。



