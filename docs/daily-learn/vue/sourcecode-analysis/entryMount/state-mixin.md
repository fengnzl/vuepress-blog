# stateMixin 流程

在  `instance/index.js` 文件中执行完 `initMixin` 流程之后，就开始执行 `stateMixin` 流程。后续不在声明上述过程，具体顺序可看 [initMixin](https://recoverymonster.github.io/daily-learn/vue/sourcecode-analysis/entryMount/init-mixin.html#vue-%E5%AE%9E%E4%BE%8B%E5%85%A5%E5%8F%A3)  里面的描述。

`stateMixin` 里面主要在 `Vue.prototype` 中定义了一些实例上的属性和方法，其文件所在地址为 `src/core/instance/state.js` ，精简过后的代码如下所示：

```js
export function stateMixin () {
  const dataDef = {}
  // 定义 $data 和 $props
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)
  // 定义 $set $delete 和$watch方法
  Vue.prototype.$set = set
  Vue.prototype.$delete = del

  Vue.prototype.$watch = function () { 
      // 相关实现代码 
  }
```

从上述代码可知，`stateMixin` 中主要实现了对  `_data` 和 `_props` 代理，根据约定俗称的观点可知，一般以下划线开头的变量，我们都认为是私有变量。这里框架提供了 `$data` 和 `$props` 两个对外访问的属性。因此在项目中我们也可以通过 `this.$data` 来获取定义在 `data` 中的变量。虽然提供了这两个私有变量的访问器，但是我们仍然不能随意修改它。对于 `_data` 来说我们不能替换根实例，对于 `_props` 来说，其只是可读。当我们在试图给其重新赋值时，会进行报错：

```js
if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }
```

 `$set`、`$delete` 和 `$watch` 方法都是与响应式有关的实例方法，后面在介绍响应式原理的时候，会详细描述其实现的具体细节。在这里我们可以看到 `$set` 和 `$delete` 方法都是从 instance 同级目录 observe 文件夹中的 `index` 导出，这是因为它不仅是挂载到实例上，还添加到 Vue 对象上，成为一个全局方法，可在 `initGlobalAPI` 中看到其具体实现。

`$watch` 则主要是首先判断回调函数是否是对象，如果是对象，则通过 `createWatcher` 来实现监听，否则通过创建 `Watcher` 实例来实现监听，同时返回一个函数，用于取消监听。

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

## 整体流程

以上简单分析了 `stateMixin` 的代码，下面是其整体流程：

