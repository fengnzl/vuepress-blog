# Arrays, symbols, and realms

::: tip

* 原文：[Arrays, symbols, and realms](https://jakearchibald.com/2017/arrays-symbols-realms/)
* 作者：[Jake](https://twitter.com/jaffathecake)
* 翻译：[城南花已开](https://fengnzl.github.io/)

:::

在 twitter 上，Allen Wirfs-Brock 向人们提出了 [Array.isArray(obj) 具体做了什么](https://twitter.com/awbjs/status/939240121269809152)的问题，但实际上他们并不知道。更重要的事，我同样也不清楚。

## 数组类型检查

```js
function foo(obj) {
	// ...
}
```

如果 `obj` 是数组的话，我们想对其做些特定的处理。例如，使用 `JSON.stringify` 当在数组是输出与其它对象是不同。

我们可以这样进行判断：

```js
if (obj.constructor == Array) // ...
```

但是对于继承 Array 的数据来说，上述判断会为 false :

```js
class SpecialArray extends Array {}
const specialArray = new SpecialArray();
console.log(specialArray.constructor === Array); // false
console.log(specialArray.constructor === SpecialArray); // true
```

针对子类，我们可以使用 `instanceof` 来判断：

```js
console.log(specialArray instanceof Array); // true
console.log(specialArray instanceof SpecialArray); // true
```

但对于多领域（ [realms](https://www.ecma-international.org/ecma-262/6.0/#sec-code-realms) ）来说，事情就变得复杂起来：

### 多领域

一个领域（ realm ）包含了 JavaScript 全局对象，即 `self` 所指向的那个。因此，代码运行在 worker 中和代码运行在页面上属于不同的 realm 。这对于不同的 iframes 也成立，但是同源（ same-origin ）iframes 们共享着同一个 ECMAScript agent ，意味着对象可以在不同领域中进行传递。

```js
<iframe srcdoc="<script>var arr = [];</script>"></iframe>
<script>
  const iframe = document.querySelector('iframe');
  const arr = iframe.contentWindow.arr;
  console.log(arr.constructor === Array); // false
  console.log(arr.constructor instanceof Array); // false
</script>
```

但是上述判断均为 `false` 是因为：

```js
console.log(Array === iframe.contentWindow.Array); // false
```

iframe 拥有自己的 `array constructor` ，这与父页面中的不是同一个对象。

## Array.isArray

```js
console.log(Array.isArray(arr)); // true
```

`Array.isArray` 即使在另一个领域中创建的数组也会返回 true 。它会对任何领域中的 `Array`  子类返回 true ， `JSON.stringify` 内部使用的也是它。

但是，正如 [Allen](https://twitter.com/awbjs/status/939607812094574594) 所提到的，这不意味着 `arr` 拥有数组方法。一些，甚至所有的方法都被设置为了 undefined ，甚至 array 的原型也没了。

``` js
const noProtoArray = [];
Object.setPrototypeOf(noProtoArray, null);
console.log(noProtoArray.map); // undefined
console.log(noProtoArray instanceof Array); // false
console.log(Array.isArray(noProtoArray)); // true
```

我在 Allen 的调查表中选错了答案，我选择了最少人选择的“它拥有数组的方法”这个答案。是的，现在仍然感觉很时髦。

不管怎样，如果您真的想避免上述问题，您可以在数组原型中应用数组方法：

``` js
if (Array.isArray(noProtoArray)) {
  const mappedArray = Array.prototype.map.call(noProtoArray, callback);
  // …
}
```

## Symbols and realms

来看以下代码：

``` js
<iframe srcdoc="<script>var arr = [1, 2, 3];</script>"></iframe>
<script>
  const iframe = document.querySelector('iframe');
  const arr = iframe.contentWindow.arr;

  for (const item of arr) {
    console.log(item);
  }
</script>
```

上面的代码会输出 1,2,3 。很出人意料，但是对于 `for...of` 循环其通过调用 `arr[Symbol.iterator]` 方法，并可以进行跨 realm 工作，下面是它如何工作的：

```js
const iframe = document.querySelector('iframe');
const iframeWindow = iframe.contentWindow;
console.log(Symbol === iframeWindow.Symbol); // false
console.log(Symbol.iterator === iframeWindow.Symbol.iterator); // true
```

即使每个 realm 拥有自己的 `Symbol` 实例，但是 `Symbol.iterator` 却是一样的。

引用 [Keith Cirkel](https://twitter.com/Keithamus/status/939788908417748992) 的一句话， `Symbol` 是 JavaScript 中最独特和最不独特的东西了。

### 最独特

```js
const symbolOne = Symbol('foo');
const symbolTwo = Symbol('foo');
console.log(symbolOne === symbolTwo); // false
const obj = {};
obj[symbolOne] = 'hello';
console.log(obj[symbolTwo]); // undefined
console.log(obj[symbolOne]); // 'hello'
```

传入 `Symbol` 函数中的字符串仅仅是一个描述信息。symbol 是独一无二的，即使在同一个 realm 中。

### 最不独特

```js
const symbolOne = Symbol.for('foo');
const symbolTwo = Symbol.for('foo');
console.log(symbolOne === symbolTwo); // true
const obj = {};
obj[symbolOne] = 'hello';
console.log(obj[symbolTwo]); // 'hello'
```

`Symbol.for(str)` 根据你字符串新建了一个唯一的 symbol 对象。重点是，跨了领域之后，它还是一样的。

```js
const iframe = document.querySelector('iframe');
const iframeWindow = iframe.contentWindow;
console.log(Symbol.for('foo') === iframeWindow.Symbol.for('foo')); // true
```

这基本上就是 `Symbol.iterator` 能够工作的原因。

## 创建自己的 is 函数

如果我们想创建自己的跨领域的 `is` 函数，我们可以通过 symbol 来实现：

```js
const typeSymbol = Symbol.for('whatever-type-symbol');

class Whatever {
  static isWhatever(obj) {
    return obj && Boolean(obj[typeSymbol]);
  }
  constructor() {
    this[typeSymbol] = true;
  }
}

const whatever = new Whatever();
Whatever.isWhatever(whatever); // true
```

即使在另一个领域创建它的实例，即使是子类，甚至是将其原型移除，它也会工作。

唯一的一个小问题是，你需要避免命名冲突。同时如果其他人同样创建了一个 `Symbol.for('whatever-type-symbol')` ，并且用于其他地方时，上述的 `isWhatever` 将会返回 false 。

## 更多阅读

- [Iterators](https://jakearchibald.com/2014/iterators-gonna-iterate/)
- [Async iterators](https://jakearchibald.com/2017/async-iterators-and-generators/)
- [Keith Cirkel's deep dive into symbols](https://www.keithcirkel.co.uk/metaprogramming-in-es6-symbols/)