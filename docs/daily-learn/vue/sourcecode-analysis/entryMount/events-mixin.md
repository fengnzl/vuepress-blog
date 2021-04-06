# eventsMixin 流程

Vue 中的实例方法/事件 `$on`、`$once`、`$off` 以及 `$emit` 都是在 eventsMixin (core/instance/events.js) 中在 `Vue.prototype` 上进行定义的。

```js
export function eventsMixin (Vue: Class<Component>) {
  const hookRE = /^hook:/
  Vue.prototype.$on = function(event, fn){}
  Vue.prototype.$once = function(event, fn){}
  Vue.prototype.$off = function(event, fn){}
  Vue.prototype.$emit = function(event){}
}
```

在 `eventsMixin` 中我们可以看到，其使用的是**发布-订阅模式**，来处理事件，因此要想搞懂其具体实现，首先我们先了解什么是**发布-订阅模式**。

## 发布-订阅模式

![pubSub](/vue/pubSub.png)

上图展示了观察者模式和发布/订阅模式之间的区别，这里可以看到发布-订阅模式多了一个消息调度中心，用于解耦发布者和订阅者。发布-订阅模式中各部分功能：

- 发布者：满足条件时，通过消息调度中心发布消息
- 消息调度中心：负责存储消息与订阅者的对应关系，有消息触发时，负责通知订阅者
- 订阅者：去消息中心订阅自己感兴趣的消息

我们可以自己实现一个简单的发布-订阅模式，如下所示

```js
class PubSub {
  constructor() {
    // 一个对象存储所有的消息订阅
    // 一个消息对应一个数组
    // { events1: [cb1, cb2] }
    this.events = Object.create(null)
  }

  subscribe(event, cb) {
    // 如果已经订阅，则push添加
    if (this.events[event]) {
      this.events[event].push(cb)
    } else {
      // 没有订阅 则创建一个数组
      this.events[event] = [cb]
    }
  }

  publish(event, ...args) {
    // 取出所有的订阅回调执行
    const subscribedEvents = this.events[event]
    if (subscribedEvents && subscribedEvents.length) {
      subscribedEvents.forEach(cb => cb.apply(this, args))
    }
  }

  // 删除某个订阅，保留其它
  unsubscribe(event, callback) {
    const subscribedEvents = this.events[event]
    if (subscribedEvents && subscribedEvents.length) {
      this.events[event] = subscribedEvents.filter(cb => cb !== callback)
    }
  }
}

const pubSub = new PubSub()
// eating banana
pubSub.subscribe('eat', (food) => console.log(`eating ${food}`))
// eating banana done
pubSub.subscribe('eat', (food) => console.log(`eating ${food} done`))
pubSub.publish('eat', 'banana')
```

## `$on` 实现

现在我们可以来看 Vue 内部是如何实现事件的发布-订阅的，首先我们来看关于 `$on` 的实现代码

```js
Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
    const vm: Component = this
    if (Array.isArray(event)) {  (1)
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn)
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true
      }
    }
    return vm
  }
```

代码分析：

- 跟我们自己实现的差不多，其事件订阅存储在内部属性 `_events` 上，这个是在 `initMixin` 流程中内部初始化事件中心方法 `initEvents(vm)` 中进行定义的

  ```js
  export function initEvents (vm: Component) {
    vm._events = Object.create(null)
    vm._hasHookEvent = false
    // init parent attached events
    const listeners = vm.$options._parentListeners
    if (listeners) {
      updateComponentListeners(vm, listeners)
    }
  }
  ```

  这里不止初始化了 `_events` 属性，还初始化 `_hasHookEvent` 属性（用于触发钩子函数的 flag）和初始化父组件的事件，这将在后续的 event 事件处理中进行详细的介绍

- `(1)` 行代码处我们可以看到，`$on` 支持接收一个数组 `event`，当 `event` 为数组时，会遍历数组递归调用 `$on` 方法。这是由用户提的 [Issue](https://github.com/vuejs/vue/issues/4856)，然后在 `Vue 2.2.0` 版本实现支持的。

## `$emit ` 实现

Vue 内部实现事件的触发代码如下：

```js
Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this
    if (process.env.NODE_ENV !== 'production') { (1)
      const lowerCaseEvent = event.toLowerCase()
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}".` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +
          `v-on to listen to camelCase events when using in-DOM templates. ` +
          `You should probably use "${hyphenate(event)}" instead of "${event}".`
        )
      }
    }
    let cbs = vm._events[event]
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      const args = toArray(arguments, 1)
      const info = `event handler for "${event}"`
      for (let i = 0, l = cbs.length; i < l; i++) {
        invokeWithErrorHandling(cbs[i], vm, args, vm, info) (2)
      }
    }
    return vm
  }
```

代码分析：

- `(1)` 处代码主要是对开发环境，`event` 驼峰式名称相关进行验证提示，如以下代码就会触发上述提示：

  ```js
  <el-button @click="$emit('handleChange', 'fdsfds')">button click</el-button>
  
  created() {
    this.$on("handlechange", (args) => console.log(args))
  }
  ```

- 从后续代码看，`$emit` 主要是从事件中心取出注册的事件数组 `cbs`，然后依次循环去触发事件，其中 `toArray` 方法主要是将类数组转换成数组，并提供截取功能。

  ```js
  /**
   * Convert an Array-like object to a real Array.
   */
  export function toArray(list: any, start?: number): Array<any> {
    start = start || 0
    let i = list.length - start
    const ret: Array<any> = new Array(i)
    while (i--) {
      ret[i] = list[i + start]
    }
    return ret
  }
  ```

- `(2)` 处代码中的 `invokeWithErrorHandling` 从 `core/util/error.js` 中导出，主要是对函数加了一层异常捕获，并对错误执行 `handleError` 方法，来获得更好的错误提示。

## `$off` 实现

根据官方 [API 文档](https://cn.vuejs.org/v2/api/#vm-off)可知，其有三种使用方法，从而对应三种不同的情况。

> **用法**：
>
> 移除自定义事件监听器。
>
> - 如果没有提供参数，则移除所有的事件监听器；
> - 如果只提供了事件，则移除该事件所有的监听器；
> - 如果同时提供了事件与回调，则只移除这个回调的监听器。

其内部代码实现如下所示：

```js
Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    const vm: Component = this
    // 没有提供参数，关闭全部事件监听器
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }
    // 传递的是 events 数组，则递归调用
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }
    // 提供了具体的某个事件名
    const cbs = vm._events[event]
    if (!cbs) {
      return vm
    }
  	// fn 回调函数不存在，将事件监听器变为 null，返回 vm
    if (!fn) {
      vm._events[event] = null
      return vm
    }
    // 提供了回调函数
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        // 移除 fn 这个事件监听器
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }
```

## `$once` 实现

`$once` 内部实现比较简单，在回调之后立即调用 `$off` ，即可实现一个简单的 `$once` 方法：

```js
  Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this
    function on () {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn
    vm.$on(event, on)
    return vm
  }
```

这里我们自己组装了注册事件的回调函数，并将原回调函数作为其属性，从而在移除的时候可以通过 `cb.fn === fn` 来进行判断移除。