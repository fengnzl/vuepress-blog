# [142. 环形链表 II](https://leetcode.cn/problems/linked-list-cycle-ii/)

## Description

Difficulty: **中等**  

Related Topics: [哈希表](https://leetcode.cn/tag/hash-table/), [链表](https://leetcode.cn/tag/linked-list/), [双指针](https://leetcode.cn/tag/two-pointers/)


给定一个链表的头节点  `head` ，返回链表开始入环的第一个节点。 _如果链表无环，则返回 `null`。_

如果链表中有某个节点，可以通过连续跟踪 `next` 指针再次到达，则链表中存在环。 为了表示给定链表中的环，评测系统内部使用整数 `pos` 来表示链表尾连接到链表中的位置（**索引从 0 开始**）。如果 `pos` 是 `-1`，则在该链表中没有环。**注意：`pos` 不作为参数进行传递**，仅仅是为了标识链表的实际情况。

**不允许修改** 链表。

**示例 1：**

![](https://assets.leetcode.com/uploads/2018/12/07/circularlinkedlist.png)

```
输入：head = [3,2,0,-4], pos = 1
输出：返回索引为 1 的链表节点
解释：链表中有一个环，其尾部连接到第二个节点。
```

**示例 2：**

![](https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2018/12/07/circularlinkedlist_test2.png)

```
输入：head = [1,2], pos = 0
输出：返回索引为 0 的链表节点
解释：链表中有一个环，其尾部连接到第一个节点。
```

**示例 3：**

![](https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2018/12/07/circularlinkedlist_test3.png)

```
输入：head = [1], pos = -1
输出：返回 null
解释：链表中没有环。
```

**提示：**

*   链表中节点的数目范围在范围 [0, 10<sup>4</sup>] 内
*   -10<sup>5</sup> <= Node.val <= 10<sup>5</sup>
*   `pos` 的值为 `-1` 或者链表中的一个有效索引

**进阶：**你是否可以使用 `O(1)` 空间解决此题？


## Solution

- 假设起点到环的入口为 `m`,环的周长为 `c`
- `slow` 和 `fast` 相遇时，`slow` 走了 `n` 步，则 `fast` 走了 `2n` 步，其中多走的步数在环中，因此 `n % c === 0`，`slow` 在环中进行的距离是 `n - m`
- 设置第三个指针 `p`, 则其与 `slow` 同步走，那么 `slow` 再走 `m` 步则在环中走了 `n` 步，由 `n % c === 0` 可知，此时即位环的入口

[参考解法](https://leetcode.cn/problems/find-the-duplicate-number/solution/kuai-man-zhi-zhen-de-jie-shi-cong-damien_undoxie-d/)

Language: **JavaScript**

```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} head
 * @return {ListNode}
 */
 // hash 表
// var detectCycle = function(head) {
//   if (head == null || head.next == null) return null
//   const nodeSet = new Set()
//   let p = head
//   while (p != null) {
//     if (nodeSet.has(p)) return p
//     nodeSet.add(p)
//     p = p.next
//   }
//   return null
// };

// 双指针
var detectCycle = function(head) {
  if (head == null || head.next == null) return null
  let [low, fast, meetNode] = [head, head, null]
  while (fast != null && fast.next != null ) {
    low = low.next
    fast = fast.next.next
    if (fast == low) {
      meetNode = low
      break
    }
  }
  if (meetNode == null) return null
  let p = head
  while (p != meetNode) {
    meetNode = meetNode.next
    p = p.next
  }
  return meetNode
}

```