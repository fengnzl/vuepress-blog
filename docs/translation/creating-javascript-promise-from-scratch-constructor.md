# 从零实现 Promise 函数，Part 1：构造器

::: tip

* 原文：[Creating a JavaScript promise from scratch, Part 1: Constructor](https://humanwhocodes.com/blog/2020/09/creating-javascript-promise-from-scratch-constructor/)
* 作者：[Nicholas C. Zakas](https://humanwhocodes.com/)
* 翻译：[城南花已开](https://recoverymonster.github.io/)

:::

在我的早期职业生涯，通过尝试自己重现在网站上看到的功能，我学到了很多。是几年来，我发现深入理解某个事物的运行机制非常有帮助。理解事物的最好方法就是将其分解并重组。这就是当我决定加深对 `promise` 的理解时，我开始考虑从头实现 `promise` 的原因。

是的，在我写的关于 ECMAScript 6 的书中提及了 `promise`，但是那时，`promise` 仍然是很新的事物并且尚未在所有地方实现。 我对其内部工作机制做了最大努力的猜想，但是我从来没有真正自己的理解感到满意。 因此，我决定转而通过 ECMA-262 对 `promises`[^1] 的描述来从头开始实现该功能。

在这一系列文章中，我将深入我自己的 promise 库  [Pledge](https://github.com/humanwhocodes/pledge) 。我希望通过讲述其中的代码能够帮助每个人理解 `promise` 是如何工作的。

## Pledge 介绍

Pledge 是一个实现了 ECMA-262 promises 规范的一个独立 JavaScript 库。我选择使用 “Pledge” 这个名称而不是 “Promise”，是为了区分原始 `promise` 函数中的功能和函数库中的相关部分。因此，无论规范中在哪里使用了 “promise”，我都已在库中将其替换为 “Pledge”。

如果正确的实现了 `promise` ，那么 `Pledge` 类应该与原始 `Promise` 类的功能一样，如以下的例子：

```js
import { Pledge } from "https://unpkg.com/@humanwhocodes/pledge/dist/pledge.js";

const pledge = new Pledge((resolve, reject) => {
    resolve(42);

    // or

    reject(42);
});

pledge.then(value => {
    console.log(then);
}).catch(reason => {
    console.error(reason);
}).finally(() => {
    console.log("done");
});

// create resolved pledges
const fulfilled = Pledge.resolve(42);
const rejected = Pledge.reject(new Error("Uh oh!"));
```

能够看到每个代码示例的背后，使我更好地理解了 `Promise`，我希望它能同样帮助你理解其背后运行机制。

**注意：**该库不适用于生产。 它仅用作教育工具。 没有理由不使用原始的 `Promise` 功能。

## promise 的内部属性

ECMA-262[^2] 为 `Promise` 实例指定了以下内部属性（在规范中称为 *slots*）：

| Internal Slot                 | Description                                                  |
| ----------------------------- | ------------------------------------------------------------ |
| `[[PromiseState]]`            | `pending`,`fulfilled` 和 `rejected` 其中一个。管理 `promise` 如何响应对 `then` 方法的调用 |
| `[[PromiseResult]]`           | 若有，则是 `promise` 被 `fulfilled` 或者 `rejected` 的值，只在 `[[PromiseState]]` 状态不为 `pending` 时才有意义 |
| `[[PromiseFulfillReactions]]` | `PromiseReaction` 记录列表，当/如果 Promise 从 `pending` 状态转换为 `fulfilled` 状态时将被处理 |
| `[[PromiseRejectReactions]]`  | `PromiseReaction` 记录列表，当/如果 Promise 从 `pending` 状态转换为 `rejected` 状态时将被处理 |
| `[[PromiseIsHandled]]`        | 一个布尔值，表明 `promise` 是否曾经有一个 `fulfillment` 或 `rejection` 处理程序，用于追踪未处理的 `rejection` |

因为这些属性对开发者不可见，但是为了更好的追踪和操作需要在实例上存在，我选择使用 `symbols` 作为他们的标识符，并创建了 `PledgeSymbol` 对象，从而在不同的文件中引用它们更加方便。

```js
export const PledgeSymbol = Object.free({
  state: Symbol('PledgeState'),
  result: Symbol('PledgeResult'),
  isHandled: Symbol('PledgeIsHandled'),
  fulfillReactions: Symbol('PledgeFulfillReactions'),
  rejectReactions: Symbol('PledgeReRejectReactions'),
})
```

随着 `PledgeSymbol` 定义，现在我们开始创建 `Pledge` 的构造器 `constructor`。

## `Promise` 的构造器时如何工作的

`Promise` 的构造器在 JavaScript 中被用来创建 promise 实例。传入一个函数(称为 *executor*)，该函数接收两个参数，`resolve` 和 `reject`，这两个函数将完成 promise 的生命周期。`resolve` 函数将 promise 解析为某个值（或没有值），而`reject` 函数则为某个原因（或者没有原因）拒绝 promise。例如：

```js
const promise = new Promise((resolve, reject) => {
    resolve(42);
});

promise.then(value => {
    console.log(value);     // 42
})
```

executor 函数立即执行，因此例子中的 `promise` 变量已经随着 `42` 而 fulfilled（内部属性`[[PromiseState]]` 值变为 `Fulfilled`）。（如果调用 `reject()` 而不是 `resolve()`，那么 `promise` 的状态将会变为 rejected）。

此外，如果 executor 直接抛出错误，那么该错误将会被捕捉，`promise` 的状态变为 rejected，如下所示：

```js
const promise = new Promise((resolve, reject) => {
    throw new Error("Oops!");
});

promise.catch(reason => {
    console.log(reason.message);     // "Oops!"
})
```



[^1]: [Promise Objects](https://www.ecma-international.org/ecma-262/11.0/index.html#sec-promise-objects)
[^2]: [Properties of Promise instance](https://www.ecma-international.org/ecma-262/11.0/index.html#sec-properties-of-promise-instances)

