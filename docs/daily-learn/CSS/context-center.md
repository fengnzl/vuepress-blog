# CSS实现中文两端对齐

本文介绍了实现中文文本两端对齐的方法。

<!-- more -->

遇到需要设置中文两端对齐的需求，如下所示：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20190725204325.png)

当设置 `text-align:justify` 确并没有实现实现两端对齐的效果，查阅过程中看到[鑫大](https://www.zhangxinxu.com/wordpress/2015/08/chinese-english-same-padding-text-justify/)的说明如下：

> 要理解原理，我们首先要搞清楚文本的两端对齐声明 `text-align:justify` 起作用的本质。首先，大家要知道， `text-align:justify` 是专门为英文设计的，谁叫CSS是老外发明的呢，用来实现英文语句的两端对齐。注意这里的，是语句的对齐。大家应该都知道，英文语句是一个单词一个单词组合而成的，每个单词之前使用空格分隔。
>
> `text-align:justify` 之所以可以让英文段落两端对齐，那是因为每个英文单词之前那个透明看不见的空格被拉伸了。注意，是空格被拉伸了，对，只有空格。因此，当我们写下一段洋洋洒洒中文内容的时候， `text-align:justify` 是没有任何作用的，跟没设置没任何区别。为什么呢？很简单，因为中文是一个一个汉字，汉字之间是没有空格的，自然也就不能拉伸，自然也就不能两端对齐。怎么办呢？难道中文就不行了吗？
> 当然不是！既然正常的中文文字之间没有空格，我们自己加一点不就好了。例如下面代码：

这里鑫大的使用方法还需要使用 `JavaScript` 代码获取当前字符串然后进行通过以下操作加入空格，就可实现

``` js
"宁泽涛小鲜肉".split("").join(" ");
```

这里我们如果想要使用纯 `CSS` 的方式，则还需要使用 `text-justify` 样式

> - auto : 允许浏览器用户代理确定使用的两端对齐法则
> - inter-word : 通过增加字之间的空格对齐文本。该行为是对齐所有文本行最快的方法。它的两端对齐行为对段落的最后一行无效
> - newspaper : 通过增加或减少字或字母之间的空格对齐文本。是用于拉丁文字母表两端对齐的最精确格式
> - distribute : 处理空格很像newspaper，适用于东亚文档。尤其是泰国
> - distribute-all-lines : 两端对齐行的方式与distribute相同，也同样不包含两段对齐段落的最后一行。适用于表意字文档
> - inter-ideograph : 为表意字文本提供完全两端对齐。他增加或减少表意字和词间的空格

**但chrome不识别inter-ideograph属性**, 所以不能使用以下方法：

``` css
text-justify: inter-ideograph;
text-align: justify;
```

然后经过同事的讲解得到了解决办法，具体详解请见[博客](https://www.cnblogs.com/zjjDaily/p/9525350.html)

解决方法的 `css` 样式：

``` css
 p {
   color: #999999;
   margin-bottom: .25rem;

   span {
     width: 1.2rem;
     height: .28rem;
     line-height: .28rem;
     display: inline-block;
     text-align: justify;
     text-align-last: justify;
   }

   span::after {
     content: '';
     width: 100%;
     position: absolute;
   }
 }
```

`html` 文本内容：

``` html
<p> <span>姓 名</span>：李然 </p>
<p><span>性 别</span>：女</p>
```

效果如图：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20190726112837.png)
