# 手写 Promise
## Promise/A+

我们需要遵守 [Promise/A+](https://promisesaplus.com/) 规范来书写，业界基本上所有的 Promise 类库都是遵循这个规范。
## Promise 基础实现
```js
const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

class MyPromise {
  constructor(executor) {
    if (executor === undefined) {
      throw new TypeError('Executor missing')
    }
    if (!isCallable(executor)) {
      throw new TypeError(`${executor} must be a function`)
    }
    this.status = PENDING
    this.value = undefined
    this.reason = undefined
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []

    const resolve = (value) => {
      if (this.status === PENDING) {
        this.value = value
        this.status = FULFILLED
        this.onFulfilledCallbacks.forEach(fn => fn())
      }
    }

    const rejected = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }

    try {
      executor(resolve, rejected)
    } catch (e) {
      rejected(e)
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = isCallable(onFulfilled) ? onFulfilled : val => val
    onRejected = isCallable(onRejected) ? onRejected : reason => { throw reason }
    const promise2 = new MyPromise((resolve, reject) => {
      const thenMicroTask = (func, value) =>  {
        queueMicrotask(() => {
          try {
            const result = func(value)
            resolvePromise(promise2, result, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      if (this.status === FULFILLED) {
        thenMicroTask(onFulfilled, this.value)
      }
      if (this.status === REJECTED) {
        thenMicroTask(onRejected, this.reason)
      }
      if (this.status === PENDING) {
        this.onFulfilledCallbacks.push(() => {
          thenMicroTask(onFulfilled, this.value)
        })
        this.onRejectedCallbacks.push(() => {
          thenMicroTask(onRejected, this.reason)
        })
      }
    })
    return promise2
  }
}

const resolvePromise = (promise2, x, resolve, reject) => {
  // If promise and x refer to the same object, reject promise with a TypeError as the reason.
  if (promise2 === x) {
    throw new TypeError('Chaining cycle detected for promise #<Promise>')
  }
  // 2.3.3.3 只能调用一次
  let called = false
  // 2.3.2 2.3.3 promise object function 判断
  if (isObject(x) || isCallable(x)) {
    let then
    // 2.3.3.2 获取 then 属性失败直接 reject
    try {
      then = x.then
    } catch (err) {
      if (called) return
      called = true
      reject(err)
    }
    if (isCallable(then)) {
      try {
        // 2.3.3.3 调用 then 方法
        then.call(
          x,
          (y) => {
            if (called) return
            called = true
            // 2.3.3.3.1 递归解析过程，then中返回promise的情况
            return resolvePromise(promise2, y, resolve, reject)
          },
          (r) => {
            if (called) return
            called = true
            reject(r)
          }
        )
      } catch (err) {
        // 2.3.3.4 then 方式调用失败处理
        if (called) return
        called = true
        reject(err)
      }
    } else {
      // 2.3.3.4 普通值 直接 fulfill
      resolve(x)
    }
  } else {
    // 2.3.4 普通值，直接fulfill
    resolve(x)
  }
}

function isObject(argument) {
  return argument != null && typeof argument === 'object'
}
function isCallable(argument) {
  return typeof argument === 'function'
}
```
## 判断是否符合规范
Promise/A+ 规范提供了测试脚本，可以测试代码是否符合规范，我们只需要在以上实现代码中增加如下代码：
```js
MyPromise.defer = MyPromise.deferred = function () {
  let deferred = {};

  deferred.promise = new MyPromise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
};

module.exports = MyPromise
```

然后安装测试脚本
```js
npm install -g promises-aplus-tests
```
根据当前文件名运行如下命令，即可看到测试结果
```js
promises-aplus-tests [filename].js
```
## Promise API 实现
除了上述已经实现代码，原生 Promise 还提供了以下方法：
- Promise.resolve()
- Promise.reject()
- Promise.prototype.catch()
- Promise.prototype.finally()
- Promise.all()
- Promise.allSettled()
- Promise.any()
- Promise.race()

下面就来对上述的方法进行实现
### Promise.resolve
> Promise.resolve(value)方法返回一个以给定值解析后的 Promise 对象。
> 
> 返回的 promise 会“跟随”这个 thenable 的对象，采用它的最终状态；

```js
class MyPromise {
  // ...
  static resolve(value) {
    return new MyPromise((resolve, reject) => {
      resolve(value)
    })
  }
}
```
需要注意的是，如果参数是一个 Promise 那么将会等待这个 Promise 解析完毕，之后才会继续向下执行，因此我们需要在 resolve 函数中做如下处理

```js
class MyPromise {
  constructor(executor) {
    //...
    const resolve = value => {
      // 如果 value 是一个promise，则要实现一个递归解析
      if (value instanceOf MyPromise) {
        return value.then(resolve, reject)
      }
      if (this.status === PENDING) {
        this.value = value
        this.status = FULFILLED
        this.onFulfilledCallbacks.forEach(fn => fn())
      }
    }
    //...
  }
}
```
简单测试一下
```js
MyPromise.resolve(new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('ok');
  }, 3000);
})).then(data=>{
  console.log(data,'success')
}).catch(err=>{
  console.log(err,'error')
})

```
以上代码将在 `3s` 之后输出 `ok success`
### Promise.reject 实现
> Promise.reject() 方法返回一个带有拒绝原因的 Promise 对象。
```js
class MyPromise {
  //...
  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason)
    })
  }
}
```
### Promise.prototype.catch
> catch() 方法返回一个 Promise ，并且处理拒绝的情况。它的行为与调用Promise.prototype.then(undefined, onRejected) 相同。(事实上，calling obj.catch(onRejected) 内部 calls obj.then(undefined, onRejected)).

```js
class MyPromise {
  //...
  catch (errorCallback) {
    return this.then(undefined, errorCallback)
  }
}
```
### Promise.prototype.finally
> finally() 方法返回一个 Promise。在 promise 结束时，无论结果是 fulfilled 或者是 rejected，都会执行指定的回调函数。这为在 Promise 是否成功完成后都需要执行的代码提供了一种方式。
 >这避免了同样的语句需要在 then() 和 catch() 中各写一次的情况。

如果返回的是成功的 promise，则会采用上一次的结果，如果是失败的 promise, 则会将这个失败的结果传到 catch 中。
```js
class MyPromise {
  //...
  finally (callback) {
    return this.then(value => {
      return MyPromise.resolve(callback).then(() => value)
    }, reason => {
      return MyPromise.resolve(callback).then(() => { throw reason })
    })
  }
}
```
简单的测试代码如下：
```js
MyPromise.resolve(456).finally(()=>{
  return new MyPromise((resolve,reject)=>{
    setTimeout(() => {
        resolve(123)
    }, 3000);
  })
}).then(data=>{
  console.log(data,'success')
}).catch(err=>{
  console.log(err,'error')
})
```
等待 `3s` 后输出 `456 success`

