# nextTick 实现原理

在日常开发中，想必我们已经对 `nextTick` 非常熟悉了，如果我们想要正确操作数据状态变化后的 DOM，那么我们一定与其打过交道。通过上面文章派发更新我们可以知道，最后一般都会调用 `nextTick(flushSchedulerQueue)`方法，从而达到异步更新。同时这也是比较核心的一个 `API`，加下来我们来详细介绍其具体是如何实现的。

## 运行机制

由于 `nextTick` 内部实现涉及 `JavaScript` 运行机制（Event Loop）相关知识，因此这里简单提及几个知识点，详细知识可以查看本文底部的相关文档。

### 单线程

首先我们要明确 `JS` 是单线程的，同一个时间点只能处理一件事。其原因与其用途相关，因为作为浏览器的脚本语言，与用户互动及操作 DOM 是其主要功能。如果不是单线程，会造成很复杂的同步问题。假如同时有两个线程，一个在 `DOM` 中添加内容，而另一个线程删除了这个节点，那么具体以哪个线程为准则？因此，其单线程已经成为了其核心特征。

即使为了利用多核 CPU 的计算能力，HTML5 提出Web Worker标准，允许 JavaScript 脚本创建多个线程，但是子线程完全受主线程控制，且不得操作 DOM。其核心本质是没有变化的。

### event loop

`JS` 中所有的同步代码都在执行栈中执行，当执行一个函数调用时，会创建一个新的执行环境并压到栈中开始执行函数中的代码。当函数中的代码执行完毕，则将执行环境从栈中弹出，当栈为空时，则代表执行完毕。

`JS` 分为同步任务和异步任务两种。异步任务不会进入主线程，而是进入到任务队列中，只有任务队列通知主线程，某个异步任务可以执行了，该任务才会进入主线程执行。

异步任务分为微任务和宏任务两种，其区别是，当执行栈空了，会检查微任务队列中是否有任务，将微任务队列中的任务依次拿出来执行一遍。当微任务队列空了，从宏任务队列中拿出来一个任务去执行，执行完毕后检查微任务队列，微任务队列空了之后再从宏任务队列中拿出来一个任务执行。这样持续的交替执行任务叫做**事件循环**。

宏任务（macrotask）：setTimeout、setInterval、setImmediate、I/O、UI rendering
微任务（microtask）：promise.then、process.nextTick、MutationObserver、queneMicrotask(开启一个微任务)。

```js
// 伪代码流程
for (macroTask of macroTaskQueue) { // 遍历所有宏服务
    // 1. 执行当前宏服务下的所有同步任务
    handleMacroTask();

    // 2. 遍历执行当前宏服务下的微服务
    for (microTask of microTaskQueue) {
        handleMicroTask(microTask);
    }
}
```

## MutationObserver

我们先来介绍 [MutationObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver) 的详细用法，后面介绍 `nextTick` 时会用到。其作用是监听 DOM 变动，比如节点的增减、文本内容的变动，该 API 均可以得到通知。

它与 DOM 事件的本质上不用，因为他是异步触发，是个微任务，而事件是同步触发的。因为 **修改 DOM 变化是同步的，但是渲染是异步的。**所以如果文档中连续插入 100 个子元素，会触发事件 100 次，而 `MutationObserver` 则会在全部插入完成之后值触发一次。它把 DOM 变动记录封装成一个数组进行处理，而不是一条条个别处理 DOM 变动。



## 参考文档

[深入解析 EventLoop 和浏览器渲染、帧动画、空闲回调的关系](https://zhuanlan.zhihu.com/p/142742003)

[Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)

[Mutation Observer API](https://wangdoc.com/javascript/dom/mutationobserver.html)