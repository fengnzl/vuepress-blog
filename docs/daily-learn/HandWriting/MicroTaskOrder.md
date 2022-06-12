# 微任务宏任务执行顺序题
## 题目一
```js
let obj = {
  num1: 117
}
let res = obj;
obj.child = obj = {
  num2: 935
};
var x = y = res.child.num2;
console.log(obj.child);
console.log(res.num1);
console.log(y);
```
输出顺序：
```js
// undefined
// 117
// 935
// 赋值操作是从右往左开始 如 a = b = 20 相当于 b 先赋值后 a 再赋值
// 属性访问优先级高于赋值操作，因此先是 obj.child = { num2: 935 },之后 obj = { num2: 935 }
```
## 题目二
```js
async function async1(){
  console.log('async1 start')
  await async2()
  console.log('async1 end')
}
async function async2(){
  console.log('async2')
}
console.log('script start')
setTimeout(function(){
  console.log('setTimeout')
},0)
async1()
new Promise((resolve)=>{
  console.log('promise1')
  resolve()
}).then(function (){
  console.log('promise2')
})
console.log('script end')
```
输出顺序：
```js
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout
```
## 题目三
```js
Promise.resolve().then(()=>{ 
  console.log('第一个回调函数：微任务1') 
  setTimeout(()=>{ console.log('第三个回调函数：宏任务2') },0) 
}) 
setTimeout(()=>{ 
  console.log('第二个回调函数：宏任务1') 
  Promise.resolve().then(()=>{ console.log('第四个回调函数：微任务2') }) 
},0)
```
输出顺序：
```js
// 第一个回调函数：微任务1
// 第二个回调函数：宏任务1
// 第三个回调函数：宏任务2 ❌ 第四个回调函数：微任务2
// 第四个回调函数：微任务2 ❌ 第三个回调函数：宏任务2
```
Promise 中的 then 函数会添加到 microTask 中，setTimeout 中的回调函数会添加到 macroTask 中，当执行上述代码的时候,首先以下代码会被添加到 microTask 任务队列中，
```js
()=>{ 
  console.log('第一个回调函数：微任务1') 
  setTimeout(()=>{ console.log('第三个回调函数：宏任务2') },0) 
}
```
然后继续向下执行， setTimeout 中的回调函数则会被添加到下一轮 macroTask 任务队列中，当当前代码执行完毕后，会先执行 microTask 队列中的任务，这时输出 `第一个回调函数：微任务1`, 之后遇到 setTimeout 函数，将其中的回调函数添加到下一轮的 macroTask 任务队列中，当前 macroTask 任务队列中只有以下回调函数
```js
console.log('第二个回调函数：宏任务1') 
Promise.resolve().then(()=>{ console.log('第四个回调函数：微任务2') })
``` 
如此反复，最后输出结果如上所示。
## 题目四
```js
console.log("start");
async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async2 end");
  await async3();
  console.log("async3 end");
}
function async2() {
  console.log("async");
}
function async3() {
  console.log("async3 start");
}
console.log("script start");
setTimeout(() => {
  console.log("setTimeOut");
}, 0);
async1();
new Promise(function (resolve) {
  console.log("promise1");
  resolve("promise2");
}).then((res) => {
  console.log(res);
});

console.log("script end");
```
输出顺序：
```js
// start
// script start"
// async1 start
// async
// promise1
// script end
// async2 end
// async3 start
// promise2
// async3 end
// setTimeOut
```
## 题目五
```js
let promiseFunc = function () {
  return new Promise((resolve, reject) => {
    console.log(this.name);
    setTimeout(function () {
      console.log(this.name);
      console.log('abc');
      resolve('cba');
    }, 2000);

    console.log('aaa');
  });
};

let Object1 = {
  name: 'james',
  func: promiseFunc,
};

Object1.func().then((result) => {
  console.log('result', result);
});
```
输出顺序：
```js
// james
// aaa
// undefined
// abc
// result cba
```
## 题目六
```js
console.log('start here');
const foo = () => {
  return new Promise((resolve, reject) => {
    console.log('first promise constructor');
    let promise1 = new Promise((resolve, reject) => {
      console.log('second promise constructor');
      setTimeout(() => {
        console.log('setTimeout here');
        resolve();
      }, 0);

      resolve('promise1');
    });

    resolve('promise0');
    promise1.then((arg) => {
      console.log(arg);
    });
  });
};

foo().then((arg) => {
  console.log(arg);
});

console.log('end here');
```
输出顺序：
```js
// start here
// first promise constructor
// second promise constructor
// end here
// promise1
// promise0
// setTimeout here
```
## 题目七
```js
console.log('Script开始')
setTimeout(() => {
  console.log('第一个回调函数，宏任务1')
  Promise.resolve().then(function() {
    console.log('第四个回调函数，微任务2')
  })
}, 0)
setTimeout(() => {
  console.log('第二个回调函数，宏任务2')
  Promise.resolve().then(function() {
    console.log('第五个回调函数，微任务3')
  })
}, 0)
Promise.resolve().then(function() {
  console.log('第三个回调函数，微任务1')
})
console.log('Script结束')
```
输出顺序：
```js
// Script开始
// Script结束
// 第三个回调函数，微任务1
// 第一个回调函数，宏任务1
// 第四个回调函数，微任务2
// 第二个回调函数，宏任务2
// 第五个回调函数，微任务3
```
## 题目八
```js
console.log('Script开始')
setTimeout(() => {
  console.log('宏任务1（setTimeout)')
  Promise.resolve().then(() => {
    console.log('微任务promise2')
  })
}, 0)
setImmediate(() => {
  console.log('宏任务2')
})
setTimeout(() => {
  console.log('宏任务3（setTimeout)')
}, 0)
console.log('Script结束')
Promise.resolve().then(() => {
  console.log('微任务promise1')
})
process.nextTick(() => {
  console.log('微任务nextTick')
})
```
输出顺序：
```js
// Script开始
// Script结束
// 微任务nextTick
// 微任务promise1
// 宏任务1（setTimeout）
// 微任务promise2
// 宏任务3（setTimeout)
// 宏任务2 顺序不定，可以在红任务1 与红任务3 之前或之后
```

**注意**：
- 微任务中 process.nextTick 优先级最高
- setTimeout 和 setImmediate 在 I/O 周期内，则 setImmediate 最先执行，在 I/O 周期之外则顺序不定

具体可看[官方文档](https://nodejs.org/zh-cn/docs/guides/event-loop-timers-and-nexttick/)

## 题目九
```js
async function async1 () {
  console.log('async1 start');
  await new Promise(resolve => {
    console.log('promise1')
    resolve('promise1 resolve')
  }).then(res => console.log(res))
  console.log('async1 success');
  return 'async1 end'
}
console.log('script start')
async1().then(res => console.log(res))
console.log('script end')
```
输出顺序：
```js
// script start
// async1 start
// promise1
// script end
// promise1 resolve
// async1 success
// async1 end
```
# Promise 执行相关
## 题目一
```js
Promise.reject('err!!!')
  .then((res) => {
    console.log('success', res)
  }, (err) => {
    console.log('error', err)
  }).catch(err => {
    console.log('catch', err)
  })
```
输出顺序：
```js
// error err!!!
```
## 题目二
```js
Promise.resolve()
  .then(function success (res) {
    throw new Error('error!!!')
  }, function fail1 (err) {
    console.log('fail1', err)
  }).catch(function fail2 (err) {
    console.log('fail2', err)
  })
```
输出顺序：
```js
// fail2 Error error!!!
```
## 题目三
```js
Promise.resolve('1')
  .then(res => {
    console.log(res)
  })
  .finally(() => {
    console.log('finally')
  })
Promise.resolve('2')
  .finally(() => {
    console.log('finally2')
  	return '我是finally2返回的值'
  })
  .then(res => {
    console.log('finally2后面的then函数', res)
  })
```
输出顺序
```js
// 1
// finally2
// finally
// finally2后面的then函数 2
```
## 题目四
```js
function promise1 () {
  let p = new Promise((resolve) => {
    console.log('promise1');
    resolve('1')
  })
  return p;
}
function promise2 () {
  return new Promise((resolve, reject) => {
    reject('error')
  })
}
promise1()
  .then(res => console.log(res))
  .catch(err => console.log(err))
  .finally(() => console.log('finally1'))

promise2()
  .then(res => console.log(res))
  .catch(err => console.log(err))
  .finally(() => console.log('finally2'))
```
输出顺序：
```js
// promise1
// 1
// error
// finally1
// finally2
```
## 题目五
```js
async function async1 () {
  try {
    await Promise.reject('error!!!')
  } catch(e) {
    console.log(e)
  }
  console.log('async1');
  return Promise.resolve('async1 success')
}
async1().then(res => console.log(res))
console.log('script start')
```
输出顺序：
```js
// script start
// ❌ error!!! 
// async1
// async1 success
```
## 题目六
```js
const p1 = new Promise((resolve) => {
  setTimeout(() => {
    resolve('resolve3');
    console.log('timer1')
  }, 0)
  resolve('resolve1');
  resolve('resolve2');
}).then(res => {
  console.log(res)
  setTimeout(() => {
    console.log(p1)
  }, 1000)
}).finally(res => {
  console.log('finally', res)
})
```
输出顺序：
```js
// resolve1
// finally ❌ finally undefined
// timer1
// Promise{ [[PromiseState]]: 'FULFILLED' }
```