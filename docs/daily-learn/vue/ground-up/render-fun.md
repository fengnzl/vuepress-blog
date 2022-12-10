---
sidebarDepth: 2
---
# 渲染函数

本文主要介绍了渲染函数，以及渲染函数和响应式部分综合描述。
<!-- more -->

## 基础知识

vue 模版在后台是通过渲染函数（render function）来编译的。首先我们来了解一些基础知识。

![image-20200315003510055](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20200315003512.png)

在 Vue 中，我们首次进行 Vue APP 的渲染时，我们首先通过渲染函数来编译。如果你使用完整的构建，并且直接在DOM模板中使用，那么这个编译过程是动态的。就像直接在DOM中编写模板一样，或者在 vue 实例中使用模板字符串。

但是如果通过 Vue CLI 脚手架来搭建项目，webpack 中的 vue-loader 会在构建过程中进行预编译。因此发送到浏览器中的代码不包含原始代码，而是编译渲染函数的纯 JavaScript 代码。

这有点类似于 Angular 中的 ALT 编译。它不仅节省了实际动态编译的长期成本，同时我们可以在没有编译器的情况下改变运行。在 Vue 中，我们有两个版本，一个是包含编译器的完整版本，一个是大小为 30KB 的压缩版本。

但是，如果扔掉编译器，则在运行时的版本仅为 20 KB。 这就相当于第三次进行大小的优化，因此使用预编译是非常有用的。渲染函数的本质是返回一个虚拟 DOM（Virtual DOM），然后 Vue 根据虚拟 DOM 来生成实际 DOM。后面我们将会详细介绍虚拟 DOM，在这之前，如果要进行后续更新，根据我们之前编写的 `autorun` 函数可以知道会发生初始渲染。

![image-20200315010118890](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20200315010120.png)

这就是 `autorun` 函数所实现的功能。在这个过程中我们通过渲染函数来生成虚拟 DOM。因为渲染函数依赖于 vue 实例中的所有数据属性。这些数据属性是响应式的，所有的数据属性都被用作这个组件渲染函数的依赖。

如果其中任何一个依赖的属性发生了变化，渲染函数就会再次被调用。同时在后续跟心中，渲染函数再次被调用同时生成一个新的虚拟 DOM，它将与旧的虚拟 DOM 进行比较和区分，最终我们只会在实际 DOM 中更新比较得到的变化。

## 虚拟 DOM

我们都知道原生的 DOM API，但是什么是虚拟 DOM 呢？就像下面这个例子：

```js
// Actual DOM
document.createElement('div')

// Virtual DOM
vm.$createElement('div')
```

通过 `document.createElement` 我们可以在真实的 document 中创建一个真实的 div 节点，是通过浏览器引擎内部的 C++ 代码实现。我们通常并不需要接触到引擎层面，只需要在 JavaScript 中调用 API 即可。而在 Vue 中的虚拟 DOM 里，每个实例通过 `$createElement` 函数来返回一个虚拟节点来呈现 div，但它是纯 JavaScript 对象。两者的差别其实是很大的，因为如果我们在浏览器控制台输出 div 的属性，你会发现一个真实的 div 节点有许多属性。底层的实现实际上是相当繁琐的。因为我们本质上是通过 JavaScript 接口调用原始代码，所以在双方之间存在通信成本。这要比在 JavaScript 中做 纯 JavaScript 操作要昂贵的多，因此我们通常会说如果你操作DOM，一切都变慢了。某些浏览器可能会进行优化，但是通常来说，通过 JavaScript 来对 DOM 进行操作，都会有相应的成本。

```js
// Actual DOM
"[object HTMLDivElement]"
^ Browser Native Object (expensive)

// Virtual DOM
{ tag: ‘div’, data: { attrs: {}, … }, children: [] }
^ Plain JavaScript Object (cheap)
```

我们可以看到虚拟 DOM div 仅仅是一个对象，它拥有 tag 属性来表明这是一个 div，如果 div 上有 attributes，那么它将包含 data 对象。同时它可以拥有 children 列表，里面是虚拟节点数组，从而我们拥有了虚拟节点树来构造虚拟 DOM。

虚拟 DOM 的成本要远低于实际 DOM。假如我们有 1000 个元素，创建 1000 个对象的很低，同时也很迅速。但是创建 1000 个实际的 DOM 成本非常高。

> Virtual DOM:
> (Essentially) A lightweight JavaScript data format to represent what the actual DOM should look like at a given point in time

因此，这个虚拟DOM实际上是一种轻量级的 JavaScript 数据格式，用于表示在给定时间点上实际的 DOM 应该是什么样子。这很重要，因为每次更新都会生成虚拟 DOM 的副本。这是因为虚拟 DOM 比真实 DOM 成本低。

如果我们通过 `innerHTML` 来更新我们的 APP，我们本质上需要丢弃先前所有真实的 DOM 节点，重新生成所有的 DOM 节点。这比仅仅生成虚拟 DOM 快照的成本要昂贵的多，同时 `innerHTML` 也存在着问题。他会丢弃当前的状态，如表单中 input 元素等等。

**通常我们误解是虚拟 DOM 使得这些框架变得很快。**实际上，虚拟 DOM 只是绕过原始 DOM 限制的一种方法，这样它就可以声明性地组合实现您想要的 DOM 范例。虚拟 DOM 的另一个好处是它将渲染逻辑与实际 DOM 解耦，因此有了区分（diff）步骤，然后将这些变化应用到实际 DOM 中。

> Virtual DOM:
> Decouples rendering logic from the actual DOM - enables rendering capabilities in non-browser environments, e.g. server-side and native mobile rendering.

如果我们将最后渲染步骤丢弃，APP 上所有的更新逻辑都可以在虚拟上进行，它不需要接触 DOM。事实上，如果我们抽象出这些最终的步骤，包括触及DOM的API，然后将它们重定向到其他地方。我们可以在任何支持 JavaScript 的环境中创建相同的应用程序，但它不一定要触及 DOM。相反，它可以与本地渲染引擎对话，例如 iOS、Android 或者在服务器端，我们可以将虚拟 DOM 转换为字符串或字符串查找器。

因此，将一个虚拟 DOM 转换原始渲染是使 react native、native script 等项目成为可能的原因。它们都具有类似的架构，其中JavaScript应用程序实际上在嵌入式 JavaScript 引擎中运行。它只发送必要的消息到渲染层，关于 diff 信息，或任何实际节点操作。

> Render Function:
> A function that returns Virtual DOM.

这就是虚拟 DOM的 架构优势。显然虚拟 DOM 不是实现此目的的唯一方法，但它是一种很好的方法。最后，渲染函数只是一个返回虚 DOM 的函数。Vue.js 中的[模板通过编译器](https://template-explorer.vuejs.org/)中的渲染函数来进行编译。

```js
Template -> [ Compiler ] -> Render Function
```

## 综合

这里将渲染函数和响应式部分综合来阐述。每一个组件都有一个渲染函数，每当执行这个渲染函数时，就相当于执行 `autorun` 中的 `wrappedUpdate` 函数。因此当进行渲染时，我们通过调用数据属性上的 `getter` 来收集相关依赖。

![image-20200315120856188](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20200315121153.png)

每个组件都有一个 `watcher` 用来收集依赖，清理依赖，并将所有事情 `notify`。然后组件的渲染函数返回一个虚拟 DOM。从上面的图上的循环可知，我们在 `autorun` 函数中进行渲染，从而每当渲染函数所依赖的属性发生改变时，渲染函数将会连续被调用。

每个组件都有类似自己的 `autorun` 循环，一个组件树由很多类似的组件组成，每一个组件都作为依赖边界，跟踪自己的依赖项。当你拥有巨大的组件树时，这其实是一个优势，因为你可以改变数据依赖项。

你的数据可能在任何地方都发生了改变，但是由于每个组件都在组件树中跟踪其自己的依赖关系，因此我们精确地知道哪些组件受到任意数据操作的影响。因此，我们不会过度渲染，不会存在因为组件过多而进行不必要的渲染，因为我们有一个精确的依赖跟踪系统。

这是架构上的优势，它避免了需要在由自上而下的渲染模型（React）中进行优化工作。但我们也需要为这些数据变成 getter 和 setter 支付成本，这种代价是极低的。

因此这并不是什么灵丹妙药两者各有利弊，我们都可以在 React 和 Vue 中构建大型应用，在实践应用中，两者的差别只有在极端条件下才会出现。

### JSX vs. Templates

在前端社区中，关于 JSX 渲染函数与 templates 之间的关系，存在着一种相互竞争的关系。但实际上，它们几乎是一样的。

当我们讨论这些时，我们首先应该想想它们的最终目的。JSX 和 templates 都是声明 DOM 和状态之间关系的一种方法，只不过 templates 更静态、更受约束的一种表达形式，这种静态特性有着它的有点。

JSX 或者渲染函数是一种更加动态的形式。动态的好处是你可以完全使用编程语言，做任何想要做的事。只要你能在代码中编写它，你就能在渲染函数中实现它。这样就不需要发明新的语法和模板来实现一些深奥的渲染要求。

template 是一种更加静态的形式。事实上，一些模板在语法上是明智的，它们可以被任何HTML解析器解析。因此，您可以快速地迁移现有的模板，也就是说，由设计人员生成的标记，你可以快速地将它们使用到代码中。更好的熟悉度，同时更重要的是，模板的静态特性使得编译时的优化效果更好。

JSX 的动态特性实际上使优化变得更加困难，因为可以做的假设更少。因为 template 是受约束的，所以试图编译它们时，这些约束实际上是有好处的，因为只能以这种方式编写模板，所以可以假设在编译时许多事情可以进行更多的优化。

因为两种方式都各自具有优点，所以 Vue 两种方式都支持。Vue 中将 template 作为默认的 API，同时在你需要更加灵活的方式编写代码时，你可以使用 JSX，只不过它不是默认的而已。

### Render Function API

``` js
export default {
    render (h) {
    	return h(‘div’, {}, [...])
    }
}
```

渲染函数接收一个参数 h （是 create element 的别名），h 只是一个约定，因为有很多种方式来实现虚拟 DOM。他们在一个叫做 hyper script 的公共 API 上达成了一致，这是编写虚拟 DOM 渲染函数的一种风格。因为 html 就像超文本传输协议，因此 hyper script 就是产生超文本的脚本，最终由于编写方便我们使用 h 这个缩写。

h 有三个参数，首先是元素的类型，其次是 data 对象，在 React 中这个就是 props 对象，但是在Vue中，我们在这个对象下嵌套了更多的字段。如 props、attrs、DOM props 等不同对象。

同时 class 和 style 对象会得到特殊对待，同时也有比较方便的方法来进行操作。比如，在模版语法中的 `v-bind:class` 和 `v-bind:style` 一样，也可以接受一个字符串、对象或字符串和对象组成的数组。

最后一个参数是一个包含更多子节点的数组，你可以在这个数组中调用 h 以产生更多节点。所以所有的调用都是嵌套的，最终它们返回一个虚拟节点树。注意如果第二个 data 对象是可选的，如果没有 data 对象里面没有内容的话。

``` js
// The “h” function
h(‘div’, ‘some text’)
h(‘div’, { class: ‘foo’ }, ‘some text’)
h(‘div’, { … }, [
    ‘some text’,
    h(‘span’, ‘bar’)
])
https://vuejs.org/v2/guide/render-function.html#The-Data-Object-In-Depth
```

如上所示第一行代码仅仅是创建了一个 div 节点，其中的文本内容为 some text。第二行代码同样创建了一个 div 节点，不过多了一个 `class = ‘foo'` 的属性。第三行代码，我们不仅创建了一个 div 节点，内部还创建了一个 span 的虚拟节点。记住我们需要在最外层返回 h 函数，从而获取整个 DOM 树。

```js
// h can directly render a component
import MyComponent from ‘...’
h(MyComponent, {
	props: { … }
})
```

h 函数的另一个相对不太为人所知的特性是，它也可以直接渲染组件。类似于在 template 中使用自定义组件标记作为自定义元素标记。h 函数除了可以接受字符串标记类型，它还可以直接接受一个定义的组件。

就像上述代码一样，h 函数接收一个组件，从而创建一个组件实例，它会创建一个虚拟节点来表示这个组件而不是一个正常的元素，同时我们在 data 对象中接收传递过来的 props 数据。

这意味着你不在需要先在 coponents 选项中注册组件，然后再通过 kebab-case (短横线隔开式)  来引用它。你可以跳过这些步骤通过渲染函数来引用它。

如果我们是通过 vue-cli 新建的项目，都会看到以下渲染函数：

```js
new Vue({
  render: h => h(App),
}).$mount('#app')
```

这个渲染函数仅仅返回了另一个组件，作为它的根节点。所以这个外部组件并没有渲染任何它自己的东西，仅仅是渲染了另恩爱一个组件，这就像一个 shell 组件，但是这个 shell 组件可以做一些有趣的事情。在根实例的情况下，在视图配置项模板中，我们希望分离根实例的职责，因为我们在根层面（root level）注入了存储路由器（routers）。而且根实例不能热重载，所以这是一个技术限制。通过将根实例和 APP 组件分开，从而让 APP 组件可以热重载。

因此，当编辑 app.vue 文件时，您将看到热重载。但如果编辑根实例本身，则必须手动重新加载页面。

### Dynamically Render Tags

实现 `example` 组件，它的用法如下：

```html
<example :tags="['h1', 'h2', 'h3']"></example>
```

当渲染后，期待输出：

``` html
<div>
  <h1>0</h1>
  <h2>1</h2>
  <h3>2</h3>
</div>
```

你需要使用渲染函数来完成它，详细的使用细节可以查看[相关文档]([https://cn.vuejs.org/v2/guide/render-function.html#%E6%A8%A1%E6%9D%BF%E7%BC%96%E8%AF%91](https://cn.vuejs.org/v2/guide/render-function.html#模板编译))

**代码实现：**

``` js
  Vue.component('example', {
    // Implement this!
    props: {
      tags: {
        type: Array,
        required: true
      }
    },
    render(h) {
      return h(
        'div',
        this.tags.map((val, index) => {
          return h(val, index);
        })
      )
    }
  })

  new Vue({
    el: '#app'
  })
```

普通组件（有状态的组件）与函数式组件的区别在于，普通组件具有实例，而函数式组件根本没有支持的实例存在 (没有 `this` 上下文)。

[函数式组件]([https://cn.vuejs.org/v2/guide/render-function.html#%E5%87%BD%E6%95%B0%E5%BC%8F%E7%BB%84%E4%BB%B6](https://cn.vuejs.org/v2/guide/render-function.html#函数式组件))如它的名称所示，可以将它看作是一个函数，它在返回的虚拟函数中接收参数，这意味它无状态 (没有[响应式数据](https://cn.vuejs.org/v2/api/#选项-数据))。事实上，在 Vue 的实现中，函数式组件被急切地扩展了。因此，如果您在父组件中使用一个函数式组件，那么这个函数式组件的渲染函数将在父组件的渲染函数中被急切的调用。

因为函数式组件没有过创建实例，保持 data 属性状态等这些东西，从而它的渲染开销非常低。从而当存在大量叶节点，并需要性能优化时，使用函数式组件是非常好的。叶节点，就是类似巨大的 list ，所以你不可避免地要使列表中的每一项成为一个真正有状态的组件，但在每一个组件中，你可能有更多的组件。这些组件可以纯粹是展示性的。 例如，您只是呈现一个按钮，或者只是呈现静态头像或其他内容。

这些组件在状态方面并没有太多的责任。有些是用来封装一些样式的，有些是用来标记的。如果这些展示组件，它们只是获取一些数据，获取一些 prop，并根据 prop 渲染一些输出，那么用函数式组件是非常好的。

如果这些组件在应用程序的许多地方重复出现，将它们转换成函数式组件应该可以提高应用程序的性能。因此，如果需要编写函数式组件，我们所要做的就是增加 `functional: true` 的声明，它与普通组件声明的区别就在于此。

组件需要的一切都是通过 `context` 参数传递，而不是通过 this 获取。

```js
 Vue.component('example', {
    // Implement this!
    functional: true,
    props: ['tags'],
    render(h, context) {
      return h(
        'div',
        context.props.tags.map((val, index) => {
          return h(val, index);
        })
      )
    }
```

使用 ES6 语法我们可以写出更加简洁的方式：

```js
Vue.component('example', {
    // Implement this!
    functional: true,
    render(h, { props: { tags } }) {
      return( 'div', tags.map((val, index) => h(val, index)));
    }
  })
```

如果使用 JSX 语法，可以编写成以下形式：

```js
const Exapmle = {
	// Implement this!
    functional: true,
    render(h, { props: { tags } }) {
   		return <div>{tags.map((val, index) => h(val, index))}</div>
    }
};
  
// 安装了相关插件
const Example = (h,{props:{tags}})=>{
	return <div>{tags.map((val, index) => h(val, index))}</div>;
}
```

### Dynamically Render Components

- 通过渲染函数实现一个 `Foo` 组件和 `Bar` 可以简单的渲染成 `<div>foo</div>` 和 `<div>bar</div>`
- 实现一个 `example` 组件根据接收的 `ok prop`，来决定渲染的组件是 `Foo` 还是 `Bar`。 如 `ok` 是 `true`，则最终渲染的 DOM 应该是  `<div>foo</div>` 。
- 在根组件实现一个 `button`，可以通过控制 `ok` 来切换 `example`  中的 `Foo` 和 `Bar`。

```js
<div id="app">
  <example :ok="ok"></example>
  <button @click="ok = !ok">toggle</button>
</div>

<script>
  const Foo = {
    // Implement this!
    render(h) {
      return h('div', 'foo');
    }
  }

  const Bar = {
    // Implement this!
    render(h) {
      return h('div', 'bar');
    }
  }

  Vue.component('example', {
    // Implement this!
    props: {
      ok: {
        type: Boolean,
        required: true
      }
    },
    render(h) {
      const comp = this.ok ? Foo : Bar;
      return h(comp);
    }
  })

  new Vue({
    el: '#app',
    data() {
      return {
        ok: true
      }
    },
  })
```

### Higher Order Component

实现一个 `withAvatarURL` 函数，它接收一个组件，该组件期望获得 `url prop`，同时返回一个接受 `username prop` 的高阶组件。该高阶组件应该从模拟 API 中获取相应的 `avatar url`。

在 API 返回之前，高阶组件应该有一个默认的 `url http://via.placeholder.com/200x200` 传递给内部组件。

该联系提供了一个基本的 `Avatar` 组件。用法如下：

``` js
const SmartAvatar = withAvatarURL(Avatar)
<smart-avatar username="vuejs"></smart-avatar>
```

**代码实现如下：**

``` js
<script src="../node_modules/vue/dist/vue.js"></script>

<div id="app">
  <smart-avatar username="vuejs"></smart-avatar>
</div>

<script>
// mock API
function fetchURL (username, cb) {
  setTimeout(() => {
    // hard coded, bonus: exercise: make it fetch from gravatar!
    cb('https://avatars3.githubusercontent.com/u/6128107?v=4&s=200')
  }, 500)
}

const Avatar = {
  props: ['src'],
  template: `<img :src="src">`
}

function withAvatarURL (InnerComponent) {
  // Implement this!
  const highOrderCom = {
    props:['username'],
    inheritAttrs: false, // 2.4 only
    data() {
      return {
        url: null,
      }
    },
    created() {
      this.url = fetchURL(this.username, url=>this.url = url);
    },
    render(h){
      return h(InnerComponent,{
        props: { src: this.url || 'http://via.placeholder.com/200x200' },
        attrs: this.$attrs // 2.4 only
      });
    }
  }
  return highOrderCom;
}

const SmartAvatar = withAvatarURL(Avatar)

new Vue({
  el: '#app',
  components: { SmartAvatar }
})
</script>
```