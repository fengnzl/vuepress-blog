# 变化侦测 API 实现

前面介绍了数据的响应式原理，但是对于对象来说，我们通过 `Object.defineProperty` 来将对象的 key 转换为 `getter` 和 `setter` 的形式来追踪变化，但是这只能追踪一个数据是否被修改，无法追踪新增属性和删除属性。因此 Vue.js 提供了两个 API，分别是 `$set` 和 `$delete` 来处理上述问题。同样的通过索引直接修改数组，将无法捕捉到数组的变动，这时除了使用我们拦截的方法 `splice` 进行设置（也可以修改数组长度），同样可以使用 `$set` 来处理。

## vm.$set

`Vue.set` 和 `vm.$set` 引用的是同一个 `set` 方法，其中 `set` 方法定义在 `core/observe/index.js` 文件中。

```js
/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}
```

- 首先对 `target` 参数进行校验，如果在开发环境下，`target` 未定义或者不是对象和数组，那么会提示错误信息。

  ```js
  // src/shared/util.js
  export function isDef (v: any): boolean %checks {
    return v !== undefined && v !== null
  }
  /**
   * Check if value is primitive.
   */
  export function isPrimitive (value: any): boolean %checks {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      // $flow-disable-line
      typeof value === 'symbol' ||
      typeof value === 'boolean'
    )
  }
  ```

- 随后判断如果 `target` 为数组，且设置的索引是合法的，则先设置 `length` 属性，避免出现传入的索引值大于数组的长度。然后通过数组拦截器中的 `splice` 方法将 `val` 设置到 `target` 中，从而将其转成响应式。

  ```js
  /**
   * Check if val is a valid array index.
   */
  export function isValidArrayIndex (val: any): boolean {
    const n = parseFloat(String(val))
    return n >= 0 && Math.floor(n) === n && isFinite(val)
  }
  ```

- 如果 `key` 已经存在该对象上，说明已经被侦测，那么直接进行赋值修改数据即可。

- 然后根据[文档](https://cn.vuejs.org/v2/api/#Vue-set)，“对象不能是 Vue 实例，或者 Vue 实例的根数据对象”的情况，我们需要通过 `target._isVue` 来判断不是 `Vue` 实例，通过 `target.ob.vmCount` 来判断不是根数据对象（具体可看之前响应式对象中的 [Observe 相关分析](https://fengnzl.github.io/daily-learn/vue/sourcecode-analysis/reactive/prepare.html#observe-%E5%92%8C-observe)）。

- 通过判断 `target` 对象如果不存在 `__ob__` 属性，那么说明其不是响应式的，因此只需直接设置对象上该属性的值即可。

- 上述情况不满足，那么是响应式对象新增属性，这时我们需要通过 `defineReactive` 将该属性转换成响应式，然后派发更新，通知相应依赖进行更新即可，并返回 `val`。

## vm.$delete

由于 `Object.defineProperty` 并不能侦测一个属性在对象中被删除，因此需要一个方法，可以在我们删除属性的同时，会自动向依赖发送消息，这就是该 API 的实现原理。

`Vue.delete` 和 `vm.$delete` 使用的是同一个 `delete` 方法，被定义在 `src/observe/index.js` 文件中。

```js
/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}
```

- 首先同样是判断 `target` 如果不是对象，那么在开发环境会报错。

- 当为数组时，通过调用数组拦截器 `splice` 方法，从而达到自动向依赖发送通知的效果，由于只是删除指定索引位置的元素，因此只需判断索引合法即可。

- 同 `$set` 方法一样，同样该方法不可在 Vue 实例或实例上面的根数据对象使用。

- 如果对象中没有待删除的属性，那么直接返回。

  ```js
  const hasOwnProperty = Object.prototype.hasOwnProperty
  export function hasOwn (obj: Object | Array<*>, key: string): boolean {
    return hasOwnProperty.call(obj, key)
  }
  ```

- 删除对象中的属性，如果该对象不是响应式，那么直接退出函数执行，否则向依赖发送通知。

## watch

用户自定义 `watcher` 可以在组件 `watch` 中定义，也可以使用 `vm.$watch` 来使用，下面我们就来看看他们的关系及区别。

首先组件中 `watch` 中定义的侦测属性初始化发生在 Vue 实例初始化阶段的 `initState` 函数中，在 `src/instance/state.js` 文件中，初始化代码如下：

```js
export function initState (vm: Component) {
	// ...
  const opts = vm.$options
	if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

在处理 `watch` 之前，首先对其进行判断，其中 `nativeWatch` 的代码如下：

```js
// core/util/env.js
// Firefox has a "watch" function on Object.prototype...
export const nativeWatch = ({}).watch
```

之后会调用 `initWatch(vm, opts.watch)` 来初始化 `watch`

```js
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}
```

这里首先对于 `watch` 中属性的值做了判断，如果是数组，那么遍历调用 `createWatcher(vm, key, handler[i])`，否则直接调用 `createWatcher(vm, key, handler[i])`，我们可以按照以下方法来使用：

```js
 export default {
  data() {
    return {
      message: 'Welcome to Vue!',
      nested: {
        a: {
          name: 2
        }
      },
      normal: 'normal',
    };
  },
  watch: {
    message: [
      (newVal) => {
        console.log('first watch')
      },
      (newVal) => {
        console.log('second watch')
      }
    ],
    nested: {
      handler(newVal,oldVal) {
        console.log(newVal, oldVal)
      },
      deep: true,
      immediate: true
    },
    normal(newVal) {
      console.log(newVal)
    }
    
  }
};
```

接着我们来看 `createWatcher` 的具体实现：

```js
function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}
```

- 这里主要是对参数进行处理之后，调用 `vm.$watcher` 函数，即我们平常调用的 API。

- 首先判断 handler 参数是否为普通对象，如上面 `watch` 中的  `nested` 就是对象形式的写法，`initWatch` 后调用该函数时，传递的 hander 即如下形式

  ```js
  {
  	handler(newVal,oldVal) {
      console.log(newVal, oldVal)
    },
    deep: true,
    immediate: true
  }
  ```

  这时我们将 `handler` 赋值给 `options` 变量，然后 `handler` 赋值为真正的回调函数。

  从上面的例子可以看到其它几个变量调用该函数的 handler 则是一个函数。

  ```js
  //src/shared/util.js
  /**
   * Get the raw type string of a value, e.g., [object Object].
   */
  const _toString = Object.prototype.toString
  
  /**
   * Strict object type check. Only returns true
   * for plain JavaScript objects.
   */
  export function isPlainObject (obj: any): boolean {
    return _toString.call(obj) === '[object Object]'
  }
  ```

- 之后对 `handler` 类型进行判断，如果是字符串类型，则赋值为 `vm[handler]`，即我们可以如下使用。

  ```js
  methods: {
      hanlerNameChange(newVal, oldval) {
        //...
      }
    },
    watch: {
      name: 'hanlerNameChange',
    }
  ```

- 最后做完一系列工作，我们就调用 `vm.$watch(expOrFn, handler, options)` 方法，其方法是在 `stateMixin` 中被挂载到原型中的。

### $watch

我们接着来看 `$watch` 方法的实现逻辑：

```js
Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) {
      try {
        cb.call(vm, watcher.value)
      } catch (error) {
        handleError(error, vm, `callback for immediate watcher "${watcher.expression}"`)
      }
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
```

- 首先如果用户使用 `vm.$watch` 的时候，传入的回调函数，是一个对象，那么则会调用 `createWatcher` 函数，对参数进行处理。

- 之后将 `options.user` 设置为 true，代表是用户自定义 watcher，从而与渲染 watcher 等进行区分。

- 随后创建 `Watcher` 实例，实例化过程在[依赖收集](https://fengnzl.github.io/daily-learn/vue/sourcecode-analysis/reactive/getters.html#watcher)中有详细介绍，这里指简单介绍调用构造函数时的属性设置。

  ```js
  // 精简代码
  class Watcher {
    constructor (vm, expOrFn, cb, options, isRenderWatcher) {
      if (isRenderWatcher) {
        vm._watcher = this
      }
      vm._watchers.push(this)
      if (options) {
        this.deep = !!options.deep
        this.user = !!options.user
        this.lazy = !!options.lazy
        this.sync = !!options.sync
        this.before = options.before
      } else {
        this.deep = this.user = this.lazy = this.sync = false
      }
    }
  }
  ```

  我们可以看到在实例化的时候，首先会将该实例本事添加到 `_watchers` 数组中，之后会根据 `options` 参数来对各种属性进行赋值，其中如果是**渲染 watcher**，此时会传递 `isRenderWatcher` 参数，这时会增加一个 `_watcher` 属性来代表当前实例；如果是**用户自定义 watcher**，则会将 `user` 属性设置为 true 来区分；如果是**计算属性 watcher**，则会通过 `lazy` 属性进行区分。

  我们可以看到，除了 `isRenderWatcher` 参数之外，其余的属性我们可以通过 `options` 来设置，如我们在用户 `watcher` 中可以设置 `sync` 属性来实行同步更新，或者设置 `before` 属性，在每次回调函数调用之前都会先调用该函数，如：

  <iframe height="265" style="width: 100%;" scrolling="no" title="watchAnalysis" src="https://codepen.io/lullabies/embed/preview/MWJxoEj?height=265&theme-id=dark&default-tab=js,result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
    See the Pen <a href='https://codepen.io/lullabies/pen/MWJxoEj'>watchAnalysis</a> by ScriptLearner
    (<a href='https://codepen.io/lullabies'>@lullabies</a>) on <a href='https://codepen.io'>CodePen</a>.
  </iframe>

  **我们应仅使用官方提供的 `immediate` 和 `deep` 属性**。

- 如果用户设置了 `immediate` 属性为 `true`，那么将会立即回调函数 `cb.call(vm, watcher.value)` ，可以看到执行函数中相当于指传递了一个 `newVal`，因此如果使用 `immediate` 属性，那么第一次回调函数中的 `oldVal` 永远都是 `undefined`。

- 之后会返回一个 `unwatchFn` 函数，用于取消侦听。

### unwatchFn

我们可以看到该函数内部仅仅是调用了 `watcher` 实例的 `teardown` 函数。

```js
// Watcher类精简代码
class Watcher {
  constructor () {
    this.active = true
    this.deps = []
  }
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}

// Dep类精简代码
class Dep {
  constructor () {
    this.subs = []
  }
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }
}
// src/shared/util.js
/**
 * Remove an item from an array.
 */
export function remove (arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
```

该方法首先判断该 `watcher` 实例是否已经被取消（`active` 属性进行判断），如果没有取消，则首先判断当前组件如果没有被销毁，则从组件的 `Watcher` 实例列表（`_watchers`）中删除当前 `Watcher ` 实例，最后从 `deps` 数组中移除当前 `watcher` ，其中 `deps` 存储的是 `Dep` 实例，移除之后将当前 `watcher` 设置为不活跃状态，从而重复调用 `unwatchFn` 函数的时候内部代码只会执行一次。