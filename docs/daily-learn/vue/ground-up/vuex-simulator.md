# Vuex 模拟

本文主要对 VueX 状态管理进行了模拟实现，并对实现过程进行了简单的介绍。
<!-- more -->

## 状态管理

直到 Facebook 在 Flux 框架中提出了状态管理，这个概念才慢慢出现在前端领域。在这之前，前端还是处于 MVC 架构中，状态保存在模型中，这对于大部分情况是一个很好的抽象概念。但问题是我们缺少一种方法来声明性的将模型连接到渲染过程。因此出现了 React、Vue 和 Angular，他们最大的优势就是将状态以一种透明式的方法连接到我们的视图中。

但这也带来了问题，因为很容易将状态传播到任何地方，并在任何地方更改它们。当应用程序变得很大的时候，想要追踪状态的变化和储存变得越来越困难。

如果没有一个合适的模式来组织这些可以影响状态的代码，你可能会遇到怪异的事情，并一直在寻找 BUG 中，同时你的应用程序也越来越不可控。因此状态管理，其实就是前端开发人员的一场运动，他们试图找到一种方法，将规则引入到你的代码中，并知道如何管理你的状态。

最终，当出错时能更好的定位错误位置，并且可以更好的协作。Flux 是第一个提出单项数据流概念的框架，随后 React 社区提出很多可以实现 Flux 模式的方法，并逐渐演变为 Redux 库。

还有另一种模式，MobX，它更接近于反应性模式，这与 Vue 内部的实现非常相似。在 Vue 中，将状态放入组件中非常简单。事实上，它在很多简单的情况下都能工作。

并不是所有的情况都需要状态管理库或模式。在某些简单的场景中，或许不用状态管理更好。引用 Redux 的作者 Dan Abramov 的话说就是：

> Flux 架构就像眼镜：您自会知道什么时候需要它。

这是一个自然的过程，但有时很难预测应用程序有多大，但可以根据直觉来判断。例如，老板告诉你这是最重要的应用程序，我们将会维护很多年，那么从一开始你可能就需要进行状态管理。所以让我们来谈谈 Vue 中的状态管理 Vuex 吧。

Vuex 是官方团队发布的一个函数库，同时它还包括代码的组织形式，更多信息请查看[官方文档](https://vuex.vuejs.org/zh/)。这里我们并不介绍它是如何使用的，而是介绍如何从头开始进行状态管理。

## Passing Props

一个 `counter` 组件渲染了三次，组件接收 `count` 作为 `props`，按钮可以同时更新三个 counter 。

``` js
<div id="app">
  <counter :count="count"></counter>
  <counter :count="count"></counter>
  <counter :count="count"></counter>
  <button @click="count++">increment</button>
</div>

<script>
// requirement: a counter component rendered 3 times
// the component takes the current count via props
// and a button that increments all 3 counters at once
new Vue({
  el: '#app',
  // Implement this!
})
</script>
```

**代码实现：**

``` js
new Vue({
    el: '#app',
    // Implement this!
    data() {
      return {
        count: 0
      }
    },
    components: {
      counter: {
        props: ['count'],
        template: `<div>{{ count }}</div>`
      }
    },
  })
```

## Shared Object

创建一个不接受任何 `props` 的 `counter` 组件，所有的实例共享同一个 `count` 状态，按钮可以同时更新三个 counter 。

**注意：**在组件中 data 如果是一个对象，那么它会在控制台中输出 `warning data must be a function`，这是因为在大多数情况下，我们希望每个组件实例都有自己惟一独立的数据块，而不是所有这些组件都共享相同的数据块。

``` js
<div id="app">
  <counter></counter>
  <counter></counter>
  <counter></counter>
  <button @click="inc">increment</button>
</div>

<script>
// create a counter component (that doesn't take any props)
// all instances of it should share the same count state
// and a button that increments all counters at the same time

const Counter = {
  // Implement this!
}

new Vue({
  el: '#app',
  // Implement this!
})
</script>
```

**代码实现：**

``` js
const state = {
    count: 0
  };
  const Counter = {
    // Implement this!
    data() {
      return state // same object,same reference
    },
    // template: `<div>{{ count }}</div>`
    render(h){
      return h('div',this.count);
    }
  }

  new Vue({
    el: '#app',
    // Implement this!
    components: {
      Counter
    },
    methods: {
      inc() {
        state.count++;
      }
    },
  })
```

如果你直接写成以下代码，会发现当你点击按钮时，`count` 并不会增加：

``` js
const Counter = {
    render: h => h('div', state.count)
  }
```

这是因为只有在 data 中返回这些数据，Vue 才能对其进行观察和调用函数，如果不将数据在 data 中返回，那么 Vue 将没有机会使其编程响应式的。

## Shared Instance

当 Vue 实例接受一些数据时，默认的行为是它将数据对象上的所有根级属性都代理到 Vue 实例本身。因此我们可以将 Vue 实例用作某种响应式数据存储模型，这让它看起来很像 MobX。这里通过将 Vue 实例作为共享的存储器，来实现上述功能。

``` js
<div id="app">
  <counter></counter>
  <counter></counter>
  <counter></counter>
  <button @click="inc">increment</button>
</div>

<script>
// copy and modify the first exercise to use a Vue instance as
// a shared store instead.
const state = new Vue({
  // Implement this!
})

const Counter = {
  // Implement this!
}

new Vue({
  el: '#app',
  // Implement this!
})
</script>
```

**实现代码：**

``` js
const state = new Vue({
    data() {
      return {
        count: 0
      }
    },
    methods: {
      inc(){
        this.count++;
      }
    },
  })

  const Counter = {
    render: h => h('div', state.count)
  }

  new Vue({
    el: '#app',
    components: {
      Counter
    },
    methods: {
      inc() {
        state.inc();
      }
    },
  })
```

这里我们是在 `state` 实例中创建了函数，然后在根实例中进行调用而不是直接 `state.count++`，这看起来可能有点多余，但好的一面是，我们隐藏了 state 变化的细节。所以 state 如何变化的细节是与 state 存储本身共存的。

在实际的应用程序中，这种逻辑可能要复杂得多。这可能涉及到一个 API，获取一些东西，进行过滤，比较等等，并最终改变状态。如果这些 state 逻辑与 state 是内在耦合的，而不是与这些组件的逻辑耦合，那么将这些逻辑取出并将它们集中处理是非常有意义的。

因此上述模式是非常适用的，假设应用程序中有不同类型的数据，你可以创建 userStore 或者 productStore，它们各自处理特定的事务。你可以在各个地方的组件中导入并使用它们，甚至在渲染函数中引用它们。所以这个模式对于中等大小的应用程序来说非常有用。如果你喜欢这种基于 model 模型的状态管理，你甚至可以扩展它，在它的基础上构建更大的应用程序。

这已经非常接近 VueX 的本质了，VueX 即为了处理更大的应用程序而设计的。VueX 中存在 `mutations` 和 `actions`，类似于上述模式中的 `methods`。`mutations` 和 `actions` 的区别在于，`mutations` 是改变状态的代码或函数，目的是用来改变状态。它们必须是同步的，因为 Vuex 集成了devtools。

如果你看过 devtools 的集成，你就会知道它有历史回滚/时光旅行的功能，并且具有记录变更 (mutation)、保存状态快照的功能。如果要保存状态的快照，那么同步的 mutation 是至关重要的，因为你可以在调用函数之后立即比较前后的差别。

如果 mutation 包含异步操作的话，那么当你调用 mutation 时，你并不知道多久之后 state 才会发生改变。这使得快照功能很难实现。同时，mutation 的代码最好和异步操作分开，因为异步本身就是一个复杂的问题。

因此，在 VueX 中，mutation 和 action 的区别实际上是为了将异步操作与实际过程中变更的代码区分开来。在 action 内，你可以做很多事情，比如调用外部 API 等，而 mutation 只会专注于处理状态。mutation 接收一些参数并变更状态，这几乎它的全部作用。在 action 中你可以做很多事情，包括异步操作。

## Mutations

在这个练习中，我们将看到它仍然是相同的应用程序，只是我们现在有了一个名为 `createStore`的函数。而这个函数本质上是试图模拟一个简单的 VueX 版本。这里我们只关注于 mutation，不关心 module 和 action 等其他东西。

``` js
<div id="app">
  <counter></counter>
  <counter></counter>
  <counter></counter>
  <button @click="inc">increment</button>
</div>

<script>
function createStore ({ state, mutations }) {
  // Implement this!
}
// const store = new Vuex.Store({
const store = createStore({
  state: { count: 0 },
  mutations: {
    inc (state) {
      state.count++
    }
  }
})

const Counter = {
  render (h) {
    return h('div', store.state.count)
  }
}

new Vue({
  el: '#app',
  components: { Counter },
  methods: {
    inc () {
      store.commit('inc')
    }
  }
})
</script>
```

**实现代码：**

``` js
function createStore ({ state, mutations }) {
  // Implement this!
  return new Vue({
    data() {
      return {
        state
      }
    },
    methods:{
      commit(mutationType){
        return mutations[mutationType](state);
      }
    }
  })
}
```

## Functional

如果你熟悉 React 及其社区，你会发现其社区更关注于函数式编程，Redux 就是一个很好的例子。因为 Redux 确保应用程序中的 state 是不可变的，因此，如果我们有一个 count的初始状态: 0。类似于 Vuex 采取不同的 mutations，Redux 采取不同的 action type。Redux 的核心概念是 reducer。它是一个函数，模拟效果如下：

```js
const state = {
    count: 0
  };
  const reducer = (prevState, action) => {
    switch (action) {
      case 'inc':
        return {
          count: prevState.count + 1
        };
      case 'dec':
        return {
          count: prevState.count - 1
        };
      default:
        return prevState;
    }
  }
```

这是函数式的，因为它接收参数，然后返回一个全新的数据，他不会改变任何地方。但是，实际上，当将相同的管理模式并此应用在组件方面以实现相同的效果时。dispach 和 action 会被发送到中心存储器，存储器发生了变化，你的状态得到更新。要么替换它，要么使它发生变化，最终，这种改变被称作副作用。它的副作用就是前端应用会更新DOM，这就是Redux 的本质。我们可以在一个 Vue 应用程序中应用相似的概念。如果这是你喜欢的 API 类型，我们完全可以在 Vue 中做到这一点。

这个练习是关于给定一个的 API，如何来实现该API?

```js
<div id="app"></div>

<script>
function createApp ({ el, model, view, actions }) {
  // Implement this!
}

// voila
createApp({
  el: '#app',
  model: {
    count: 0
  },
  actions: {
    inc: ({ count }) => ({ count: count + 1 }),
    dec: ({ count }) => ({ count: count - 1 })
  },
  view: (h, model, actions) => h('div', { attrs: { id: 'app' }}, [
    model.count, ' ',
    h('button', { on: { click: actions.inc }}, '+'),
    h('button', { on: { click: actions.dec }}, '-')
  ])
})
```

**代码实现：**

```js
function createApp ({ el, model, view, actions }) {
  const wrappedActions = {};

  Object.keys(actions).forEach(key=>{
    const rawAction = actions[key];
    wrappedActions[key] = ()=>{
      nextModel = rawAction(vm.model);
      vm.model = nextModel;
    }
  })
  const vm = new Vue({
    el,
    data:{ model },
    render(h){
      return view(h,this.model,wrappedActions);
    }
  })
}
// 更加函数式的方法
function createApp ({ el, model, view, actions }) {
  Object.keys(actions).forEach(key => {
    const rawAction = actions[key]
    actions[key] = (...payload) => {
      app.model = rawAction(app.model, actions, ...payload)
    }
  })
  const app = new Vue({
    data: { model },
    render (h) {
      return view(h, this.model, actions)
    }
  }).$mount(el)
}
```

