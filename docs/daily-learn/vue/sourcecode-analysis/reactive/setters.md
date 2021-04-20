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

通过上面的代码可知，在满足数据变化或者监听的是对象等，回调会被同步调用，因此不建议使用该属性。实际上 `Vue2` 官方文档中也只列出了 `deep` 和 `immediate` 属性配置，虽然 `Vue3` 中可以通过设置 `flush: 'async'` 可以达到回调同步调用的效果，但是官方也是极不推荐的，默认是**异步执行更新**的。

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
- `flushing` 当前 `queue` 是否处于 `flushing` 中，即当前队列中的 `watcher` 是否处于执行中， 在 `flushSchedulerQueue` 方法中被修改为 `true`。

现在我们来分析 `queueWatcher` 的具体过程，其定义在 `src/core/observe/scheduler.js` 中：

```js
/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  if (has[id] == null) {
    has[id] = true
    // 没有刷新队列的话，直接将wacher塞入队列中排队
    if (!flushing) {
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      // 如果正在刷新，那么这个watcher会按照id的排序插入进去
      // 如果已经刷新了这个watcher，那么它将会在下次刷新再次被执行
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    if (!waiting) {
      waiting = true
	  // 如果是开发环境，同时配置了async为false，那么直接调用flushSchedulerQueue
      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue()
        return
      }
      nextTick(flushSchedulerQueue)
    }
  }
}
```

- 首先获取当前 `Watcher` 实例的自增 `id`，然后通过对象 `has` 来判断当前 `watcher` 是否被添加到队列中，如果没有，则对 `id` 进行标记，并赋值为 `true`。保证对同一个 `watcher` 只会添加一次，避免重复渲染。
- 判断当前是否处于 `flushing` 状态，如果判断为 `false`，则正常将 `watcher` 添加到队列中，如果在 `flushing` 阶段触发了 `queueWatcher` 函数，那么将按照 `watcher` 实例的 `id`  按顺序插入到队列中，如果已经执行过 `watcher`，那么它将在队列的下次调用中立即执行。
- 之后通过 `waiting` 的状态来保证 `nextTick(flushSchedulerQueue)` 的调用只有一次，`nextTick` 将在后面进行介绍，这里我们只需要知道其参数将在下一个 `tick` 中执行，也就是说异步执行 `flushSchedulerQueue`

接下来，我们来看 `flushSchedulerQueue` 函数：

```js
/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
  currentFlushTimestamp = getNow();
  flushing = true;
  var watcher, id;

  // 刷新之前对队列做一次排序
  // 这个操作可以保证：
  // 1. 组件都是从父组件更新到子组件（因为父组件总是在子组件之前创建）
  // 2. 一个组件自定义的watchers都是在它的渲染watcher之前执行
  //（因为自定义watchers都是在渲染watchers之前执行（render watcher））
  // 3. 如果一个组件在父组件的watcher执行期间刚好被销毁，那么这些watchers都将会被跳过
  queue.sort(function (a, b) { return a.id - b.id; });

  // 不对队列的长度做缓存，因为在刷新阶段还可能会有新的watcher加入到队列中来
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    if (watcher.before) {
      watcher.before();
    }
    id = watcher.id;
    has[id] = null;
    // 执行watch里面定义的方法
    watcher.run();
    // 在测试环境下，对可能出现的死循环做特殊处理并给出提示
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1;
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? ("in watcher with expression \"" + (watcher.expression) + "\"")
              : "in a component render function."
          ),
          watcher.vm
        );
        break
      }
    }
  }

  // 重置状态前对activatedChildren、queue做一次浅拷贝（备份）
  var activatedQueue = activatedChildren.slice();
  var updatedQueue = queue.slice();

  // 重置定时器的状态，也就是这个异步刷新中的has、waiting、flushing三个变量的状态
  resetSchedulerState();

  // 调用组件的 updated 和 activated 钩子
  callActivatedHooks(activatedQueue);
  callUpdatedHooks(updatedQueue);

  // deltools 的钩子
  if (devtools && config.devtools) {
    devtools.emit('flush');
  }
}
```

上述方法主要做了以下几件事：**还原 flushing 状态、对 `watcher` 队列 `queue` 进行排序、遍历 `queue` 执行 `watcher.run` 方法、还原状态，触发组件钩子函数**。

- 还原 `flushing` 状态，这就可以确保在执行 `queue` 队列执行过程中，仍然有 `Watcher` 可以被添加到 `queue` 队列，也就是之前所说的在 `flushing` 阶段触发了 `queueWatcher` 函数。
- 对 `queue` 队列排序，通过 `sort ` 方法来对队列进行从小到大的排序，主要是为了确保以下几点：
  1. 组件的更新是先从父组件开始，然后到子组件。在组件渲染的时候，会先创建父组件的渲染`watcher`，之后是子组件的渲染 `watcher`，因此执行顺序也应保持先父后子。
  2. 用户自定义的 `watcher` 优先于渲染 `watcher` 执行；因为用户自定义 `watcher` 先于渲染 `watcher` 创建。
  3. 如果子组件在父组件执行 `watcher` 的时候被销毁，那么子组件的 `watcher` 都应该跳过，所以父组件 `watcher` 先执行。
- 遍历 `queue`。在遍历的时候，我们每次都会对 `queue.length` 进行求值，是因为在执行 `watcher.run` 的时候，`queue` 队列中可能会有新的 `watcher` 被添加进来

这里我们可以看到循环中，首先会判断 `watcher.before` 如果存在，则执行该函数，一般渲染 `watcher` 中存在该方法，它调用了 `beforeUpdate` 函数。

```js
 new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate');
      }
    }
  }, true /* isRenderWatcher */);
```

之后会执行 `watcher.run` 方法，其代码如下：

```js
/**
* Scheduler job interface.
* Will be called by the scheduler.
*/
run () {
	if (this.active) {
		const value = this.get()
		// ...
		this.cb.call(this.vm, value, oldValue)
	}
}
```

对于渲染 `watcher` 来说，在执行 `this.get()` 方法求值时，执行 `getter` 方法，也就是  `updateComponent`:

```js
updateComponent = () => {
  vm._update(vm._render(), hydrating)
}
```

从而修改组件相关响应式数据，最终会触发组件重新渲染。之后会执行我们实例化 `Watcher` 时提供的回调函数 `this.cb.call(this.vm, value, oldValue)`。

- 还原状态：在遍历之后通过调用 `resetSchedulerState` 方法，来将 `queue` 队列相关的状态进行初始化。

  ```js
  const queue: Array<Watcher> = []
  const activatedChildren: Array<Component> = []
  let has: { [key: number]: ?true } = {}
  let circular: { [key: number]: number } = {}
  let waiting = false
  let flushing = false
  let index = 0
  
  /**
   * Reset the scheduler's state.
   */
  function resetSchedulerState () {
    index = queue.length = activatedChildren.length = 0
    has = {}
    if (process.env.NODE_ENV !== 'production') {
      circular = {}
    }
    waiting = flushing = false
  }
  ```

- 触发组件钩子函数：通过调用 `callActivatedHooks` 和 `callUpdatedHooks` 函数来分别触发组件的 `activated` 和 `updated` 钩子函数。

##  `flushing` 阶段触发 `queueWatcher` 函数

下面我们通过一个简单的例子来介绍如何在 `flushing` 阶段触发 `queueWatcher` 函数，如以下代码：

```js
<template>
  <div id="app">
    <div>
      this is count: {{count}}
    </div>
    <button @click="changeCount">Add Count</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0
    };
  },
  methods: {
    changeCount() {
      this.count++
    }
  },
  watch: {
    count(newVal) {
      if(this.count < 10) {
          this.count++
        }
       console.log(newVal)
    }
  }
};
</script>
```

当我们点击按钮执行 `changeCount` 函数时，会修改 `this.count` 的值，从而触发 `setter` ，执行 `dep.notify` 函数进行派发更新，过程如下图所示：

![dep-notify](/vue/dep-notify.png)

这里我们可以看到 `Dep` 实例中的 `subs` 数组里面分别为 `id` 分别为 `1` 的 `user watcher` 和为 `2` 的 `render watcher`。之后执行 `update` 方法内部会执行 `queueWatcher` 函数。从而依次会将上面两个 `watcher` 实例 `push` 到 `watcher` 队列 `queue` 中。

```js
// 伪代码
queue = [{ id：1， type: 'user watcher' }, { id: 2, type: 'render watcher' }]
```

当在 `flushSchedulerQueue` 函数中循环执行 `queue` 中每一项的 `watcher.run` 函数时，首先会执行用户自定义的 `watcher`， 其中会执行我们传递的回调函数

```js
userCallback = (newVal) => {
	if(this.count < 10) {
    	this.count++
    }
    console.log(newVal)
}
```

在这里我们对 `this.count` 重新赋值，从而会触发 `setter` 函数，再次执行 `dep.notify`，之后是 `queueWatcher` 函数，此时 `flushing` 为 `false` ，因此会走 `else` 分支，之后 `queue` 的值为如下所示：

```js
// queueWatcher
if (has[id] == null) {
    has[id] = true
    // 没有刷新队列的话，直接将wacher塞入队列中排队
    if (!flushing) {
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      // 如果正在刷新，那么这个watcher会按照id的排序插入进去
      // 如果已经刷新了这个watcher，那么它将会在下次刷新再次被执行
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    //....
}

// queue队列
queue = [
	{ id：1， type: 'user watcher' },
	{ id：1， type: 'user watcher' },
    { id: 2, type: 'render watcher' }
]
```

之后会重复上面的步骤，`user watcher` 会不断 `push` 进 `queue` 数组中，直到 `this.count < 10` 为止，此时的 `queue` 队列里面有 `10` 个 `user watcher` ，一个 `render Watcher`，如下图所示：

![flush-queue](/vue/flush-queue.png)

上面就是在 `flushing` 阶段触发 `queueWatcher` 函数的全流程。

同时为了避免出现死循环的情况，`Vue` 在开发环境会对这种情况进行一定的限制，当同一 `watcher` 被添加到 `queue` 队里中超过 100 次时，则会进行报错，在 `flushSchedulerQueue` 中这段代码中可以看到

```js
// in dev build, check and stop circular updates.
  if (process.env.NODE_ENV !== 'production' && has[id] != null) {
    circular[id] = (circular[id] || 0) + 1
    if (circular[id] > MAX_UPDATE_COUNT) {
      warn(
        'You may have an infinite update loop ' + (
          watcher.user
            ? `in watcher with expression "${watcher.expression}"`
            : `in a component render function.`
        ),
        watcher.vm
      )
      break
    }
```

如我们将上述的 `user watcher` 进行如下修改

```js
watch: {
    count(newVal) {
        this.count++
       console.log(newVal)
    }
  }
```

我们可以在控制台中看到如下报错信息：

```js
vue.js:634 [Vue warn]: You may have an infinite update loop in watcher with expression "count"

(found in <Root>)
```

