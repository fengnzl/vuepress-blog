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