const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

class MyPromise {
  constructor(executor) {
    if (executor === undefined) {
      throw new TypeError("Executor missing");
    }
    if (!isCallable(executor)) {
      throw new TypeError(`${executor} must be a function`);
    }
    this.status = PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (value instanceof MyPromise) {
        return value.then(resolve, reject);
      }
      if (this.status === PENDING) {
        this.value = value;
        this.status = FULFILLED;
        this.onFulfilledCallbacks.forEach((fn) => fn());
      }
    };

    const reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        this.onRejectedCallbacks.forEach((fn) => fn());
      }
    };

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = isCallable(onFulfilled) ? onFulfilled : (val) => val;
    onRejected = isCallable(onRejected)
      ? onRejected
      : (reason) => {
          throw reason;
        };
    const promise2 = new MyPromise((resolve, reject) => {
      const thenMicroTask = (func, value) => {
        queueMicrotask(() => {
          try {
            const result = func(value);
            resolvePromise(promise2, result, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      };
      if (this.status === FULFILLED) {
        thenMicroTask(onFulfilled, this.value);
      }
      if (this.status === REJECTED) {
        thenMicroTask(onRejected, this.reason);
      }
      if (this.status === PENDING) {
        this.onFulfilledCallbacks.push(() => {
          thenMicroTask(onFulfilled, this.value);
        });
        this.onRejectedCallbacks.push(() => {
          thenMicroTask(onRejected, this.reason);
        });
      }
    });
    return promise2;
  }

  static resolve(value) {
    return new MyPromise((resolve, reject) => {
      resolve(value);
    });
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  catch(errCallback) {
    return this.then(null, errCallback);
  }
  finally(callback) {
    return this.then(
      (res) => {
        return MyPromise.resolve(callback()).then(() => res);
      },
      (reason) => {
        return MyPromise.resolve(callback()).then(() => {
          throw reason;
        });
      }
    );
  }

  static all(values) {
    if (!isIterable(values)) {
      throw new TypeError(`${typeof values} ${values} is not iterable`);
    }
    const args = Array.from(values);
    return new MyPromise((resolve, reject) => {
      const result = [];
      let indexCount = 0;
      const processResultByIndex = (value, index) => {
        result[index] = value;
        indexCount++;
        if (indexCount === args.length) {
          resolve(result);
        }
      };
      for (let i = 0; i < args.length; i++) {
        const value = args[i];
        if (isPromise(value)) {
          value.then((res) => {
            processResultByIndex(res, i);
          }, reject);
        } else {
          processResultByIndex(value, i);
        }
      }
    });
  }

  static allSettled(values) {
    if (!isIterable(values)) {
      throw new TypeError(`${typeof values} ${values} is not iterable`);
    }
    const args = Array.from(values);
    return new MyPromise((resolve, reject) => {
      const result = [];
      let indexCount = 0;
      const processResultByIndex = (value, index, status) => {
        result[index] = {
          status,
          value,
        };
        indexCount++;
        if (indexCount === args.length) {
          resolve(result);
        }
      };
      for (let i = 0; i < args.length; i++) {
        const value = args[i];
        if (isPromise(value)) {
          value.then((res) => {
            processResultByIndex(res, i, 'fulfilled');
          }, reason => {
            processResultByIndex(reason, i, "rejected");
          });
        } else {
          processResultByIndex(value, i, 'fulfilled');
        }
      }
    });
  }

  static any(values) {
    if (!isIterable(values)) {
      throw new TypeError(`${typeof values} ${values} is not iterable`);
    }
    const args = Array.from(values);
    return new MyPromise((resolve, reject) => {
      const errors = []
      let indexCount = 0
      const processErrorsByIndex = (reason, index) => {
        errors[index] = reason
        indexCount++
        if (indexCount === args.length) {
          reject(new AggregateError(errors, "All promises were rejected"));
        }
      }
      for (let i = 0; i < args.length; i++) {
        const value = args[i]
        if (isPromise(value)) {
          value.then(resolve, err => {
            processErrorsByIndex(err, i)
          })
        } else {
          resolve(value)
        }
      }
    })
  }

  static race(values) {
    if (!isIterable(values)) {
      throw new TypeError(`${typeof values} ${values} is not iterable`);
    }
    const args = Array.from(values);
    return new MyPromise((resolve, reject) => {
      for (let i = 0; i < args.length; i++) {
        const value = args[i];
        if (isPromise(value)) {
          value.then(resolve, reject);
        } else {
          resolve(value);
        }
      }
    })
  }
}
function isIterable(argument) {
  return !!argument && typeof argument[Symbol.iterator] === "function";
}
function isPromise(argument) {
  return (
    isObject(argument) &&
    isCallable(argument.then) &&
    isCallable(argument.catch)
  );
}

const resolvePromise = (promise2, x, resolve, reject) => {
  // If promise and x refer to the same object, reject promise with a TypeError as the reason.
  if (promise2 === x) {
    throw new TypeError("Chaining cycle detected for promise #<Promise>");
  }
  // 2.3.3.3 只能调用一次
  let called = false;
  // 2.3.2 2.3.3 promise object function 判断
  if (isObject(x) || isCallable(x)) {
    let then;
    // 2.3.3.2 获取 then 属性失败直接 reject
    try {
      then = x.then;
    } catch (err) {
      if (called) return;
      called = true;
      reject(err);
    }
    if (isCallable(then)) {
      try {
        // 2.3.3.3 调用 then 方法
        then.call(
          x,
          (y) => {
            if (called) return;
            called = true;
            // 2.3.3.3.1 递归解析过程，then中返回promise的情况
            return resolvePromise(promise2, y, resolve, reject);
          },
          (r) => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } catch (err) {
        // 2.3.3.4 then 方式调用失败处理
        if (called) return;
        called = true;
        reject(err);
      }
    } else {
      // 2.3.3.4 普通值 直接 fulfill
      resolve(x);
    }
  } else {
    // 2.3.4 普通值，直接fulfill
    resolve(x);
  }
};

function isObject(argument) {
  return argument != null && typeof argument === "object";
}
function isCallable(argument) {
  return typeof argument === "function";
}

MyPromise.resolve(
  new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve("ok");
    }, 3000);
  })
)
  .then((data) => {
    console.log(data, "success");
  })
  .catch((err) => {
    console.log(err, "error");
  });

  MyPromise.resolve(456)
    .finally(() => {
      return new MyPromise((resolve, reject) => {
        setTimeout(() => {
          resolve(123);
        }, 3000);
      });
    })
    .then((data) => {
      console.log(data, "success");
    })
    .catch((err) => {
      console.log(err, "error");
    });

Promise.resolve(456)
  .finally(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(123);
      }, 3000);
    });
  })
  .then((data) => {
    console.log(data, "success");
  })
  .catch((err) => {
    console.log(err, "error");
  });

  var promise1 = MyPromise.resolve(3);
  var promise2 = 42;
  var promise3 = new MyPromise((resolve, reject) => {
    setTimeout(resolve, 1000, "foo");
  });

  MyPromise.all([promise1, promise2, promise3]).then((values) => {
    console.log(values);
  });

  var promise1 = MyPromise.resolve(3);
  var promise2 = new MyPromise((resolve, reject) =>
    setTimeout(reject, 1000, "foo")
  );
  var promises = [promise1, promise2];

MyPromise.allSettled(promises).then((results) => console.log(results));
  
const pErr = new MyPromise((resolve, reject) => {
  reject("总是失败");
});

const pSlow = new MyPromise((resolve, reject) => {
  setTimeout(resolve, 500, "最终完成");
});

const pFast = new MyPromise((resolve, reject) => {
  setTimeout(resolve, 100, "很快完成");
});

MyPromise.any([pErr, pSlow, pFast]).then((value) => {
  console.log(value);
  // pFast fulfils first
});
// 期望输出: "很快完成"

const pErr2 = new MyPromise((resolve, reject) => {
  reject("总是失败");
});

MyPromise.any([pErr2]).catch((err) => {
  console.log(err);
});

var promise1 = new MyPromise((resolve, reject) => {
  setTimeout(resolve, 2000, 'one');
});

var promise2 = new MyPromise((resolve, reject) => {
  setTimeout(resolve, 1000, 'two');
});

MyPromise.race([promise1, promise2]).then((value) => {
  console.log(value);
  // Both resolve, but promise2 is faster
});
// expected output: "two"


MyPromise.defer = MyPromise.deferred = function() {
  let deferred = {};

  deferred.promise = new MyPromise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
};

module.exports = MyPromise;