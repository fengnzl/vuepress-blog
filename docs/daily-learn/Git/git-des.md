# Git简介（学习笔记）

此为学习笔记，教学文档请移步[廖雪峰的官方网站](https://www.liaoxuefeng.com/)

<!-- more -->

## git简介

git是linux之父linus为了更好的管理linux代码而用**C语言**开发的分布式的版本控制器。

集中式版本控制系统和分布式版本控制系统的区别：

1. 集中式版本控制系统：例如SVN和CVS,其必须联网才能操作，版本库集中在中央系统，每次对比和提交代码都必须连接到中央系统才行，一旦中央服务器出现问题，则所有人都无法干活。
2. 分布式控制系统：每个人的电脑就是一个版本库，包含完整的代码和历史，可以进行脱机操作。
3. 两个的区别：分布是控制系统的安全性更高，可以在脱机情况下查看历史版本，一旦中央仓库挂了，只需重新创建一个仓库，重新推送即可。

## git安装

### linux下安装git

首先输入 `git` ，查看是否安装：

``` cmd
$ git
The program 'git' is currently not installed. You can install it by typing:
sudo apt-get install git
```

如果没有安装，一般对于Debian和Ubantu  Linux则会提示你使用 `sudo apt-get install git` 命令进行安装, 老一点的版本则需要使用 `sudo apt-get install git-core` 进行安装。

对于其他Linux则需要在git官网上下载源码，然后通过依次输入以下代码<font color="red"> `./config` ， `make` ， `sudo make install` </font>进行安装。

### 在Mac OS X上安装Git

1. 使用homebrew安装git，具体方法参考官方文档http://brew.sh/。
2. 直接从AppStore安装Xcode，Xcode集成了Git，不过默认没有安装，你需要运行Xcode，选择菜单“Xcode”->“Preferences”，在弹出窗口中找到“Downloads”，选择“Command Line Tools”，点“Install”就可以完成安装了。

### 在Windows上安装Git

直接在[git官网](https://git-scm.com/downloads)下载安装程序进行安装即可

### 设置姓名和邮箱

在安装完成之后，由于git是分布式版本控制系统，一般需要打开git bash进行设置，名字和email，用于提交时显示提交人信息，输入以下命令

``` cmd
$ git config --global user.name 'your name'
$ git config --global user.email 'your email'
```

其中 `--global` 用来全局设置，也可以在单个仓库进行单独设置。

## 创建版本仓库

版本库（仓库）即repository, 可以简单的理解为一个目录，里面的所有文件都被git所管理，每个文件的修改、删除，git都能进行跟踪，并在某刻时刻进行还原。

### 创建空目录

首先建立一个空的目录, 并进入到目录中，通过 `pwd` 查看目录所在地址：

``` cmd
$ mkdir learngit
$ cd learngit
$ pwd
/c/Users/lf/Desktop/learngit
```

### 初始化仓库

通过 `git init` 实例化仓库，这是在文件目录下可以看到 `.git` 目录，这个目录是用来跟踪版本库的，不可以随便修改，以免破坏git仓库。

``` cmd
$ git init
Initialized empty Git repository in C:/Users/lf/Desktop/learngit/.git/
```

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/img/20190707005503.png)

这个目录默认是隐藏的，可以通过 `ls -ah` 来查看

### 添加文件到版本仓库

**注意：**所有的版本仓库，只能追踪文本文件的改动，比如TXT文件，网页，所有的程序代码等等，而像图片、视频这些二进制文件，虽然也能由版本控制系统管理，但没法跟踪文件的变化，只能把二进制文件每次改动串起来，也就是只知道图片从100KB改成了120KB，并不知道改变的其中内容。

Microsoft的Word格式是二进制格式，因此，版本控制系统是没法跟踪Word文件的改动的，所以我们要使用纯文本方式编写文件，建议使用<font color="red">**标准的UTF-8编码**</font>，所有语言使用同一种编码，既没有冲突，又被所有平台所支持。

**建议**notepade++代替记事本进行编辑，因为windows自带的记事本会在每个文件开头添加了0xefbbbf（十六进制）的字符。

现在编写一个 `readme.txt` 文件，内容如下：

``` 
$ touch readme.txt
$ vi readme.txt
//编写内容如下
Git is a version control system.
Git is free software.
```

此文件一定要放在<font color="red"> `learngit` </font>目录下（子目录），因为这是一个git仓库，放在别处，则找不到此文件。

把文件放到仓库只需要两个步骤：

#### 添加到仓库

通过<font color="red"> `git add` </font>告诉git，将文件添加到仓库。

``` cmd
$ git add readme.txt
```

执行命令之后，若没有任何显示，则说明添加成功。

在windows下操作，可能会出现以下警告信息：

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/img/20190707012043.png)

**原因：**这是因为在 `windows` 下使用 `CRLF` 标识一行的结束，而在 `Linux/UNIX` 系统中只使用 `LF` 标识一行的结束。这里的CRLF指的是 `Carriage-Return` (回车) ` Line-Feed` （换行）。

通常情况下，Git库不会自动修改文件内容，但是默认会将入库的文件的行尾符设置为LF，会将检出的文件的行尾符设置为CRLF。但是在执行如下操作时出现如上警告：

上面的警告表明在 `readme.txt` 的行尾为LF，在git入库时这里将会被替换为CRLF，这里的警告无伤大雅，因为在git库中，文件仍然是以LF结尾的。

**去除警告：**Git的CRLF相关特性与gitattributes文件中的设置相关。

在工作目录中，我们可以通过设置eol属性控制一个文件的行尾为CRLF或LF。我们也可以通过设置core.eol属性控制当前Git库中的所有文件的行尾为CRLF或LF。我们还可以设置core.autocrlf属性以覆盖core.eol属性的设置。如果要设置工作目录中的文件的行尾总是CRLF，而Git库中的文件的行尾总是LF，默认core.autocrlf=true。

1. 查看core.autocrlf属性

   

``` cmd
   $  git config --global  --get core.autocrlf
   
   $  git config --get core.autocrlf
   ```

   ![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/img/20190707013533.png)

2. 设置core.autocrlf属性

   设置core.autocrlf=false, 去除警告（只是眼不见心不烦而已）

   

``` cmd
   $ git config core.autocrlf false
   ```

   ![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/img/20190707013711.png)

此时在 `git add` 则不会出现警告信息

如果直接执行 `git add` 而不指定添加的文件，会出现以下信息：

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/img/20190707143808.png)

上面的信息说没有指定添加的文件，你或许想要使用的命令是 `git add .` 。

**[相关命令及区别](https://www.cnblogs.com/skura23/p/5859243.html)**

* `git add -A ` 提交所有变化
* `git add -u ` 提交被修改(modified)和被删除(deleted)文件，不包括新文件(new)
* `git add . ` 提交新文件(new)和被修改(modified)文件，不包括被删除(deleted)文件

#### 提交到仓库

通过<font color="red"> `git commit -m'提交说明'` </font>命令，将文件提交到仓库

``` cmd
$ git commit -m 'write a readme file'
[master (root-commit) 1210adb] write a readme file
 1 file changed, 2 insertions(+)
 create mode 100644 readme.txt
```

<font color="red"> `git commit` </font>命令提交成功后，会告诉你<font color="red"> ` 1 file changed` </font>：一个文件被改动，我们新添加的readme.txt文件，<font color="red"> `2 insertions(+)` </font>：插入了两行内容（readme.txt文件由两行内容）。

**注意：**你可以add多个文件，或多次add不同文件，通过<font color="red"> `commit` </font>一次提交多个文件。
