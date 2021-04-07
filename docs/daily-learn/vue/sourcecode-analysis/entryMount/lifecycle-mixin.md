# lifecycleMixin 流程

`lifecycleMixin` 中除了定义声明周期的实例方法 `$forceUpdate` 和 `$destory` 方法之后，其还定义了 `_update` 私有方法，该方法主要用于首次渲染和数据更新时进行调用，精简之后的 `lifecycleMixin` 如下所示： 

```js
export function lifecycleMixin (Vue) {
  // 私有方法
  Vue.prototype._update = function () {}

  // 实例方法
  Vue.prototype.$forceUpdate = function () {
    if (this._watcher) {
      this._watcher.update()
    }
  }
  Vue.prototype.$destroy = function () {}
}
```

- `$forceUpdate` 主要用于组件强制重新渲染，它仅仅影响实例本身及插入插槽内容的子组件，而不是所有的子组件。因此只需要执行实例 watcher 上的 update 方法来达到重新渲染组件的效果，因为一个组件就是 Vue.js 实例，这里主要手动派发更新。关于 watcher 具体会在响应式原理中进行详细说明。

  ```js
  Vue.prototype.$forceUpdate = function () {
      const vm: Component = this
      if (vm._watcher) {
        vm._watcher.update()
      }
    }
  ```

- `$destory` 方法将会完全销毁一个实例，并清理该实例与其他实例的链接，解除其全部指令集监听器，并触发 `beforeDestroy` 和 `destroyed` 钩子函数。其内部实现将会在后面生命周期中会进行详细描述。