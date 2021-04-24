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

我们先来介绍 [MutationObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver) 的简单用法，后面介绍 `nextTick` 时会用到。其作用是监听 DOM 变动，比如节点的增减、文本内容的变动，该 API 均可以得到通知。

它与 DOM 事件的本质上不用，因为他是异步触发，是个微任务，而事件是同步触发的。因为 **修改 DOM 变化是同步的，但是渲染是异步的。**所以如果文档中连续插入 100 个子元素，会触发事件 100 次，而 `MutationObserver` 则会在全部插入完成之后值触发一次。它把 DOM 变动记录封装成一个数组进行处理，而不是一条条个别处理 DOM 变动。

简单示例如下所示：

```js
const callback = () => {
  console.log('text node data change')
}
const observer = new MutationObserver(callback)
let count = 1
const textNode = document.createTextNode(count)
observer.observe(textNode, {
  characterData: true
})

function func () {
  count++
  textNode.data = count
}
func() // text node data change
```

- 我们首先定义了回调函数和 `MutationObserve` 的实例对象，实例化时传递的参数为我们的回调函数。
- 我们创建了一个文本节点，接着调用 `MutationObserve` 实例的 `observe` 方法，传入我们创建的文本节点和 `config` 配置对象，其中具体属性可以在文档中查到。
- 之后我们通过调用 `func` 函数改变文本节点中文本内容，当文本内容变动后，`callback` 函数就会触发。

## nextTick 用法

具体相关知识可以参考文档  [Vue-nextTick](https://cn.vuejs.org/v2/api/#Vue-nextTick)。 

其主要是获取修改数据更新后的 DOM

```js
// 修改数据
vm.msg = 'Hello'
// DOM 还没有更新
Vue.nextTick(function () {
  // DOM 更新了
})

// 作为一个 Promise 使用 (2.1.0 起新增，详见接下来的提示)
Vue.nextTick()
  .then(function () {
    // DOM 更新了
  })
```

看到上面我们可能除了为什么在 `nextTick` 中获取到更新的 DOM 之外，也会对为什么可以作为 `Promise` 使用心存疑问，下面我们来看起具体实现。

## nextTick实现

其代码单独抽离至 `src/core/util/next-tick.js` 中，首先是重要的一环：**异步降级**。

```js
let timerFunc

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop)
  }
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Techinically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```

这里我们首先判断当前环境如果支持 Promise 就用 `Promise`，如果不支持就用 `MutationObserver` ，之前已经介绍 MutationObserver 它会在指定的DOM发生变化时被调用，如果不支持 MutationObserver 的话就用 [setImmediate](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/setImmediate)，但是这个特性只有最新版IE和node支持，然后是最后一个条件 如果这些都不支持的话就用 `setTimeout`。

之后我们来看 `nextTick` 方法的具体实现：

```js
const callbacks = []
let pending = false
export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
```

这里首先会将 `cb` 回调函数压入 `callbacks` 数组，然后在 `pending` 为 `false` 的时候执行 `timerFunc` 函数，确保在下一个 `tick` 中执行 `flushCallbacks` 函数，其逻辑非常简单，就是遍历 `callbacks` 数组，然后依次执行响应的回调函数。这里不直接在 `nextTick` 中执行回调函数，是为了保证在同一个 `tick` 中多次执行 `nextTick` 函数不会生成多个异步任务。

同时 `nextTick` 函数最后判断当没有 `cb` 回调函数传递的时候，返回一个 `promise`，从而解答了为什么我们使用时可以当作 `promise` 使用。

下面是 `flushCallbacks` 函数的实现，其主要是将 `pending` 状态还原，遍历执行回调函数，由于此时是在下一个 `tick` 中执行，从而可以获取更新后的 DOM。

```js
const callbacks = []
let pending = false
function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}
```

Vue 中的全局 API `Vue.nextTick`，和实例上的方法 `vm.$nextTick`，最后都是调用 `next-tick.js` 中实现的 `nextTick` 方法。

## 参考文档

[深入解析 EventLoop 和浏览器渲染、帧动画、空闲回调的关系](https://zhuanlan.zhihu.com/p/142742003)

[Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)

[Mutation Observer API](https://wangdoc.com/javascript/dom/mutationobserver.html)