# C语言基础

为了夯实 CS 基本功，于网上找到一份硬核[学习计划](https://www.yuque.com/ob26eq/cv94p5/xi9hwb)，首先学习的是 C 语言先导课程。

**程序**是用特殊的编程语言用来表达如何解决问题的。不是用编程与计算机交谈，而是描述要求其如何做事情的过程和方法。

**程序的执行**

- 解释：借助一个程序，那个程序能理解你的程序，然后按照你的要求执行。
- 编译：借助一个程序，就像一个翻译，把你的程序翻译成计算机真正能懂的语言-机器语言-写的程序，然后这个机器语言写的程序就能执行了

**解释语言 VS 编译语言**

- 语言本无编译/解释之分
- 常用的执行方式而已
- 解释型语言有特殊的计算能力
- 编译型语言有特定的运算性能

## 前置知识（Unix 命令）

```bash
pwd	Displays the current directory	pwd
ls	List the current directory	ls
ls -l
ls -a
-l : Include file details, -a : Include hidden files, -F : show directories
rm	Remove a file	rm filetonuke.c
mkdir	Create a new directory	mkdir cse251
rmdir	Remove a directory	rmdir cse251
Or rm -r if the directory is not empty.
cd	Change current directory	cd ~/cse251
cp	Copy a file	cp souce destination
mv	Move or rename a file	mv hello.c newname.c
cat	Display the contents of a file	cat hello.c
less	Display file contents nicely	less hello.c
man	Manual pages	man ls
yelp	Nicer help display	yelp &
top	Displays CPU usage	top
q to quit
ps	Lists processes	ps u
kill	Kills a process	kill 15577
```

## C 语言介绍

在 C 语言头部表明引用的库，如常见的 `<stdio.h>` 表明引入的是标准的输入输出库。

![c-basic](/cs/c-basic.png)

```c
#include <stdio.h>

/*
 * comment: this is my first program
 */
// main 函数是 C 语言执行的入口
int main() {
	printf("hello world\n");
}
```

![c-basic-types](/cs/c-basic-types.png)

```c
#include <stdio.h>
#include <limits.h>

int main() {
  printf("int 储存大小：%lu\n", sizeof(int));
}
```

`printf` 函数输出相关参数，详见[文档](https://www.runoob.com/cprogramming/c-function-printf.html)

```c
#include <stdio.h>
int main() {
  char ch = 'A';
  char str[13] = "www.baidu.com"; 
  float flt = 10.234;
  int no = 143;
  double dbl = 20.123456;
  printf("单个字符串 %c\n", ch);
  printf("字符串 %s\n", str);
  printf("浮点数 %f\n", flt);
  printf("整数 %d\n", no);
  printf("双精度 %lf\n", dbl);
  printf("八进制 %o\n", no);
  return 0;
}
```

![c-basic-format](/cs/c-basic-format.png)

```c
#include <stdio.h>
#include <math.h>
int main() {
  printf("%f\n", M_PI); //3.141593
  printf("%.4f\n", M_PI); //3.1416
  printf("%10.2f\n", M_PI); //      3.14
  printf("%-10.2f is PI\n", M_PI); //3.14       is PI
  return 0;
}
```

`%p` 输出变量地址

```c
#include <stdio.h>

int main() {
  float value = 0;
  printf("the value is %p\n", (void*)&value);
  return 0;
}
```

