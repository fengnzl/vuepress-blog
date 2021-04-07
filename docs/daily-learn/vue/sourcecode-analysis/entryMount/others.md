# 其它流程

除了上述流程之外，主要还有 `renderMixin` 和 `initGlobalAPI` 两个没有详述，其中 `renderMixin` 主要是定义了渲染相关的方法以及 `$nextTick` 方法（这与全局 API 中的 `nextTick` 引用的是同一个方法），除了 `$nextTick` 方法会在后面的全局 API 具体实现中描述，其余会在编译相关章节进行描述。`renderMixin` 精简代码如下：

```js
export function renderMixin (Vue) {
  // 挂载各种私有方法，例如this._c，this._v等
  installRenderHelpers(Vue.prototype)
  Vue.prototype._render = function () {}

  // 实例方法
  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  }
```

- `installRenderHelpers`：它会在`Vue.prototype`上挂载各种私有方法，例如`this._n = toNumber`、`this._s = toString`、`this._v = createTextVNode` 等方法。
- `_render`：`_render` 方法会把模板编译成 `VNode`。

`initGlobalAPI` 则主要实现了全局 API 方法，这将在后面专门讲述其实现原理。