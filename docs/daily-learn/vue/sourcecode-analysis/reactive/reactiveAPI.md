# 变化侦测 API 实现

前面介绍了数据的响应式原理，但是对于对象来说，我们通过 `Object.defineProperty` 来将对象的 key 转换为 `getter` 和 `setter` 的形式来追踪变化，但是这只能追踪一个数据是否被修改，无法追踪新增属性和删除属性。因此 Vue.js 提供了两个 API，分别是 `$set` 和 `$delete` 来处理上述问题。同样的通过索引直接修改数组，将无法捕捉到数组的变动，这时除了使用我们拦截的方法 `splice` 进行设置（也可以修改数组长度），同样可以使用 `$set` 来处理。

## vm.$set

`Vue.set` 和 `vm.$set` 引用的是同一个 `set` 方法，其中 `set` 方法定义在 `core/instance/observe/index.js` 文件中。

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

- 然后根据[文档](https://cn.vuejs.org/v2/api/#Vue-set)，“对象不能是 Vue 实例，或者 Vue 实例的根数据对象”的情况，我们需要通过 `target._isVue` 来判断不是 `Vue` 实例，通过 `target.ob.vmCount` 来判断不是根数据对象（具体可看之前响应式对象中的 [Observe 相关分析](https://recoverymonster.github.io/daily-learn/vue/sourcecode-analysis/reactive/prepare.html#observe-%E5%92%8C-observe)）。

- 通过判断 `target` 对象如果不存在 `__ob__` 属性，那么说明其不是响应式的，因此只需直接设置对象上该属性的值即可。

- 上述情况不满足，那么是响应式对象新增属性，这时我们需要通过 `defineReactive` 将该属性转换成响应式，然后派发更新，通知相应依赖进行更新即可，并返回 `val`。