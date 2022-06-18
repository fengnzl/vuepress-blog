# [18. 四数之和](https://leetcode.cn/problems/4sum/)

## Description

Difficulty: **中等**  

Related Topics: [数组](https://leetcode.cn/tag/array/), [双指针](https://leetcode.cn/tag/two-pointers/), [排序](https://leetcode.cn/tag/sorting/)


给你一个由 `n` 个整数组成的数组 `nums` ，和一个目标值 `target` 。请你找出并返回满足下述全部条件且**不重复**的四元组 `[nums[a], nums[b], nums[c], nums[d]]` （若两个四元组元素一一对应，则认为两个四元组重复）：

*   `0 <= a, b, c, d < n`
*   `a`、`b`、`c` 和 `d` **互不相同**
*   `nums[a] + nums[b] + nums[c] + nums[d] == target`

你可以按 **任意顺序** 返回答案 。

**示例 1：**

```
输入：nums = [1,0,-1,0,-2,2], target = 0
输出：[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]
```

**示例 2：**

```
输入：nums = [2,2,2,2,2], target = 8
输出：[[2,2,2,2]]
```

**提示：**

*   `1 <= nums.length <= 200`
*   -10<sup>9</sup> <= nums[i] <= 10<sup>9</sup>
*   -10<sup>9</sup> <= target <= 10<sup>9</sup>


## Solution

Language: **JavaScript**

```javascript
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[][]}
 */
var fourSum = function(nums, target) {
  nums.sort((a, b) => a - b)
  const result = []
  const n = nums.length
  for (let i = 0;i < n - 3;i++) {
    if (i != 0 && nums[i] === nums[i - 1]) continue
    for (let j = i + 1;j < n - 2;j++) {
      if (j > i + 1 && nums[j] === nums[j - 1]) continue
      let p = j + 1
      let q = n - 1
      while (p < q) {
        if (p > j + 1 && nums[p] === nums[p - 1]) {
          p++
          continue
        }
        if (q < n - 1 && nums[q] === nums[q + 1]) {
          q--
          continue
        }
        const sum = nums[i] + nums[j] + nums[p] + nums[q]
        if (sum === target) {
          result.push([nums[i], nums[j], nums[p], nums[q]])
          p++
          q--
        } else if (sum < target) {
          p++
        } else {
          q--
        }
      }
    }
  }
  return result
};
```

## 通用解法

```javascript
var fourSum = function(nums, target) {
  nums.sort((a, b) => a - b)
  const len = nums.length
  return nSum(nums, 4, 0, target, len)
  function nSum(nums, n, start, target, len) {
    if (len < n || n < 2) return []
    const result = []
    if (n === 2) {
      let i = start
      let j = len - 1
      while (i < j) {
        if (i > start && nums[i] === nums[i - 1]) {
          i++
          continue
        }
        if (j < len - 1 && nums[j] === nums[j + 1]) {
          j--
          continue
        }
        const sum = nums[i] + nums[j]
        if (target === sum) {
          result.push([nums[i], nums[j]])
          i++
          j--
        } else if (sum < target) {
          i++
        } else {
          j--
        }
      }
    } else {
      for(let i = start;i < len;i++) {
        if (i > start && nums[i] === nums[i - 1]) continue
        const resultArr = nSum(nums, n - 1, i + 1, target - nums[i], len)
        for (let arr of resultArr) {
          result.push([nums[i], ...arr])
        }
      }
    }
    return result
  }
}
```