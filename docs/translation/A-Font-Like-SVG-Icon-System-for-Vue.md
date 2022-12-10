# 一个 Vue 的类似于 Font 的 SVG 图标系统

::: tip

* 原文：[A Font-Like SVG Icon System for Vue](https://css-tricks.com/a-font-like-svg-icon-system-for-vue/)
* 作者：[Kevin Lee Drum](https://twitter.com/kevinleedrum)
* 翻译：[城南花已开](https://fengnzl.github.io/)

:::

大多数情况下，在 Vue 应用中管理自定义图标集是一项挑战。图标字体简单易用，但当需要自定义时，你需要依赖于第三方字体生成器，并且由于字体是二进制文件因此解决冲突将会变得十分困难。

使用 SVG 文件可以解决这些痛点，但是我们怎么才能确保在添加或者删除图标的时候通用容易使用呢？

我认为一个图标系统应该如下所示：

- 当添加图标时，你只需要将其放入 `icons` 文件夹即可。如果你不在需要一个图标，你要做的只是删除它。
- 如果在模板文件中使用 `rocket.svg` 图标，这样简单的语法即可使用 `<svg-icon icon="rocket" />` 。
- 通过使用 CSS 的 `font-size` 和 `color` 属性即可改变图标的缩放大小和颜色（就像字体图标一样）。
- 如果一个同样的 icon 在同一个页面出现多次引用实例，SVG 代码并不会进行重复引用。
- 不需要进行 webpack 配置。

这需要我们编写两个小的、单文件组件。要实现这个系统需要一些特定的要求，但是我保证大部分的你们为了其他的框架可以重构这个系统和构建工具：

- webpack：如果你使用 Vue Cl 脚手架来管理你的应用，那么你已经在使用 webpack 了。
- [svg-inline-loader](https://github.com/webpack-contrib/svg-inline-loader)：这允许我们加载所有SVG代码并清除我们不想要的部分。在命令行中输入 `npm install svg-inline-loader --save-dev` 来安装使用

## SVG 雪碧图组件

为了实现页面上每个图标实例不重复 SVG 代码的要求，我们需要构建一个 SVG 雪碧图。如果你之前没有听说过 [SVG 雪碧图](https://css-tricks.com/svg-sprites-use-better-icon-fonts/)，可以把它看作是一个隐藏的SVG，用来存放其他的SVG。在任何需要显示图标的地方，我们可以像这样通过在 `<use>` 标签中引用图标的 id 来引用它。

``` html
<svg><use xlink:href="#rocket" /></svg>
```

这一小段代码基本上就是 `<SvgIcon>` 组件的工作方式，但是我们首先需要创建一个 `<SvgSprit>` 组件。下面是完整的 `SvgSprite.vue` 文件；里面的部分代码乍看或许有些难以理解，我们稍后将会详细讲解。

```javascript
<!-- SvgSprite.vue -->

<template>
  <svg width="0" height="0" style="display: none;" v-html="$options.svgSprite" />
</template>

<script>
const svgContext = require.context(
  '!svg-inline-loader?' + 
  'removeTags=true' + // remove title tags, etc.
  '&removeSVGTagAttrs=true' + // enable removing attributes
  '&removingTagAttrs=fill' + // remove fill attributes
  '!@/assets/icons', // search this directory
  true, // search subdirectories
  /\w+\.svg$/i // only include SVG files
)
const symbols = svgContext.keys().map(path => {
  // get SVG file content
  const content = svgContext(path)
   // extract icon id from filename
  const id = path.replace(/^\.\/(.*)\.\w+$/, '$1')
  // replace svg tags with symbol tags and id attribute
  return content.replace('<svg', `<symbol id="${id}"`).replace('svg>', 'symbol>')
})
export default {
  name: 'SvgSprite',
  svgSprite: symbols.join('\n'), // concatenate all symbols into $options.svgSprite
}
</script>
```

在模板文件中，我们唯一的 `<svg>` 元素的内容绑定在 `$options.svgSprite` 。如果你不是很熟悉 `$options` ，它包含了当前 Vue 实例的初始化的属性。我们也可以在组件的 `data` 中来获取 `svgSprite` 属性，但是我们并不需要 Vue 将其设置成响应式的，因为 SVG loader 只有在应用程序构建的时候才会运行。

在我们的 script 中，我们使用  [`require.context`](https://webpack.js.org/guides/dependency-management/#requirecontext) 来检索所有的 SVG 文件和清理它们。我们调用 `svg-inline loader` 并使用类似于查询字符串参数的语法向它传递几个参数。为了便于理解，我将其拆成多行代码。

```javascript
const svgContext = require.context(
  '!svg-inline-loader?' + 
  'removeTags=true' + // remove title tags, etc.
  '&removeSVGTagAttrs=true' + // enable removing attributes
  '&removingTagAttrs=fill' + // remove fill attributes
  '!@/assets/icons', // search this directory
  true, // search subdirectories
  /\w+\.svg$/i // only include SVG files
)
```

我们基本上的操作是清理 `/assets/icons` 文件夹下的 SVG 文件，这样它们就可以在我们需要的任何地方使用。

`removeTags` 参数去除图标中我们不需要的标签，如 `title` 和 `style` 。我们需要移除 `title` 标签是因为这可能造成不必要的提示。如果你想在图标中保存任何硬编码的样式，只需要添加额外的参数 `removingTags=title` ，从而只有 `title` 标签会被移除。

我们也可以让 loader 移除 `fill` 属性，从而我们可以通过 CSS 自己设置我们的 `fill` 颜色。同时你也肯能想要保留 `fill` 的颜色，如果是这样，你只需要简单的移除 `removeSVGTagAttrs` 和 `removingTagAttrs` 参数即可。

最后一个 loader 参数是 SVG 图标的文件路径。然后我们给 `require.contxt` 两个参数，从而保证它会搜索子目录和只加载 SVG 文件。

为了将我们的 SVG 元素嵌套进我们的 SVG 雪碧图上，我们需要将其从 `<svg>` 元素转换成 SVG `<symbol>` 元素。这非常简单，只需更改标签并为每个标签提供惟一的 id，这是我们从文件名中提取id。 

```javascript
const symbols = svgContext.keys().map(path => {
  // extract icon id from filename
  const id = path.replace(/^\.\/(.*)\.\w+$/, '$1')
  // get SVG file content
  const content = svgContext(path)
  // replace svg tags with symbol tags and id attribute
  return content.replace('<svg', `<symbol id="${id}"`).replace('svg>', 'symbol>')
})
```

我们如何处理这个 `<SvgSprite>` 组件呢？我们在使用依赖它的 icons 之前，将其放在页面的顶部。我建议讲其添加到 `App.vue` 文件顶部。

```javascript
<!-- App.vue -->
<template>
  <div id="app">
    <svg-sprite />
<!-- ... -->
```

## icon 组件

现在让我们来编写 `SvgIcon.vue` 组件。

```javascript
<!-- SvgIcon.vue -->

<template>
  <svg class="icon" :class="{ 'icon-spin': spin }">
    <use :xlink:href="`#${icon}`" />
  </svg>
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    icon: {
      type: String,
      required: true,
    },
    spin: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style>
svg.icon {
  fill: currentColor;
  height: 1em;
  margin-bottom: 0.125em;
  vertical-align: middle;
  width: 1em;
}
svg.icon-spin {
  animation: icon-spin 2s infinite linear;
}
@keyframes icon-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}
</style>
```

这个组件要简单得多。如之前所述，我们利用 `<use>` 标记来引用雪碧图中的 id 。这个 `id` 来自组件的 `icon` prop 。

我也添加了一个 `spin` prop，从而在我们需要的时候，可以添加 `.icon-spin` class 来产生动画效果。如，可以用作 loding 动画。

```html
<svg-icon v-if="isLoading" icon="spinner" spin />
```

这取决于你的需求，你或许想添加一些额外的 props，例如 `rotate` 或者 `flip` 。如果你喜欢你可以直接在组件上增加 classes 而不是使用 props 。

组件中的大部分内容在 CSS 中，除了 spinning 动画，其他的都是为了使我们 SVG icon 更像 icon font[^1] 。为了将图标与文本基线对齐，我发现通过 `vertical-align: middle` ，加上 `margin-bottom: 0.125em` ，可以适用于大部分情形。同时我们将 `fill` 属性的值设为 `currentColor` ，这允许我们可以像文本一样给 icon 设置颜色。

```html
<p style="font-size: 2em; color: red;">
  <svg-icon icon="exclamation-circle" /><!-- This icon will be 2em and red. -->
  Error!
</p>
```

 如果您想在应用程序中的任何位置使用图标组件，而不想将其导入到需要它的每个组件中，我们可以在 `main.js` 文件中注册该组件。

![](https://css-tricks.com/wp-content/uploads/2020/07/image-9.png)

## 最后思考

以下是一些改进的想法，我特意省略了这些，来简化上面的方案：

- 缩放不规则的 icon ，来保持其比例。
- 将 SVG 雪碧图注入到页面中，而不需要额外的组件。
- 使其在  [vite](https://github.com/vitejs/vite) 下正常工作，这是 Vue 创建者 Evan You 开噶的一个新的、快速的构建工具（不需要 webpack ）。
- 利用 Vue 3 的 [Composition API](https://composition-api.vuejs.org/api.html) 。

如果你想快速体验上面的组件，我通过 vue-vli 模板快速创建了一个 [demo app](https://github.com/kevinleedrum/vue-svg-icon-demo) 。我希望它能帮助在你的 app 中开发一个满足需求的 SVG 图标系统。

[^1]: 如果你想知道为什么我们想使用 icon font 一样使用 SVG，可以查阅这篇文章 [the classic post that pits the two against one another](https://css-tricks.com/icon-fonts-vs-svg/) 。

