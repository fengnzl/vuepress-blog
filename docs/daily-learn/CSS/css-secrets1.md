# CSS 揭秘学习笔记1

检测某个样式属性是否被支持，即判断在任一元素的 `element.style` 对象上检测该属性是否存在：

```js
function testProperty(property) {
  const root = doucument.documentElement
  
  if(property in root.style) {
    root.classList.add(property.toLowerCase())
    return true
  } else {
    root.classList.add('no-' + property.toLowerCase())
    return false
  }
}
```

检测某个具体属性值是够支持，只需将其赋值给对应的属性，然后检测浏览器是否继续保存该值即可

```js
function testValue(value, property) {
  const dummy = document.createElement('p')
  dummy.style[property] = value
  return !!dummy.style[property]
}
```

## 背景与边框

### 半透明边框

假如我们想给容器设置一层白色背景和半透明边框，内容的背景会从它的半透明边框透上来，我们最开始的尝试可能是这样的：

```css
border: 10px solid rgba(255, 255, 255, 0.5);
background: white;
```

但实际上，看起来效果可能如图所示，这是因为**默认情况下，背景会延伸到边框所在的区域下层**，因此效果看起来没有了边框，实际上是背景颜色从半透明的边框处透上来了。

![borderTransparent](/css/border-transparent.png)

我们可以通过修改 `background-clip` 属性来调整上述的默认行为，其属性值默认为 `border-box`，从而背景会被元素的 `border box` 边框的外沿框所裁切掉。如果不需要背景侵入边框所在范围只需将其设为 `padding-box` 即可，浏览器会用内边距外沿将背景裁切。

```css
border: 10px solid rgba(255, 255, 255, 0.5);
background: white;
background-clip: padding-box;
```

![border-transparent2](/css/border-transparent2.png)