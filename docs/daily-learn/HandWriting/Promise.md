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