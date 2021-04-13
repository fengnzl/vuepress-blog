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

## defineReactive

在介绍玩代理之后，我们来介绍其响应式实现 `defineReactive`，其功能主要是动态添加对象的 getter 和 setter，关于响应式相关的代码都定义在 `src/core/observe` 目录下，其中 `defineReactive`  就定义在其入口文件 `index.js` 文件中。

```js
/**
 * Define a reactive property on an Object.
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}
```

`defineReactive` 函数最初初始化`Dep` 实例（用来管理依赖），然后获取其属性原始的 `getter` 和 `setter` 函数，然后调用 `observe` 函数，从而保证其子属性也能变成响应式对象，最后通过 `Object.defineProperty` 给对象的属性添加 `getter` 和 `setter` 函数，从而进行依赖收集和派发更新。后面将会详细介绍。

## observe 和 Observe

在 `defineReactive` 函数中，我们可以看到 `observe(val)` 函数，接下来我们就会介绍 `observe` 方法和 `Observe` 类。其中 `observe` 方法与 `defineReactive` 函数在同一个文件中，代码如下所示：

```js
/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}
```

这里首先对 `value` 进行了类型判断，如果不是对象或者是 `VNode` 实例，则不做任何处理，`isObject` 方法实现如下所示：

```js
export function isObject (obj: mixed): boolean %checks {
  return obj !== null && typeof obj === 'object'
}
```

在做完上述判断之后，会对 `value` 进一步判断是否有 `__ob__` 属性，并且该属性是否是 `Observe` 的实例，如果存在，说明该属性已经是响应式对象，那么直接返回已有的 `Observe` 实例。

```js
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj: Object | Array<*>, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}
```

之后会判断如果不是组件实例、服务端渲染、对象可扩展、需要转换成响应式，且为普通对象或者数组的话，则实例化一个 `Observer` 对象实例。其中 `isPlainObject` 函数实现如下：

```js
export function isPlainObject (obj: any): boolean {
  return _toString.call(obj) === '[object Object]'
}
```

之后判断如果是根数据且存在 `Observer` 实例，则将该实例实例上的 `vmCount` 属性自增，代表该实例被创建的次数。最后返回实例。

接下来我们来分析 `Observe` 类的实现：

```js
/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
 /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}
```

其主要是对对象的属性添加 `getter` 和 `setter` 函数，从而实现对象的响应式。

首先实例化了一个 `Dep` 对象（用于管理依赖），稍后会进行介绍，然后调用了 `def` 函数，将自身实例添加到 `value` 对象属性 `__ob__` 的同时，也将其设置成不可遍历。`def` 的定义在 `src/core/util/lang.js` 中：

```js
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}
```

之后则判断 `value` 不是数组，则调用 `walk` 方法，对对象每个属性执行 `defineReactive` 函数，在这里我们会调用 `observe` 函数，如果该属性仍然是一个对象，且满足之前描述的条件，那么会对这个字对象进行 `Observe` 的实例化，如此达到对对象属性递归调用创建响应式的过程。

如果是数组，则会先判断是否可以使用 `__proto__` 属性，然后分别对数组进行不同的操作，`hasProto`是定义在`src/core/util/env.js`文件中的一个常量：

```js
export const hasProto = '__proto__' in {}
```

因为 Vue 是通过 getter/setter 来实现对象的侦测，但是对于原始数组方法如 `push` 等操作数组时，并不会添加 `getter/setter` 方法，因此需要我们用自定义方法来覆盖原生的原型方法，从而达到对该方法的拦截，实现监听。

`Vue` 中对数组七种可以改变自身数组的方法提供了变异方法支持，也就是覆盖了原型的该方法，这七种方法为：

```js
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
```

这七种方法的处理过程在 `src/core/ovserver/array.js ` 文件中，如下所示：

```js
/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    ob.dep.notify()
    return result
  })
})

```

首先我们，根据数组原型创建了一个新的对象，然后通过 `def` 函数来重新定义上述的七种方法，首先调用原始方法，然后获取新增数组，并对新增的数据调用 `observeArray` 方法来实现响应式处理，最后进行依赖通知。

所以当创建 `Observe` 实例时，如果是数组且当前环境支持对象的 `__proto__` 属性，我们就调用 `protoAugment(value, arrayMethods) `方法来覆盖其原型方法：

```js
function protoAugment (target, src: Object) {
  target.__proto__ = src
}
```

否则我们通过 ` copyAugment(value, arrayMethods, arrayKeys)` 方法来实现原型的覆盖：

```js
const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}
```

对数组方法完成劫持之后，将数组中的对象和数组也变成响应式，那么就是 `observeArray ` 来实现的，具体如下：

```js
observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
```

