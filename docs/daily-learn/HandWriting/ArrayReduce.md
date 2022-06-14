# 实现一个 reduce
> reduce() 方法对数组中的每个元素按序执行一个由您提供的 reducer 函数，每一次运行 reducer 会将先前元素的计算结果作为参数传入，最后将其结果汇总为单个返回值。

> 第一次执行回调函数时，不存在“上一次的计算结果”。如果需要回调函数从数组索引为 0 的元素开始执行，则需要传递初始值。否则，数组索引为 0 的元素将被作为初始值 initialValue，迭代器将从第二个元素开始执行（索引为 1 而不是 0）。

```js
Array.prototype.SimulateReduce = function (callback, initialValue) {
  if (typeof callback !== 'function') {
    throw new TypeError(`${callback} is not a function`)
  }
  const arr = this
  const isDefInitial = argument.length !== 1
  if (arr.length === 0 && !isDefInitial) {
    throw new TypeError('Reduce of empty array with no initial value')
  }
  let [index, prev] = [0, initialValue]
  if (!isDefInitial) {
    prev = arr[0]
    index++
  }
  for (let i = index; i < arr.length; i++) {
    prev = callback(prev, arr[i], i, arr)
  }
  return prev
}
```
## 测试代码
```js
const getMax = (a, b) => Math.max(a, b);
[    50].SimulateReduce(getMax);  // 50
[      ].SimulateReduce(getMax, 1);  // 1

[      ].reduce(getMax); // TypeError: Reduce of empty array with no initial value

let initialValue = 0
let sum = [{x: 1}, {x: 2}, {x: 3}].reduce(function (previousValue, currentValue) {
    return previousValue + currentValue.x
}, initialValue)

console.log(sum); // logs 6

[1].SimulateReduce() // TypeError: undefined is not a function
```