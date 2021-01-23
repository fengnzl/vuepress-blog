# 理解 Async Await

::: tip

* 原文：[Understanding Async Await](https://css-tricks.com/understanding-async-await/)
* 作者：[Sarah Drasner](https://css-tricks.com/author/sdrasner/)
* 翻译：[城南花已开](https://recoverymonster.github.io/)

:::

当进行 web 编程时，最后，你需要执行一些过程，这可能需要花费一些时间才能完成。JavaScript 并不能同时执行多任务，因此我们需要能处理这些长期运行进程的方法。

Async/Await 是一种基于时间队列处理的方法。尤其非常适用于进行大量的网络请求并且需要处理结果数据的工作。让我们来深入了解他们。

## Promise? Promise.

Async/Await 是一种 Promise 类型。[Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) 是有多种状态的对象（类似人的一生）。之所以这样做，这是因为有时候我们请求并不能立即获得所需信息，并且我们需要能够检测它的状态。

就像有些人请求你承诺帮他们做某些事情，如帮助他们移动。初始状态就是当他们请求的时刻。但直到你出现并帮助他们移动你才兑现了对他们的成诺。如果你取消了你的计划，你就拒绝了承诺。

类似的，Promise 在 JavaScript 中有三种状态：

* pending：当你第一次调用 promise，同时不知道 promise 会返回什么。、
* fulfilled：意味着操作成功完成。
* rejected：操作失败

以下是 promise 在上述状态中的例子：

这是 fulfilled 状态，我们存储一个名为 `getSomeTacos` 的 promise，传入 resolve 和 reject 参数。我们告诉 promise 一切都已经 resolved，然后允许我们进行两次 console.log 的输出。

``` js
const getSomeTacos = new Promise((reslove, reject) => {
    console.log("Initial state: Excuse me can I have some tacos");

    reslove();
  })
  .then(() => {
    console.log('Order some tacos');
  })
  .then(() => {
    console.log('Here are some tacos');
  })
  .catch(err => {
    console.log('Nope! No tacos for you');
  })
```

``` console
Initial state: Excuse me can I have some tacos
Order some tacos
Here are some tacos
```

如果我们选择了 rejected 状态，我们再执行相同的函数但是这次选择 reject。那么在控制台将会输出的是 Initial State 和 catch error：

``` js
const getSomeTacos = new Promise((reslove, reject) => {
    console.log("Initial state: Excuse me can I have some tacos");

    reject();
  })
  .then(() => {
    console.log('Order some tacos');
  })
  .then(() => {
    console.log('Here are some tacos');
  })
  .catch(err => {
    console.log('Nope! No tacos for you');
  })
```

``` console
Initial state: Excuse me can I have some tacos
Nope! No tacos for you.
```

这次我们选择 pending 状态，我们只是简单的 `console.log` 我们保存的， `getSomeTacos` 。将会打印出 pending 状态，因为这是 promise 所处的状态。

``` js
console.log(getSomeTacos);
```

``` console
Initial state: Excuse me can I have some tacos
Promise { <pending> }
Nope! No tacos for you
```

## What then?

 但是其中有一个部分使我非常困惑。从 promise 中获取值，你必须使用 `.then()` 或者返回一些能解决 promise 的协议。如果你仔细思考一下，这是有意义的，因为你需要捕捉它最终的状态，而不是初始状态，因为它初始的状态为 pending。这就是为什么当我们打印 promise 整体的时候会出现 `Promise {<pending>}` 。在那执行过程中还没有任何 resolve。

Async/Await 就是上面提到的 promises 的语法糖。下面是一个小示例，演示我如何通过 promise 使用它，来按计划进行多次执行。

``` js
async function tacos() {
  return await Promise.resolve("Now and then I get to eat delicious tacos!")
};

tacos().then(console.log)
```

另一个更加深入的例子：

``` js
// this is the action we want to schedule. it's a promise.
const addOne = x => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log( `I added one! Now it's ${x + 1}.` );
      resolve();
    }, 2000);
  })
}

// we will immediately log the first one,
// then the addOne promise will run, taking 2 seconds
// then the final console.log will fine
async function addAsync() {
  console.log('I have 10');
  await addOne(10);
  console.log( `Now I'm done!` );
}

addAsync();
```

``` console
I have 10
I added one! Now it's 11.
Now I'm done!
```

## One thing (a)waits for another

通常 Async/Await 是用来链接多个异步调用。这里，我们将会获取一些 JSON，并用于下次调用中，来确定我们想从第二个 API 获取什么类型的东西。在这个案例里，我们想要获取一些编程笑话，但是首先我们需要从不同 API中 确定想要什么类型的引用。

第一个 JSON 文件看起来是这样，我们想引用的类型是 random：

``` json
{
	"type": "random"
}
```

第二个 API 返回的内容看起来是这样，给定刚获取的 `random` 查询参数：

``` json
{
  "_id":"5a933f6f8e7b510004cba4c2",
  "en":"For all its power, the computer is a harsh taskmaster. Its programs must be correct, and what we wish to say must be said accurately in every detail.",
  "author":"Alan Perlis",
  "id":"5a933f6f8e7b510004cba4c2"
}
```

我们调用 `async` 函数，然后检索 `.json` 文件并等待，直到 API 获取到数据。一旦上述情况发生，我们就可以对响应进行处理，如添加到页面中。

``` js
async function getQuote() {
  // get the type of quote from one fetch call, everything else waits for this to finish
  let quoteTypeResponse = await fetch( `https://s3-us-west-2.amazonaws.com/s.cdpn.io/28963/quotes.json` )
  let quoteType = await quoteTypeResponse.json()

  // use what we got from the first call in the second call to an API, everything else waits for this to finish
  let quoteResponse = await fetch("https://programming-quotes-api.herokuapp.com/quotes/" + quoteType.type)
  let quote = await quoteResponse.json()

  // finish up
  console.log('done')
}
```

我们可以通过箭头函数和模板字符串来简化代码：

``` js
async function getQuote() {
  // get the type of quote from one fetch call, everything else waits for this to finish
  let quoteType = await fetch( `quotes.json` ).then(res => res.json())

  // use what we got from the first call in the second call to an API, everything else waits for this to finish
  let quote = await fetch( `programming-quotes.com/${quoteType.type}` ).then(res => res.json())

  // finish up
  console.log('done')
}

getQuote()
```

[点击查看动画描述过程。](https://codepen.io/sdras/pen/beda29c3add8da32650b758cdd05457c)

## Try, Catch, Finally

最后我们想要在此过程中添加错误状态。为此我们有方便的 `try` 、 `catch` 和 `finally` 块。

``` js
try {
  // I’ll try to execute some code for you
} catch (error) {
  // I’ll handle any errors in that process
} finally {
  // I’ll fire either way
}
```

让我们通过这个语法来重构上述的代码，并捕获任何错误。

``` js
async function getQuote() {
  try {
    // get the type of quote from one fetch call, everything else waits for this to finish
    let quoteType = await fetch( `quotes.json` ).then(res => res.json())

    // use what we got from the first call in the second call to an API, everything else waits for this to finish
    let quote = await fetch( `programming-quotes.com/${quoteType.type}` ).then(res => res.json())

    // finish up
    console.log('done')
  } catch (error) {
    console.warn( `We have an error here: ${error}` )
  }
}

getQuote()
```

在这里我们没有使用 `finally` ，是因为我们并不是总想使用它。这是无论成功还是失败都会执行的块。如果你需要在 `try` 和 `catch` 中复制东西时，可以考虑使用 `finally` 。我通常将它用于一些清除工作，如果你想了解更多，可以参考我写的[这篇文章](https://css-tricks.com/finally-a-post-on-finally-in-promises/)。

你可能需要更复杂的错误处理，例如取消 async 函数。非常不幸的是，并没有实现此功能的原生方法，但谢天谢地， Kyle Simpson 创建了一个 [CAF 的函数库](https://github.com/getify/CAF)可以实现此功能。

## Further Reading

对于 Async/Await 的解释通常是从回调开始，然后是 Promise，然后使用这些解释来构成 Async/Await。因为 Async/Await 现在已经有了很好的支持，所以我们并没有讲述这些所有的步骤。这仍然是一个很好的背景知识，特别是当你需要维护旧代码的时候。这些是我最喜欢的资源：

* [Async JavaScript: From Callbacks, to Promises, to Async/Await](https://tylermcginnis.com/async-javascript-from-callbacks-to-promises-to-async-await/) (Tyler McGinnis)
* [Asynchronous JavaScript with async/await](https://egghead.io/courses/asynchronous-javascript-with-async-await) (Marius Schulz)
* [Mastering Async JavaScript](https://frontarm.com/courses/async-javascript/) (James K. Nelson)
