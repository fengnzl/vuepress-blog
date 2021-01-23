# 路由切换同一组件不更新

在使用 Vue 组件时，在项目中遇到同一组件不同路由切换，或者统一组件同一路由不同参数地址切换时，组件的生命周期钩子不会重新触发。

如一个 User 组件，其路由配置如下：

```vue
{ path: '/user/:id', component: User }
```

当我们从 `/user/1` 切换至 `/user/2` 的时候，由于 vue-router 内部会识别这两个路由使用的是同一个组件从而进行复用，不会重新创建组件，从而导致生命周期钩子不会触发。

一个相同组件销毁再重新创建，会导致很大程度上的性能浪费，因此复用组件是正确的选择，但这同时会导致无法路由跳转的时候无法进行更新。下面总结了三种方法来解决这个问题。

## Router-view 上绑定 key 值

通过在 router-view 上设置 key 值，从而通过虚拟 DOM 在渲染时通过 key 值不等来确定节点不同，导致每次切换路由的时候就会销毁之前的组件，创建一个新组件，即使是同一个组件，只要 key 值不同，就会重新创建。其示例如下：

```vue
 <router-view :key="$route.fullPath"></router-view>
```

这种方式非常浪费性能，是最不可取的，但是简单粗暴。

## 监听 $route 对象

通过在 watch 中监听路由对象的变化，从而进行响应的操作，如下所示：

```vue
watch: {
 '$route.params.id'(to, from) {
    console.log('route watch was called')
  }
},
```

这种方法可以解决上面的问题，代价是组件内部多了一个 watch，带来依赖追踪的内存消耗。一般建议只监听自己需要的字段，而不是监听整个 $route。

## 组件内的路由导航守卫 beforeRouteUpdate

通过[官方文档](https://router.vuejs.org/zh/guide/advanced/navigation-guards.html#路由独享的守卫)可知，该守卫在当前路由改变，但是组件被复用的时候进行调用，虽然不会触发生命周期钩子函数，但是通过将切换路由里面的逻辑放到 beforeRouteUpdate 守卫中即可进行响应的请求和逻辑处理。

以上相关代码示例见下方 CodePen

<iframe height="265" style="width: 100%;" scrolling="no" title="同一组件路由跳转生命周期不调用解决办法" src="https://codepen.io/lullabies/embed/rNMRPvW?height=265&theme-id=dark&default-tab=html,result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href='https://codepen.io/lullabies/pen/rNMRPvW'>同一组件路由跳转生命周期不调用解决办法</a> by ScriptLearner
  (<a href='https://codepen.io/lullabies'>@lullabies</a>) on <a href='https://codepen.io'>CodePen</a>.
</iframe>

