# VueRouter hash 模拟实现

本文通 path-to-regexp 来实现 Vue-Router 的 hash 模拟实现。

<!-- more -->

## 路由

我们大多数人都知道单页应用程序路由是怎么回事。要点就是把 URL 映射到组件上。因此这些练习的目标实际上是从头开始，以及如何在视图上下文中实现它。

- 简单的路由 (hashchange + `<component :is />`)
- 提取路由表
- 通过 `path-to-regexp` 进行 URL 匹配

## Basic Hash Router

让我们来看一个非常简单的基于 hash 的路由解决方案。它甚至不是一个路由管理器，它只是使用直接浏览器 API 的路由。在浏览器中有两种路由方式，分别是 hash 和 HTML5 的 history API。后者在某种意义上更好，它支持 pop 状态，你可以得到更好的 url，但它需要进行一些服务器配置。这里为了练习我们只是用 hash  路由。

- 当 url 为 `#foo` 时，页面呈现 foo
- 当 url 为 `#bar` 时，页面呈现 bar
- 实现在 `#foo` 和 `#bar 之间的导航链接

``` js
<div id="app">
  <!-- render main view here -->
  <a href="#foo">foo</a>
  <a href="#bar">bar</a>
</div>

<script>
window.addEventListener('hashchange', () => {
  // Implement this!
})

const app = new Vue({
  el: '#app',
  // Implement this!
})
</script>
```

**代码实现：**

```js
<div id="app">
  <component :is="url"></component>
  <a href="#foo">foo</a>
  <a href="#bar">bar</a>
</div>

<script>
window.addEventListener('hashchange', () => {
  app.url = window.location.hash.slice(1);
})

const app = new Vue({
  el: '#app',
  data: {
    url: window.location.hash.slice(1)
  },
  components:{
    bar: {template: `<div>bar</div>` },
    foo:{template: `<div>foo</div>`}
  }
})
</script>
```

## Route Table

上面的例子很简单，但是我们注意到我们的配置本质上是硬编码的。理想情况下，你有一个应用程序，你有一些路由配置。你想要这个路由以某种方式被提取出来，这样你就可以有一个路由表。你知道哪条路径对应什么，上面的例子并没有实现这个功能。

因此这个练习就是基于上述练习来实现这个配置功能。

``` js
<div id="app">
</div>

<script>
// '#/foo' -> Foo
// '#/bar' -> Bar
// '#/404' -> NotFound

const Foo = { template: `<div>foo</div>` }
const Bar = { template: `<div>bar</div>` }
const NotFound = { template: `<div>not found!</div>` }

const routeTable = {
  // Implement this!
}

window.addEventListener('hashchange', () => {
  // Implement this!
})

const app = new Vue({
  el: '#app',
  // Implement this!
})
</script>
```

**代码实现：**

```js
const routeTable = {
    'foo': Foo,
    'bar': Bar
}

window.addEventListener('hashchange', () => {
	app.url = window.location.hash.slice(1);
})

const app = new Vue({
    el: '#app',
    data: {
    	url: window.location.hash.slice(1)
	},
    render(h) {
        return h('div', [
            h(routeTable[this.url] || NotFound),
            h('a', { attrs: { href: '#bar' } }, 'bar'),
            ' | ',
            h('a', { attrs: { href: '#foo' } }, 'foo')
        ])
    }
})
```

## Path to Regular Expressions

我们已经实现了一些基本的路由，但是实际的应用程序要复杂的多，例如 URL 地址可能如下所示：

`foo/123` 或者使用冒号的动态路由字段 `user/:username`，我们希望提取这个动态字段，并将其作为 prop 或某种数据传递给组件。组件需要能够获取当前的动态字段，如路由是 `/user/123` ，那么传递到组件中的数据可能 `{ username: '123' }`，还有可能是以下这种形式：

```js
'/user/123?foo=bar'
// 将原始 url 变为 JavaScript 数据结构，而不是在任何地方都进行解析
{
	path: '/user/123',
	params: { username: '123' },
	query: { foo: 'bar' }
}
```

所以这是很常见的需求，在后面，我们将尝试处理其中的一些。我们不会像上面构造一个完整的route 对象。我们要做的就是像下面这样获取动态路径参数。

```js
'/user/:username'
'/user/123'
{ username: 123 }
```

我们可以手写一个正则表达式来获取动态路由中的参数，但是可以使用已有的库 [path to regexp]() 来实现我们想要的功能。这是一个非常流行的包，并被用在相当多路由管理器中。更多详细使用方法查看相关文档。

## Dynamic Routes

在这个练习中，我们还是有 Foo、Bar 和 NotFound 组件，区别是本次练习 foo 有一个动态路由，例如当 hash 为 `/foo/123` 时，Foo 组件接收一个 prop 为 123，并将其输出。初始代码如下所示：

```js 
<script src="../node_modules/vue/dist/vue.js"></script>
<script src="./path-to-regexp.js"></script>

<div id="app"></div>

<script>
// '#/foo/123' -> foo with id: 123
// '#/bar' -> Bar
// '#/404' -> NotFound

// path-to-regexp usage:
// const regex = pathToRegexp(pattern)
// const match = regex.exec(path)
// const params = keys.reduce((params, key, index) => {
//   params[key] = match[index + 1]
// }, {})

const Foo = {
  props: ['id'],
  template: `<div>foo with id: {{ id }}</div>`
}
const Bar = { template: `<div>bar</div>` }
const NotFound = { template: `<div>not found!</div>` }

const routeTable = {
  // Implement this!
}

window.addEventListener('hashchange', () => {
  // Implement this!
})

const app = new Vue({
  el: '#app',
  data: {
    url: window.location.hash.slice(1)
  },
  render (h) {
    const path = '/' + this.url

    let componentToRender
    let props = {}

    // Implement the logic to figure out proper values
    // for componentToRender and props

    return h('div', [
      h(componentToRender, { props }),
      h('a', { attrs: { href: '#foo/123' }}, 'foo'),
      h('a', { attrs: { href: '#foo/234' }}, 'foo'),
      ' | ',
      h('a', { attrs: { href: '#bar' }}, 'bar')
    ])
  }
})
```

**代码实现：**

```js
const routeTable = {
    '/foo/:id': Foo,
    '/bar': Bar
  }
  const compileRoutes = [];
  Object.keys(routeTable).forEach(path => {
    let dynamicSegments = [];
    const regex = pathToRegexp(path, dynamicSegments);
    const component = routeTable[path];
    compileRoutes.push({
      component,
      regex,
      dynamicSegments
    });
  })
/**
  const compileRoutes = {};
  Object.keys(routeTable).forEach(path => {
    let dynamicSegements = [];
    compileRoutes[path] = {
      regex: pathToRegexp(path, dynamicSegements),
      component: routeTable[path],
      dynamicSegements
    };
  })
*/
  window.addEventListener('hashchange', () => {
    app.url = window.location.hash.slice(1);
  })

  const app = new Vue({
    el: '#app',
    data: {
      url: window.location.hash.slice(1)
    },
    render(h) {
      const path = '/' + this.url

      let componentToRender
      let props = {}

      compileRoutes.some(route => {
        const match = route.regex.exec(path);
        if (match) {
          componentToRender = route.component;
          route.dynamicSegments.forEach((segment, index) => {
            props[segment.name] = match[index + 1];
          })
          return true;
        }
      })
        
    /**
     Object.keys(compileRoutes).some(pattern => {
        const { regex, component, dynamicSegements } = compileRoutes[pattern];
        const match = regex.exec(path);

        if (match) {
          componentToRender = component;
          dynamicSegements.forEach(({ name }, index) => {
            props[name] = match[index + 1];
          })
          return true;
        }
      })
    */

      return h('div', [
        h(componentToRender || NotFound, { props }),
        h('a', { attrs: { href: '#foo/123' } }, 'foo123'),
        ' | ',
        h('a', { attrs: { href: '#foo/234' } }, 'foo234'),
        ' | ',
        h('a', { attrs: { href: '#bar' } }, 'bar')
      ])
    }
  })
```

