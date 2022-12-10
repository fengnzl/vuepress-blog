---
sidebarDepth: 2
---
# Vue 响应式

这里主要记录课程中 Vue 响应式和插件部分原理和简单实现。


## 响应式

我们在实际编程中可能对响应式（ reactivity ）存在一些误解和混淆。对于某些人来说，可能仅仅意味着 rx。实际上响应式编程就是类似流之类的东西，但在我们的上下文（即 Vue）中，这实际意味着当你改变状态时，状态是如何使得整个系统做出相应的变化以及更新的。

在这里，这意味着状态的改变是如何影响 DOM 的，以及 Vue 是如何跟踪这边变化的。首先让我们假设一个变量 `a=3` 。然后我们拥有另外一个变量它等于 10 倍的 a 。因此这就是一个需求，变量 b 应该一直等于 10 倍的 a 。你可以像以下代码一样实现它。

```js
let a = 3;
let b = a * 10;
```

上面是典型的命令式编程，问题是当 a 发生变化时，b 并不会发生变化，因为这是过程式的，两个变量之间的关系并不同步。

```js
console.log(b);// 30
a = 4;
console.log(b); // 30
b = a * 10;
console.log(b); // 40
```

所以我们如何使其保持他们之间同步变化，除了类似上面的每次都进行手动更新，实际上我们希望他们的关系是声明式的。类似一个 Excel 表中，我们可以使用函数来表明两个单元格的联系，单元格 B 永远是单元格 A 的十倍，但是在项目中我们应该怎么办呢？

![image-20200313000231011](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20200313000234.png)

如果我们有一个 `onAChanged` 函数，它接收一个内部函数，并且每当 a 变化的时候，函数都会执行一次，这样我们的问题就解决了。所以这个函数应该如何实现呢？

```js
onAchanged(()=>{
	b = a * 10;
})
```

但在深入研究这个问题之前，让我们先把这个问题转换成更接近web开发的东西。这里我们有一个 span cell，通过 DOM API 来描述其与 cell a 的关系。但是如果我们将其包裹在 `onStateChanged` 函数中，它们就变成声明式的了。

```js
<span class="cell b1"></span>

document
  .querySelector('.cell b1')
  .textContent = state.a * 10;

onStateChanged(() => {
    document
      .querySelector('.cell b1')
      .textContent = state.a * 10;
})
```

如果我们进一步抽象，把这个命令式的 DOM 抽象成模板语言，我们实际上创建了一个 Vue 库。

```js
<span class="cell b1">
  {{ state.a * 10 }}
</span>

onStateChanged(() => {
  view = render(state);
})
```

这里的内部函数`view = render(state)` 实际上是所有 Vue 渲染系统如何工作的高度抽象。这里面包括了 DOM、DOM 实现、virtual DOM 实现的所有细节。

这里我们主要关注外层函数 `onStateChanged` 具体是怎么实现的，下面的代码可能展示其大概是如何实现的。

```js
let update;
const onStateChanged = _update => {
	update = _update;
};
const setState = newState => {
	state = newState;
	update();
};
```

它只是将更新函数保存在某个地方，我们不允许用户任意操纵状态，而是要求他们总是通过调用函数 `setState` 来操纵状态。`setState` 只是简单的接收 newState 并将旧的 state 进行替换，然后调用 `update` 函数。如果你使用 React，你会发现两者非常相似。因为 React 迫使你触发 setState 的状态进行更改：

```js
onStateChanged(() => {
	view = render(state);
})
setState({ a: 5 });
```

这就是 React 内部工作机制的简单概括，但是在 Angular 和 Vue 中我们不通过调用 setState 函数来操作 state。

![image-20200313003651072](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20200313003652.png)

所以它是如何实现的呢？Angular 和 Vue 的实现方法有所不同，因为 angular 使用的是 `dirty checking`（脏数据检查机制），它在某种程度上会拦截你的事件，例如点击执行摘要循环。 然后它会检查所有事物，是否已更改。而 vue 则是做的更加细致，它将对象的状态变成响应式的。

vue 通过 ES5 的`Object.defineProperty` API，将所有的属性变成了 `getter` 和 `setter`。因此在上面的 state.a ，我们实际上将 a 转换成了 getter 和 setter。在其他情景中，我们将会做一些有趣的事情，例如我们将 `onStateChanged` 函数重名为 `autorun` 函数，这本上是一种基本的依赖追踪形式。

![image-20200313004844742](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20200313004846.png)

我们会实现一个小型数据观察者，它类似于在 vue 中的工作方式。

### Getters and Setters

实现一个 `convert` 函数：

- 接收一个对象作为参数
- 使用 Object.defineProperty 函数将对象的属性转换为 getter 和 setter
- 转换后的度系i昂需要保持初始行为，同时输出所有 get/set 操作

``` js
测试案例：
const obj = { foo: 123 }
convert(obj)

obj.foo // should log: 'getting key "foo": 123'
obj.foo = 234 // should log: 'setting key "foo" to: 234'
obj.foo // should log: 'getting key "foo": 234'
```

**代码实现：**

``` js
function convert(obj) {
  Object.keys(obj).forEach(function (val) {
    let initialValue = obj[val];
    Object.defineProperty(obj, val, {
      get() {
        console.log(`getting key "${val}": ${initialValue}`);
        return initialValue;
      },
      set(newVal) {
        initialValue = newVal;
        console.log(`setting key "${val}" to: ${newVal}`);
      }
    })
  })；
  return obj;
}
```

### Dependency Tracking

目标：

- 创建一个 `Dep` 类，包含 `depend` 和 `notify` 函数

- 创建一个 `autorun` 函数，它接收一个 updater 函数

- 在 updater 函数内部，可以通过调用 `dep.depend()` 函数来显式的依赖于 `Dep` 的实例

- 最后，你可以调用 `dep.notify()` 函数来触发 updater 函数执行

  ``` js
  // 测试案例如下
  const dep = new Dep()
  autorun(() => {
    dep.depend()
    console.log('updated')
  })
  // should log: "updated"
  
  dep.notify()
  // should log: "updated"
  ```

  **实现代码：**

  ``` js
  window.Dep = class Dep {
    constructor() {
      this.subscirber = new Set();
    }
    depend() {
      if (activeUpdate) {
        this.subscirber.add(activeUpdate);
      }
    }
    notify() {
      this.subscirber.forEach(sub => sub());
    }
  }
  
  let activeUpdate = null;
  function autorun(update) {
    function wrappedFunction() {
      activeUpdate = wrappedFunction;
      update();
      activeUpdate = null;
    }
    wrappedFunction();
  }
  ```


### Mini Observer

结合前面的两个函数，将 `convert()` 重命名为 `observe()`，并保留 `autorun()`。

- `observe()` 函数接收一个对象，并将对象的属性变成响应式的。对于每一个转换的属性，它被分配一个 `Dep` 实例，该实例跟踪订阅更新函数的列表，并在调用其 `setter` 时触发它们重新运行。
- `autorun()` 函数接受一个 update 函数，并在 update 函数订阅的属性发生变化时重新运行它。如果 update 函数在计算期间依赖于某个属性，则 update 函数被该属性 subscribing。

``` js
// 测试案例
const state = {
  count: 0
}

observe(state)

autorun(() => {
  console.log(state.count)
})
// should immediately log "count is: 0"

state.count++
// should log "count is: 1"
```

**代码实现如下：**

```js
//这是依赖性跟踪的一个非常简化的版本 
// system used in Vue, Knockout, MobX and Meteor Tracker (each with different
// implementation details, of course). 
// 它不能覆盖所有可能的边界情况，也不处理数组;
class Dep {
    constructor() {
      this.subscribers = new Set();
    }
    depend() {
      if (activeUpdate) {
        this.subscribers.add(activeUpdate);
      }
    }
    notify() {
      this.subscribers.forEach(sub => sub());
    }
  }

  function observe(obj) {
    //遍历对象上的所有属性将它们转换成getter/setter
	// Object.defineProperty ()
    Object.keys(obj).forEach(function (val) {
      let initialValue = obj[val];
      //每个属性都有一个依赖实例
      const dep = new Dep();
      Object.defineProperty(obj, val, {
        // getter负责注册订阅者
        get() {
          dep.depend();
          return initialValue;
        },
        // set 负责通知更改
        set(newVal) {
          const changed = newVal !== initialValue;
          initialValue = newVal;
          // 触发re-computation
          if (changed) {
            dep.notify();
          }
        }
      })
    });
    return obj;
  }

  let activeUpdate = null;

  function autorun(update) {
    //将原始更新函数包装成一个“job”函数，该函数注册并
	//在调用时将自身注销为当前活动job
    const wrappedUpdate = () => {
      activeUpdate = wrappedUpdate;
      update();
      activeUpdate = null;
    };
    wrappedUpdate();
  }
```

## 插件

> ###### [Vue.use( plugin )](https://cn.vuejs.org/v2/api/#Vue-use)

plugin 其实就是一个函数，它接收两个参数，第一个参数是 Vue，第二个参数是可选参数，如下所示：

```js
function (Vue, options) {
	// ... plugin code
}
```

然后你在该函数内部编写一些 Vue  代码。当我们编写插件时，通常会用到 Vue.mixin API 。mixin 本质上是部分可重用代码片段或者部分 Vue 组件选项，它们可以被混合到现有组件中。因此我们可以在每个组件的基础上使用它们，但是 Vue.mixin 是一个全局 API，它将影响**每一个**之后创建的 Vue 实例。所以使用时需要格外的小心！

> ###### [Vue.mixin( options )](https://cn.vuejs.org/v2/api/#Vue-mixin)

如果想在 Vue APP 中使用一些全局功能，那么我们将会使用全局混入。推荐将其作为 plugin 的一个接口来使用，因为 `Vue.use` 会自动阻止多次注册相同插件，届时即使多次调用也只会注册一次该插件。

`vue.mixin` 不会自动删除，从而通过插件将其发布，可以避免应用重复混入。另一个比较常用的是实例属性 `$options`。

`$options` 存在于每个组件中，它包含了当前 Vue 实例的初始化选项，因为我们知道 Vue 组件可以来自各个地方，可能来自全局的 mixins ，可能来自组件自己的定义，肯呢个来自创建实例时你所传递的 options ，同时也有可能来自通过 `vue.extend` 创建的关系链中的组件。而这些最终混合进了当前实例的 `$options` 中。同时它还包含了我们给组件添加的自定义选项。

### Simple Plugin

创建一个插件，使 Vue 组件可以处理自定义 "rules" 选项。“rules” 选项接收一个对象，可以完成对组件中的数据进行自定义规则验证。

- plugin 应该包含一个全局混入
- 全局混入包含`created` 钩子
- 在钩子函数中，检查 `this.$options.rules`

**测试案例：**

``` js
const vm = new Vue({
  data: { foo: 10 },
  rules: {
    foo: {
      validate: value => value > 1,
      message: 'foo must be greater than one'
    }
  }
})

vm.foo = 0 // should log: "foo must be greater than one"
```

**代码实现：**

``` js
 const RulesPlugin = {
    // Implement this!
    install(Vue) {
      Vue.mixin({
        created() {
          let rules = this.$options.rules
          if (rules) {
            Object.keys(rules).forEach(key => {
              const {
                validate,
                message
              } = rules[key];
              this.$watch(key, newVal => {
                const valid = validate(newVal);
                if (!valid) {
                  console.log(message);
                }
              })
            })
          }
        }
      })
    }
  }

  Vue.use(RulesPlugin)
```