# 浏览器：文档，事件，接口

## DOM 相关

对于特定的 DOM 节点，我们可以通过导航属性访问其相关的节点

这些属性主要分为两组：

- 对于所有节点：`parentNode`，`childNodes`，`firstChild`，`lastChild`，`previousSibling`，`nextSibling`。
- 仅对于元素节点：`parentElement`，`children`，`firstElementChild`，`lastElementChild`，`previousElementSibling`，`nextElementSibling`。

**兄弟节点相关问题**

```js
如果 elem 是任意一个 DOM 元素节点……
elem.lastChild.nextSibling 值一直都是 null，这个判定是不是真的？
elem.children[0].previousSibling 值一直都是 null，这个判定是不是真的？

1、这是真的，因为 elem.lastChild 就是最后一个节点，他没有 nextSibling
2、错误，因为 elem.children[0] 为其第一个子元素，它前面可能存在非元素节点，
因此其 previousSibling 可能为一个文本节点
```

### 搜索

除了 `getElementsBy*` 和 `querySelector*` 方法进行搜索外，`querySelectorAll` 返回的是一个**静态的**集合。

我们可以使用 [elem.matches(css)](http://dom.spec.whatwg.org/#dom-element-matches) 来检查 `elem` 是否与给定的 CSS 选择器匹配，返回 `true` 或 `false`

```js
<a href="http://example.com/file.zip">...</a>
<a href="http://ya.ru">...</a>

<script>
  // 不一定是 document.body.children，还可以是任何集合
  for (let elem of document.body.children) {
    if (elem.matches('a[href$="zip"]')) {
      alert("The archive reference: " + elem.href );
    }
  }
</script>
```

`elem.closest(css)` 方法会查找与 CSS 选择器匹配的最近的祖先

```js
<h1>Contents</h1>

<div class="contents">
  <ul class="book">
    <li class="chapter">Chapter 1</li>
    <li class="chapter">Chapter 1</li>
  </ul>
</div>

<script>
  let chapter = document.querySelector('.chapter'); // LI

  alert(chapter.closest('.book')); // UL
  alert(chapter.closest('.contents')); // DIV

  alert(chapter.closest('h1')); // null（因为 h1 不是祖先）
</script>
```

`elemA.contains(elemB)` 可以检查子级与父级之间关系的方法。

`DOM` 节点类的继承关系，如下所示

![dom-node](/js/dom-node.png)

针对一个节点，可以通过 `tagName` 或者 `nodeName` 来读取其元素节点名称或节点名称。

### 特性和属性

如果一个特性不是标准的，那么就没有相对应的 DOM 属性。如 `type` 是 `<input>` 的一个标准的特性，但对于 `<body>` 来说却不是。

所有的特性可以通过以下方法来进行访问：

- `elem.hasAttribute(name)` — 检查特性是否存在。
- `elem.getAttribute(name)` — 获取这个特性值。
- `elem.setAttribute(name, value)` — 设置这个特性值。
- `elem.removeAttribute(name)` — 移除这个特性
- `elem.attributes` — 读取所有特性，其返回具有 `name` 和 `value` 属性的对象集合

特性名称是大小写不敏感的，**所有以 “data-” 开头的特性均被保留供程序员使用。它们可在 `dataset` 属性中使用。**

### 元素滚动

元素滚动相关属性的整体图片如下图：

![scroll](/js/scroll-property.png)

**注意**：除了 `scrollTop` 和 `scrollLeft` 可以改变外，其他属性都为只读属性

**CSS width 与 clientWidth 的不同点**

1. `clientWidth` 值是数值，而 `getComputedStyle(elem).width` 返回一个以 `px` 作为后缀的字符串。
2. `getComputedStyle` 可能会返回非数值的 width，例如内联（inline）元素的 `"auto"`。
3. `clientWidth` 是元素的内部内容区域加上 padding，而 CSS width（具有标准的 `box-sizing`）是内部内容区域，**不包括 padding**。
4. 如果有滚动条，并且浏览器为其保留了空间，那么某些浏览器会从 CSS width 中减去该空间（因为它不再可用于内容），而有些则不会这样做。`clientWidth` 属性总是相同的：如果为滚动条保留了空间，那么将减去滚动条的大小。

### window 滚动

**几何：**

- 文档可见部分的 width/height（内容区域的 width/height）：`document.documentElement.clientWidth/clientHeight`

- 整个文档的 width/height，其中包括滚动出去的部分：

  ```javascript
  let scrollHeight = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight,
    document.body.clientHeight, document.documentElement.clientHeight
  );
  ```

**滚动：**

- 读取当前的滚动：`window.pageYOffset/pageXOffset`。
- 更改当前的滚动：
  - `window.scrollTo(pageX,pageY)` — 绝对坐标，
  - `window.scrollBy(x,y)` — 相对当前位置进行滚动，
  - `elem.scrollIntoView(top)` — 滚动以使 `elem` 可见（`elem` 与窗口的顶部/底部对齐）。

## 事件简介

分配事件处理程序有以下三种方式：

1. HTML 特性（attribute）：`onclick="..."`。这里函数需要添加括号，因为浏览器在读取其属性的时候，会创建如下处理程序

   ```js
   button.onclick = function() {
   	sayThanks()
   }
   ```

2. DOM 属性（property）：`elem.onclick = function`。

3. 方法（method）：`elem.addEventListener(event, handler[, phase])` 用于添加，`removeEventListener` 用于移除。

 `transtionend` 和 `DOMContentLoaded` 等少数事件必须使用第三种方法才可发生作用。无论 `addEventListener` 怎样，DOM属性的处理程序都会触发，且先于 `addEventListener` 触发事件。

### 冒泡和捕获

几乎所有事件都会“冒泡”，如 `focus` 事件就不会冒泡

`event.stopPropagation()` 阻止事件冒泡，但是当前元素上的其他处理程序都会继续运行。 `event.stopImmediatePropagation()` 方法，不仅会阻止冒泡，还会阻止当前元素上其他处理程序的执行。

事件被阻止冒泡后，则不会被 `addEventListener` 所监听。

[DOM 事件](http://www.w3.org/TR/DOM-Level-3-Events/)标准描述了事件传播的 3 个阶段：

1. 捕获阶段（Capturing phase）—— 事件（从 Window）向下走近元素。
2. 目标阶段（Target phase）—— 事件到达目标元素。
3. 冒泡阶段（Bubbling phase）—— 事件从元素上开始冒泡。

### 阻止浏览器行为

有两种方式来告诉浏览器我们不希望它执行默认行为：

- 主流的方式是使用 `event` 对象。有一个 `event.preventDefault()` 方法。
- 如果处理程序是使用 `on<event>`（而不是 `addEventListener`）分配的，那返回 `false` 也同样有效。

如果默认行为被阻止，那么 `event.defaultPrevented` 属性为 `true`，否则为 `false`