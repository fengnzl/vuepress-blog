# 依赖收集

首先我要知道，什么是依赖，以及收集依赖的目的是什么，即我们究竟要收集谁，收集了之后可以做什么。

收集谁？换句话说就是当属性发生变化时，我们需要通知谁。

我们需要通知到使用数据的地方，它可以是个模板，也可以是用户自定义的 `watch` 等多个地方和不同的类型，因此需要我们封装一个可以集中处理这些情况的类。然后，我们在收集依赖阶段只收集这个封装好的类的实例进来，当数据发生变化时，也只通知它一个，然后由它负责通知其它地方。在 `Vue` 中这个类就是 `Watcher`。

之前我们也说过在 `getter` 中收集依赖，在 `setter` 中派发更新，因此我们来回顾下收集依赖的代码：

```js
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

这里我们可以看到首先执行了这串代码 `const dep = new Dep()`，然后在定义的 `getter` 函数中先判断了 `Dep.target` 存在后，则调用 `dep.depend()` 函数来进行依赖收集，同时还对 `childOb` 进行判断及后续处理，因此我们首先需要高清以下几个问题：

- 什么是 `Dep`?
- `Dep.target` 有时什么？
- `dep.depend()` 方法内部是如何实现依赖收集的

## Dep

首先让我们来搞懂什么是 `Dep`，它是定义在 `observe` 目录中的 `dep.js` 文件中。其代码如下所示：

```js
let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}
```

从上面我们可以知道，`Dep` 类实际上是专门用来管理 `Watcher`（依赖）的类，其首先定义了一个静态属性 `target`，其值是全局唯一的 `Watcher`，因为同一时间只有一个 `Watcher` 会被计算，然后其自身属性 `id` 相当于 `Dep` 的逐渐，会在实例化的时候自增。同时自身属性 `subs` 是存储各种 `Watcher` 的数组，如 `render Watcher`、`user Watcher` 和 `computed Watcher` 等。

`Dep` 的其它方法就是添加和移除各种各样的 `Watcher`，以及执行 `Watcher` 中的方法，因此我们来看 `Watcher` 即依赖究竟是怎样实现的。

## Watcher

`Watcher` 是定义在 `observe/watcher.js` 文件中的类，其代码如下所示：

```js
let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
    vm._watchers.push(this)
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
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   */
  addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
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

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            handleError(e, this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
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
```

从依赖收集角度来讲，我们在构造函数中主要需要关注以下四个属性：

```js
this.deps = []             // 旧dep列表
this.newDeps = []          // 新dep列表
this.depIds = new Set()    // 旧dep id集合
this.newDepIds = new Set() // 新dep id集合
```

这里使用的 `Set` 集合，是在判断当前环境如果不支持原生方法，则使用自己实现的方法，其定义在 `core/util/env.js` 中：

```js
let _Set
/* istanbul ignore if */ // $flow-disable-line
if (typeof Set !== 'undefined' && isNative(Set)) {
  // use native Set when available.
  _Set = Set
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = class Set implements SimpleSet {
    set: Object;
    constructor () {
      this.set = Object.create(null)
    }
    has (key: string | number) {
      return this.set[key] === true
    }
    add (key: string | number) {
      this.set[key] = true
    }
    clear () {
      this.set = Object.create(null)
    }
  }
}
```

我们在实例化 `Watcher` 的时候，会初始化一系列属性，其中其中重要的一点是获取 `getter` 函数，通过调用该函数就可以获取需要监听的数值。我们可以通过一下经典的使用方式来理解：

```js
vm.$watch('a.b.c', function(newVal, oldVal){
	// do something
})
```

当调用上述方法 `api` 方法的时候，在构造函数中，会进行如下赋值：

```js
// parse expression for getter
if (typeof expOrFn === 'function') {
	this.getter = expOrFn
} else {
	this.getter = parsePath(expOrFn)
  if (!this.getter) {
  	this.getter = noop
    process.env.NODE_ENV !== 'production' && warn(
    `Failed watching path: "${expOrFn}" ` +
    'Watcher only accepts simple dot-delimited paths. ' +
    'For full control, use a function instead.',
    vm
    )
  }
}
```

这是当监听的如果是一个表达式的时候，则通过 `parsePath` 函数读取字符串的 `keyPath` 来获取监听数据的值的，其定义在 `core/util/lang.js` 中：

```js
/**
 * Parse simple path.
 */
const bailRE = new RegExp(`[^${unicodeLetters}.$_\\d]`)
export function parsePath (path: string): any {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}
```

这里并不复杂，先讲 `keyPath` 分割成数组，然后循环数组一层一层去读取数据，从而最后返回的就是想要的数据。

在构造函数最后，判断如果不是 `computed Watcher`（只有 `computed Watcher` 的 `lazy` 属性才为 `true`），那么会立即调用 `this.get()` 函数，接下来我们就分析 `this.get()` 方法的实现。

```js
get () {
  pushTarget(this)
  let value
  const vm = this.vm
  try {
    value = this.getter.call(vm, vm)
  } catch (e) {
    if (this.user) {
      handleError(e, vm, `getter for watcher "${this.expression}"`)
    } else {
      throw e
    }
  } finally {
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value)
    }
    popTarget()
    this.cleanupDeps()
  }
  return value
}
```

我们可以看到，首先调用 `pustTarget(this)` 方法，该方法定义在 `dep.js` 文件中

```js
// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack = []

export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}
```

该方法的作用主要是将当前 `Watcher` 实例添加到 `targetStack` 中，然后把 `Dep.target` 设置为当前的 `Watcher` 实例。

然后会调用 `this.getter` 函数来进行求值。

```js
value = this.getter.call(vm, vm)
```

我们这里拿计算属性来作为示例：

```js
export default {
  data () {
    return {
      count: 1
    }
  },
  computed: {
    counter () {
      return this.count + 1
    }
  }
}

// value = this.getter.call(vm, vm)
// 相当于
value = counter()
```

当我们调用方法时，就会调用对象属性的数据进行访问，从而触发数据对象上的 `getter`，每个 `getter` 属性上都有一个 `dep`， 在触发 getter 的时候，这时存在当前唯一的 `Dep.target`， 从而会调用 `dep.depend()` 来收集依赖，即会执行以下方法：

```js
depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
```

## addDep 和 cleanupDeps

由之前调用的 `pushTarget` 可知，`Dep.target` 已经被赋值为当前 `Watcher`，从而可以执行 `addDep` 方法：

```js
 /**
   * Add a dependency to this directive.
   */
  addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }
```

`addDep `方法首先判断了当前 `dep` 是否已经在新 `dep ids` 集合中，不在则更新 `dep ids` 集合以及新 `dep` 数组，随后又判断了当前 `dep` 是否在旧 `dep id` 集合中，不在则说明没有将当前 `Watcher` 订阅到当前数据负责依赖管理 `dep` 中的 `subs`（用于后续派发更新）， 因此会调用 `dep.addSub(this)` 方法，把当前 `Watcher` 实例添加到 `subs` 数组中。

### addDep 运行示例说明

为了加深对 `addDep` 的理解，我们通过以下示例说明

```js
<template>
  <p>first:{{msg}}</p>
  <p>second:{{msg}}</p>
</template>
<script>
export default {
  name: 'App',
  data () {
    return {
      msg: 'hello world'
    }
  }
}
</script>
```

- 当初次渲染该组件的时候，会实例化 `render Watcher`，此时 `Dep.target` 上的 `Watcher` 实例就是 `render Watcher`

  ```js
   updateComponent = () => {
   	vm._update(vm._render(), hydrating)
   }
  
  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, {
  	before () {
  		if (vm._isMounted && !vm._isDestroyed) {
  		callHook(vm, 'beforeUpdate')
  		}
  	}
  }, true /* isRenderWatcher */)
  ```

- 当第一次读取页面的 `msg` 变量时，会触发 `getter` 从而调用 `dep.depend` 方法进行依赖收集，在该方法内部调用 `addDep` 方法，这时 `deps`、`depIds`、`newDeps` 和 `newDepIds` 被初始化为空数组或者空的集合。当执行完 `addDep` 方法后，会将当前的 `dep` 添加到 `newDeps` 数组中，其 `id` 被添加到 `newDepIds` 中，最后会讲当前 `Watcher` 实例添加到 `dep` 的订阅数组 `subs`中。

  ```js
  // 实例化 Dep
  const dep = { id: 0, subs: [] }
  // 第一次执行 addDep 之后
  // 此时的 Watcher 实例
  const watcher = {
  	newDeps: [dep],
  	newDepIds: [0],
  }
  
  dep = { id: 0, subs: [watcher] }
  ```

- 当第二次读取 `msg` 变量的时候，会再次出发 `getter` 进行依赖收集，由于实例化的 `dep` 对于 `getter` 是定义在 `defineReactive` 函数中的闭包变量，因此两个触发的 `getter` 中是同一个 `dep` 实例，此时调用 `addDep` 方法，会判断 `newDepIds` 集合中已经存在 `dep.id` 为 `1` 的，因此会直接跳过依赖收集。

- 在 `getter` 代码中，可以看到

依赖收集完成之后，会执行以下几个逻辑，首先是：

```js
if (this.deep) {
  traverse(value)
}
```

这时当我们设置了 `deep` 属性的时候，会通过调用 `traverse(value)` 方法，递归来触发所有子项的 `getter`，从而对每个嵌套的属性都会进行依赖收集，这个将在后面介绍 `$watcher` API 的时候详细说明。

然后会执行 `popTarget()` 方法，其定义在 `core/observe/dep.js` 文件中，如下：

```js
export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
```

这里实际上将 `targetStack` 出栈，然后将 `Dep.target` 设置为最后一项，即恢复到上一个状态，因为当前的数据依赖已经收集完成，对应的 `Dep.target` 也需变化。后面将会提供示例便于理解。

### cleanDeps

最后我们会执行 `this.cleanupDeps()` 方法，这里主要是进行了依赖清空操作，那么我们为什么要进行清空依赖呢？具体又是怎样清空依赖的？

首先我们可以看到 `Watcher` 类中其代码实现如下：

```js
export default Watcher {
  // 精简代码
  constructor () {
    this.deps = []              // 旧dep列表
    this.newDeps = []           // 新dep列表
    this.depIds = new Set()     // 旧dep id集合
    this.newDepIds = new Set()  // 新dep id集合
  }
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }
}
```

为了更好的说明其作用，我们举例来说明，假如我们有以下组件：

```js
<template>
  <div id="app">
    <p v-if="count < 1">{{msg}}</p>
    <p v-else>{{age}}</p>
    <button @click="changeCount">Add Count</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      msg: 'hello world',
      age: 12,
      count: 0
    };
  },
  methods: {
    changeCount() {
      this.count++
    }
  }
};
</script>
```

当组件初次进行渲染的时候，`render Watcher` 实例上面的 `newDeps` 数组里面有两个 `dep` 实例，