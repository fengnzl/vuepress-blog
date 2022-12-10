# content-ellipsis

介绍了两种实现文本省略号的方法，相关详细解释请看[鑫大文章](https://www.zhangxinxu.com/wordpress/2009/09/关于文字内容溢出用点点点-省略号表示/)

<!-- more -->

## 常规CSS方法

如果只是一行文本，超出元素以省略号表示，以下是常规方法：

``` css
 p {
   width: 250px;
   border: 1px solid lightblue;
   overflow: hidden;
   text-overflow: ellipsis; //将文本超出以省略号显示
   white-space: nowrap; //文本不会换行，文本会在在同一行上继续，直到遇到 <br> 标签为止
 }
```

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20190724103250.png)

实现多行文本超出部分以省略号表示，可以用以下方法

``` css
<style>p {
  width: 250px;
  border: 1px solid lightblue;
  overflow: hidden;
  text-overflow: ellipsis;
  /*text-overflow : clip; //将文本超出部分剪切*/
  display: -webkit-box;
  -webkit-line-clamp: 3;
  /*  设置行数为3行 如果设置的剪切 则设置几行只显示几行*/
  -webkit-box-orient: vertical;
  /*子元素垂直排列*/
}

</style>
```

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20190724112635.png)

## jQuery限制字符字数的方法

``` js
 //限制字符个数
 $("#text_overflow").each(function() {
   var maxwidth = 18;
   if ($(this).text().length > maxwidth) {
     $(this).text($(this).text().substring(0, maxwidth));
     $(this).html($(this).text() + '...');
   }
 });
```

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20190724112718.png)
