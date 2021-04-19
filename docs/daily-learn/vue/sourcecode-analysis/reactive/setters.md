# 派发更新

在上节介绍完依赖收集之后，我们来分析派发更新。这里我们将介绍派发更新完成了什么事情以及其具体实现过程。

首先派发更新主要做什么事情？

当我们进行依赖收集时，就是为了当我们对响应式数据修改的时候，会通过管理 `Watcher` 的类 `Dep` 的实例来通知所有订阅了该数据的 `Watcher`， 从而执行 `update` 方法。对于渲染 `watcher` 来说，`update` 方法会组件更新重新渲染；对于 `computed watcher` 来说，`update` 方法就是重新对计算属性进行求值；对于用户自定义的 `watcher` 而言，`update` 方法就是调用用户提供的回调函数。

## 派发更新另三种场景

一般大家分析派发更新的时候都只分析 `Object.defineProperty` 中 `setter` 函数触发的派发更新，实际上派发更新还会有以下另外三种场景触发。

- `Vue.set` 或者 `this.$set()` 方法调用的时候，会进行触发，其内部详细实现会在变化侦测 `API` 实现中进行说明。

  ```js
  export function set (target: Array<any> | Object, key: any, val: any): any {
    //...
    defineReactive(ob.value, key, val)
    ob.dep.notify()
    return val
  }
  ```

- `Vue.delete` 或者 `this.$delete` 方法调用的时候，会进行派发更新。

  ```js
  export function del (target: Array<any> | Object, key: any) {
    // ...
    delete target[key]
    if (!ob) {
      return
    }
    ob.dep.notify()
  }
  ```

- 当对数组使用 `Vue` 提供的七种数组变异方法时，会进行派发更新。

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

  上面三种方法中的 `dep` 是从 `this.__ob__` 中获取，`__ob__` 属性是在 `Observe` 被实例化的时候通过 `def` 定义的，它指向 `Observe` 实例。

  ```js
   constructor (value: any) {
      this.value = value
      this.dep = new Dep()
      this.vmCount = 0
      def(value, '__ob__', this)
      // ...
   }
  ```

  这个之前依赖收集部分已经介绍过了，正式 `Observe` 中定义了这个属性，我们才能在上述三种情况相对方便的进行派发更新。

  这与 `Object.defineProperty` 中 `setter` 触发派发更新不同，`setter` 中触发的派发更新是定义在 `defineReactive`  方法中的闭包变量 `const dep = new Dep()`。

## 派发更新过程

首先我们来回顾下 `setter` 的实现：

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
      //...
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

这里在设置了新值之后主要做了两件事，一是 `childOb = !shallow && observe(newVal)`，即在 `shallow` 为 `falsy` 时，会将设置的新值也转换为响应式，一般只有 `$attrs` 和 `$listeners` 调用该方法的时候会将 `shallow` 值设置为 `true`。之后会调用 `dep.notify()` 来派发更新。

`dep.notify` 是 `Dep` 的实例方法，代码如下所示：

```js
class Dep {
  //...
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

 这里首先判断 `config.async` 的值是否为 `true`，且在开发环境下，那么会先根据实例化的 `watcher` 的 `id` 进行排序，从而确保派发更新的顺序没有问题，这个将在后面详细描述，因为一般只有在 `Vue` 的单元测试中会将其设置为 `false`，并且这将会显著的降低性能。

其实 `notify` 的代码逻辑非常简单，他会遍历 `Watcher` 的实例数组 `subs`，然后调用每个 `Watcher` 的 `update` 方法。

```js
import { queueWatcher } from './scheduler'
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
```

 当 `update` 方法执行时，其首先会判断 `this.lazy` 和 `this.sync` 属性。其中 `this.lazy` 属性主要是计算属性 `watcher` 的标识，在进行 `Watcher` 实例化的时候不会立即求值，具体在后续的计算属性中会详细介绍。当我们实例化 `Watcher` 时 `options` 选项中 `this.sync`  设置为 `true`， 那么会执行 `this.run()`方法。

```js
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
```

通过上面的代码可知，在满足数据变化或者监听的是对象等，回调会被同步调用，因此不建议使用该属性。实际上 `Vue2` 官方文档中也只列出了 `deep` 和 `immediate` 属性配置，虽然 `Vue3` 中可以通过设置 `flush: 'async'` 可以达到回调同步调用的效果，但是官方也是极不推荐的。

因此我们来介绍 `update` 方法中的重点 `queueWatcher(this)`，它定义在 `core/observe/scheduler.js` 文件中，如下所示：

```js
export const MAX_UPDATE_COUNT = 100

const queue: Array<Watcher> = []
const activatedChildren: Array<Component> = []
let has: { [key: number]: ?true } = {}
let circular: { [key: number]: number } = {}
let waiting = false
let flushing = false
let index = 0

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    if (!waiting) {
      waiting = true

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue()
        return
      }
      nextTick(flushSchedulerQueue)
    }
  }
}
```

首先我们来看其顶部定义的几个变量，便于后续判断及理解：

- `queue` 是 `Watcher` 队列，只要不是重复的 `Watcher` 实例，即 `id` 不同且当前队列不是再 `flushing` 状态中，都会被添加进 `queue` 中。
- `has` 对象用来防止重复添加相同 `Watcher` 实例
- `index` 当前 `queue` 中遍历 `Watcher` 实例的索引，在 `flushSchedulerQueue` 方法中对 `queue` 队列数组遍历的 `index`。
- `flushing` 当前 `queue` 是否处于 `flushing` 中，在 `flushSchedulerQueue` 方法中被修改为 `true`。

现在我们来分析 `queueWatcher` 的具体过程：

