# [1089.复写零](https://leetcode.cn/problems/duplicate-zeros/)

## Description

Difficulty: **简单**  

Related Topics: [数组](https://leetcode.cn/tag/array/), [双指针](https://leetcode.cn/tag/two-pointers/)


给你一个长度固定的整数数组 `arr`，请你将该数组中出现的每个零都复写一遍，并将其余的元素向右平移。

注意：请不要在超过该数组长度的位置写入元素。

要求：请对输入的数组 **就地 **进行上述修改，不要从函数返回任何东西。

**示例 1：**

```
输入：[1,0,2,3,0,4,5,0]
输出：null
解释：调用函数后，输入的数组将被修改为：[1,0,0,2,3,0,0,4]
```

**示例 2：**

```
输入：[1,2,3]
输出：null
解释：调用函数后，输入的数组将被修改为：[1,2,3]
```

**提示：**

1.  `1 <= arr.length <= 10000`
2.  `0 <= arr[i] <= 9`


## Solution

Language: **JavaScript**

### 方法一
- 利用 `splice` 特性
- 在 `0` 的位置插入 `0`
- 同时通过 `pop` 方法弹出最后一个数据
- 该方法并不符合原地改动的特点

```javascript
/**
 * @param {number[]} arr
 * @return {void} Do not return anything, modify arr in-place instead.
 */
var duplicateZeros = function(arr) {
  for (let i = 0;i < arr.length;i++) {
    if (arr[i] === 0) {
      arr.splice(i, 0, 0)
      arr.pop()
      i++
    }
  }
};
```

### 方法二
- 记录数组中出现 `0` 的个数 `count`
- `n` 为原数组长度，则 `j = n - 1 + count`，
- `j < n` 时，`arr[j] = arr[i]`
- 反向遍历数组，逐步将元素分配到新的位置

```js
var duplicateZeros = function(arr) {
  const n = arr.length
  let count = 0
  for (let i = 0;i < n;i++) {
    if (arr[i] === 0) count++
  }
  let [i, j] = [n - 1, n - 1 + count]
  while (i >= 0) {
    if (j < n) {
      arr[j] = arr[i]
    }
    if (arr[i] === 0 && --j < n) {
      arr[j] = 0
    }
    i--
    j--
  }
};
```
