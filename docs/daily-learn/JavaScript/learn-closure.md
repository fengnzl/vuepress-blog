# JavaScript闭包

当一个函数能够访问和操作另一个函数作用域的变量时，就构成了闭包（closure)。

<!-- more -->

首先我们要搞清楚JavaScript的变量作用域。

## 变量的作用域

作用域（scope），就是变量的有效范围，变量可以在哪个范围内使用。

变量的作用域分两种：全局作用域和函数作用域。

**全局变量：**定义在全局作用域，可以在JavaScript代码的任何位置调用。可以理解全局对象的一个属性（例如浏览器中的window对象）。

**局部变量：**定义在函数内部，只能在函数内部使用。

<font style="color:red">1、全局变量相当于全局对象的一个属性</font>

如当在HTML文件中编写JavaScript时，其全局对象为浏览器中的window对象。

``` js
< script >
  var name = "luff";
console.log(name); //luff
console.log(window.name); //luff
<
/script>
```

函数创建有**函数声明**和**函数表达式**两种方式，当使用函数表达式定义函数时，实际上也相当于一个变量，因此在全局作用域定义的函数也相当于全局变量，并绑定在window对象上。

``` js
 < script >
   var fun = function() {
     console.log('this is global variable');
   }
 fun(); //直接调用 fun()  this is global variable
 window.fun(); //通过window.fun()调用 this is global variable
 <
 /script>
```

<font style="color:red">2、函数内部可以直接读取全局变量</font>

``` js
var name = "aa";

function fun() {
  console.log(name);
}
fun(); //aa
```

<font style="color:red">3、函数内部的局部变量的优先级高于同名的全局变量</font>

``` js
var name = "aa"; //全局变量
function fun() {
  var name = "lullabies"; //局部变量
  console.log(name);
}
fun(); //lullabies
console.log(name); //aa
```

要注意，同一个作用域会发生**变量提升**。

所谓变量提升，就是执行JavaScript代码时，其会先扫描整个语句，记那个便利那个声明提升到作用域顶部。

如在**全局作用域**中：

``` js
// `use strict`
console.log(name); //undefined
var name = 'luff';
```

无论是否在严格模式下，console.log都会显示undefined，这是因为变量name的值为undefined，JavaScript自动提升了变量name的声明，但不会对它进行赋值。相当于以下的代码：

``` js
 `use strict`
 var name; //提升变量name的声明
 console.log(name); //undefined
 name = 'luff';
```

同理在**函数作用域（局部作用域）**中：

``` js
function fun() {
  'use strict';
  var x = 'hello ' + y; //hello undefined
  console.log(x);
  var y = 'world';
}
fun();
//上面的代码相当于
function fun() {
  'use strict';
  var y; //提升y的声明
  var x = 'hello ' + y; //hello undefined
  console.log(x);
  y = 'world';
}
fun();
```

<font style="color:red">4、函数内部没有用var声明的变量也是全局变量，会影响到函数外部的全局变量的值</font>

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/img/20190607135937.png)

**用var和不用var声明变量的区别？**

1. 在函数内部用var声明变量为局部变量，不用var声明的变量为全局变量。

2. 用var声明的变量不能用delete删除，而有用var声明的变量可以用delete删除掉。

   

``` js
   var a = 1;
   h = 100;
   console.log(a); //1
   console.log(h); //100
   delete a;
   delete h;
   console.log(a); //1
   console.log(h); //Uncaught ReferenceError: h is not defined
```

**块级作用域**

像PHP，Java等语言，花括号里面（如if条件语句）都有自己的作用域，这个作用域叫做块级作用域。在此作用域生命的变量不能被外部其他地方所引用。而**ECMAScript5及之前的版本都没有块级作用域**，除了try-catch中的catch分句。所以花括号能包裹的只有函数作用域。

``` js
var name = "stt";

function fun(name) {
  if (name == "luff") {
    var age = 28;
  }
  console.log(age); //unfined
}
fun(name);
//相当于
function fun(name) {
  var age;
  if (name == 'luff') {
    age = 28;
  }
  console.log(age);
}
```

除了条件语句，for循环的语句也是如此。

**作用域链**

每个函数都有自己的作用域，当一个函数嵌套另外一个函数时，相当于一个作用域关联另一个作用域，这就相当于一条锁链将其连接在一次，因此称其为**作用域链**。其最顶层为全局作用域，子对象会逐层向上搜索变量，直达匹配到变量，则搜索结束，所以父级变量对子级都是可见的，反之不行。

``` js
var name = "strick";

function fun() {
  function fun2() {
    console.log(name); //strick
  }
  fun2();
}
fun();
```

## 闭包

简单的讲，闭包就是能够读取其他函数内部变量的函数。因此创建闭包的常见方式是一个函数中嵌套另一个函数或者将一个匿名函数作为值传入函数中。

### 闭包函数的特点

#### 1、使用闭包函数，内存不会被释放

``` js
function fun() {
  var a = 1;

  function fun2() {
    console.log(a);
    a++;
  }
  return fun2;
}
var m = fun();
m(); //1
m(); //2
m(); //3
```

首先函数的调用依赖于作用域，**作用域是在函数定义时决定的**，m实际上就是闭包fun2()函数，他一共运行了三次，三次的值分别为1, 2, 3, 这说明fun()中的变量一直保存在内存中，并没有被清除。这是因为fun是fun2的父函数，而fun2被赋予了一个全局变量中，因此fun2一致在内存中，由于fun2依赖于其父函数fun，所以fun不会在调用结束后，被垃圾回收机制（garbage collection）回收。

#### 2、闭包函数可以读取局部变量

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/img/20190607152913.png)

### 闭包的两种用途

#### 私有变量

JavaScript中不能像其他的语言使用传统语法定义私有变量，但是函数中的变量可以当作其私有变量，因此需要通过闭包函数来访问。

``` js
function fun() {
  //私有变量
  var name;
  //匿名函数 设置私有变量的值
  this.setName = function(value) {
    name = value;
  };
  //访问私有变量
  this.getName = function() {
    return name;
  };
}
var obj = new fun();
obj.setName("luff");
console.log(obj.getName()); //luff
```

#### 回调函数

把函数作为值传递到某处，并在某个时刻进行回调的时候，就会创建一个闭包。

如使用定时器执行回调。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/img/20190607161058.png)

参考：

​			[学习Javascript闭包（Closure）- 阮一峰](http://www.ruanyifeng.com/blog/2009/08/learning_javascript_closures.html)

​			[闭包 - 廖雪峰](https://www.liaoxuefeng.com/wiki/1022910821149312/1023021250770016)
