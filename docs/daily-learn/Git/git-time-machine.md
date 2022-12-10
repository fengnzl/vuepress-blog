# Git时光穿梭机

此为学习笔记，教学文档请移步[廖雪峰的官方网站](https://www.liaoxuefeng.com/)，本篇文章主要记录版本会退和恢复文件命令。

<!-- more -->

在git基础里面我们已经成功添加并提交了`readme.txt`文件,现在我们对文件进行修改：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707105112.png)

现在使用`git status`查看结果

```cmd
$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        modified:   readme.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

<font color="red">**git status**</font>命令用来查看仓库当前的状态，上面命令的输出告诉我们，`readme.txt`文件被修改过了，但还没有准备提交的修改。

`git status`只是告诉我们有修改，我们可以通过`git diff`来查看具体的修改内容：

<font color="red">**git diff  (file name)**</font>显示**工作区**该文件与版本库中**当前分支**下该文件的差异。

```cmd
$ git diff
diff --git a/readme.txt b/readme.txt
index c3295f1..a440e5c 100644
--- a/readme.txt
+++ b/readme.txt
@@ -1,2 +1,2 @@
-git is a version controller system.
+git is a distributed controller system.
 git is free software
```

**详解：**

1. `diff --git a/readme.txt b/readme.txt`——对比两个文件，其中a改动前，b是改动后，以git的diff格式显示；
2. `index c3295f1..a440e5c 100644`——两个版本的git哈希值，index区域（add之后）的c3295f1对象和工作区域的a440e5c对象，100表示普通文件，644表示权限控制；
3. `--- a/readme.txt  +++ b/readme.txt`——其中减号表示变动前，加好表示变动后。
4. `@@ -1,2 +1,2 @@`——@@表示文件变动描述合并显示的开始和结束，其中-+表示变动前后，逗号前是起始行位置，逗号后为从起始行往后几行。合起来就是变动前后都是从第1行开始，变动前文件往后数2行对应变动后文件往后数2行。
5. `-git is a version controller system.   +git is a distributed controller system.`  ——+表示增加了这一行，-表示删除了这一行，没符号表示此行没有变动。

知道对齐做了什么修改之后，我们就可以提交修改了，步骤与提交新文件一样，都是两个步骤，第一步`git add`

```cmd
$ git add readme.txt
```

添加成功后，我们可以使用`git status`查看当前仓库的状态

```cmd
$ git status
On branch master
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

        modified:   readme.txt
```

上面的信息告诉我们将要被提交的修改为`readme.txt`，然后我们可以使用`git commit`进行提交。

```cmd
$ git commit -m 'version replaced by distributed in line 1'
[master 2e0bdc4] version replaced by distributed in line 1
 1 file changed, 1 insertion(+), 1 deletion(-)
```

提交后，再次使用`git status`查看状态，

```cmd
$ git status
On branch master
nothing to commit, working tree clean
```

git告诉我们，没有文件需要被提交，且工作目录是干净的。

## 版本回退

我们先再次修改一下`readme.txt`,并进行提交，修改内容如下：

```cmd
Git is a distributed version control system.
Git is free software distributed under the GPL.
```

提交如下：

```cmd
$ git add readme.txt
$ git commit -m 'appened GPL'
[master af61833] appened GPL
 1 file changed, 2 insertions(+), 2 deletions(-)
```

### 查看提交历史

在git中我们可以通过`git log`命令来查看提交的历史记录

``` cmd
commit af6183376d218e36978735de48e9db0790fcb743 (HEAD -> master)
Author: lf <781723804@qq.com>
Date:   Sun Jul 7 15:03:24 2019 +0800

    appened GPL

commit 2e0bdc40e2c63128b955fd0e6c3c3cadc895c684
Author: lf <781723804@qq.com>
Date:   Sun Jul 7 14:45:14 2019 +0800

    version replaced by distributed in line 1

commit 1210adbed7497662a6a0c88bd53adb69e497df69
Author: lf <781723804@qq.com>
Date:   Sun Jul 7 01:44:27 2019 +0800

    write a readme file
```

`git log`显示从近到远的提交日志，我们可以看到总共有3次提交，最近的一次是`appened GPL`，上一次是`version replaced by distributed in line 1`，最早的一次是` write a readme file`

也可以使用<font color="red">**git log --pretty=oneline**</font>而使一条记录显示一行

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707151132.png)

这里黄色的部分是`commit id`（版本号）是一个SHA1计算出来的一个非常大的数字，用十六进制表示。

每提交一个新版本，git会将它们自动串成一条时间线。

### <a id="reset">回退到历史版本</a>

如果我们想要把`readme.txt`回退到上一版本，也就是 ` version replaced by distributed in line 1`那个版本，需要以下的步骤：

首先，必须知道当前版本，在Git中<font color="red">**HEAD**</font>表示当前版本，也就是`appened GPL`版本，想要到上一个版本，就是`HEAD ^`，上上个版本是`HEAD ^^`,如果是前10个版本，则可以用`HEAD~10`,

我们需要使用<font color="red">**git reset**</font>进行版本回退

``` cmd
$ git reset --hard HEAD^
HEAD is now at 2e0bdc4 version replaced by distributed in line 1
```

`--hard`参数有啥意义？这个后面再讲，现在你先放心使用。

我们可以看看 `readme.txt`的内容是不是`version replaced by distributed in line 1`版本

``` cmd
$ cat readme.txt
git is a distributed controller system.
git is free software
```

我们可以看到已经还原到了上一个版本，这时我们使用`git log`查看版本库的状态

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707162122.png)

最新版本的`append GPL`已经不见了，如果想要回到这个版本，则需要以下方法

### 返回未来的版本

想要恢复到`append GPL`的版本，则需要首先找到其<font color="red">**commit id**</font>（版本号），这时就需要<font color="red">**git reflog**</font>来查看git记录每一次的命令。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707162626.png)

这时我们可以看到，`appened GPL`的版本号为`af61833`，然后我们使用<font color="red">**git reset --hard  （commit id）**</font>就可回到未来的某个版本号。

``` cmd
$ git reset --hard af61833
HEAD is now at af61833 appened GPL
```

这是我们使用`cat`命令查看文件内容：

```cmd
$ cat readme.txt
git is a distributed version controller system.
git is free software distributed under GPL
```

说明已经将版本转换回来，Git的版本回退速度非常快，因为Git在内部有个指向当前版本的<font color="red">HEAD</font>指针，当你回退版本的时候，Git仅仅是把HEAD从指向`version replaced by distributed in line 1`：

```ascii
┌────┐
│HEAD│
└────┘
   │
   │    ○ append GPL
   │    │
   └──> ○ version replaced by distributed in line 1
        │
        ○ wrote a readme file
```

改为指向`append GPL`

```ascii
┌────┐
│HEAD│
└────┘
   │
   └──> ○ append GPL
        │
        ○ version replaced by distributed in line 1
        │
        ○ wrote a readme file
```

## 工作区和暂存区

Git与SVN等其他版本库的一个不同之处就是存在一个暂存区的概念。

### 工作区（Working Directory）

即电脑里能够看到的目录，如之前建立的`learngit`文件夹就是一个工作区。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707165214.png)

### 版本库（Repository）

工作区里面的隐藏目录<font color="red">.git</font>就是Git版本库。

Git版本库里面最重要的就是称为<font color="red">**stage**</font>(或者叫index)的暂存区，还有Git为我们自动创建的第一个分支<font color="red">**master**</font>，以及的指针<font color="red">**HEAD**</font>指向`master`分支



我们将文件提交到Git版本库时，是分两步进行的：

1. `git add`进行添加文件，实际上是将文件添加早暂存区；
2. `git commit`进行文件提交，实际是将 暂存区中的所有文件提交到当前分支。

因为我们使用的是Git为我们自动创建的`master`分支，所以提交到的也是`master`分支

我们先对`readme.txt`文件进行修改，在最后一行添加如下内容：

``` cmd
git is a distributed version controller system.
git is free software distributed under GPL.
git has a mutable index called stage.
```

然后在工作区新建一个`license`文本文件，里面内容随便填写。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      先用`git status`查看版本库的状态

```cmd
$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        modified:   readme.txt

Untracked files:
  (use "git add <file>..." to include in what will be committed)

        license.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

Git 告诉我们`readme.txt`文件被修改了，而`license.txt`文件还从来没有被提交过，所以其状态为`Untracked`。

现在使用两次命令`git add`之后，将`readme.txt`和`lincese.txt`文件都添加到暂存区后，使用`git status`查看状态

``` cmd
$ git status
On branch master
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

        new file:   license.txt
        modified:   readme.txt
```

这时，暂存区变为如图所示：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707192738.png)

所以<font color="red">**git add**</font>相当于将要提交的修改添加到暂存区（stage）,然后通过<font color="red">**git commit**</font>将暂存区的所有修改提交到分支。

```cmd
$ git commit -m 'how stage works'
[master 35561ed] how stage works
 2 files changed, 3 insertions(+), 1 deletion(-)
 create mode 100644 license.txt
```

一旦提交之后，如果没有对工作区进行修改，则工作区就是“干净”的，类似于清空了购物车。

```cmd
$ git status
On branch master
nothing to commit, working tree clean
```

这时暂存区中则没有任何内容：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707193211.png)

## 管理修改

<font color="red">Git跟踪管理的是修改，而不是文件。</font>这是Git比其他版本控制系统优秀的原因。

例如，我们在`readme.txt`文件中天剑一行内容：

```cmd
$ cat readme.txt
git is a distributed version controller system.
git is free software distributed under GPL.
git has a mutable index called stage.
git tracks change
```

然后添加：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707194524.png)

然后再次修改`readme.txt`文件

```cmd
$ cat readme.txt
git is a distributed version controller system.
git is free software distributed under GPL.
git has a mutable index called stage.
git tracks changes of files
```

提交：

``` cmd
$ git commit -m 'git tracks changes'
[master fada47f] git tracks changes
 1 file changed, 1 insertion(+)
```

查看状态

``` cmd
$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        modified:   readme.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

这表明第二次修改并没有提交，当时的操作过程如下：

``` cmd
第一次修改 -> git add -> 第二次修改 -> git commit
```

由于Git管理的是修改，当第一次`git add`之后，第一次修改被添加到暂存区，准备提交，第二次修改并没有进行`git add`将修改添加到暂存区，因此`git commit`只是把暂存区的文件进行提交，也就是第一次修改文件。

提交后，可以使用<font color="red">git diff HEAD -- readme.txt</font>查看工作区和版本库里面最新版本的区别。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707195915.png)

可见第二次修改并没有被提交。

可以在第二次修改完成后统一进行提交，也可以修改一次，进行一次`git add`。

## 撤销修改

当地随便在`readme.txt`文件下随便写了一行文字，

``` cmd
$ cat readme.txt
git is a distributed version controller system.
git is free software distributed under GPL.
git has a mutable index called stage.
git tracks changes of files
my lalla
```

在提交之前，你发现这行有错误，你可以删除掉最后一行，然后手动将文件恢复到上一个版本的状态，如果使用`git status`查看

``` cmd
$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        modified:   readme.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

git会提示你<font color="red">**git checkout -- file**</font>可以丢弃工作区的修改

```cmd
$ git checkout -- readme.txt
```

命令<font color="red">**git checkout -- readme.txt**</font>文件的意思就是把，`readme.txt`文件在工作区的修该全部撤销，其中包括两种情况：

1. `readme.txt`文件修改后，还没有添加到暂存区，则撤销修改回与版本库一样的状态
2. `readme.txt`文件已经添加到暂存区，之后又进行了修改，则撤销修改回添加到暂存区之后的状态。

总之，就是让这个文件回到最近一次`git commit`或`git add`时的状态。

现在查看文件的状态：

``` cmd
$ cat readme.txt
git is a distributed version controller system.
git is free software distributed under GPL.
git has a mutable index called stage.
git tracks change
```

可以发现文件内容复原了。

如果添加了错误内容，并`git add`将其添加到暂存区域了，这是我们在使用`git status`查看状态

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707210952.png)

Git告诉我们使用<font color="red">**git reset HEAD file**</font>可以把暂存区的修改撤销掉（unstage），重新放回到工作区

``` cmd
$ git reset HEAD readme.txt
Unstaged changes after reset:
M       readme.txt
```

`git reset`命令既可以回退版本，也可以把暂存区的修改回退到工作区。当我们用`HEAD`时，表示最新的版本。

再次使用`git status`查看，可以看到暂存区是干净的，工作区有修改

``` cmd
$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        modified:   readme.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

这时我们可以使用<font color="red">**git checkout -- file**</font>丢弃工作区的修改

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707211819.png)

如果已经提交到了版本库中，则需要使用<a href="#reset">版本回退</a>来撤销修改。前提是还没推送到远程库

## 删除文件

在Git中，删除也是一种操作，我们先添加一个`test.txt`文件并提交：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707214525.png)

一般我们会在工作区中删除文件，或者在命令行使用`rm`命令删除文件

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707214641.png)

这个时候Git知道删除了文件，所以工作区和版本库中文件不一致，可以使用`git status`来查看那些文件被删除了

```cmd
$ git status
On branch master
Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        deleted:    test.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

1. 如果确实要删除此文件，根据提示可以使用`git add/rm  file`删除，并使用`git commit`进行提交

   ![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707215246.png)

   ![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190707215549.png)

这时，文件就从版本库中删除了。

<font color="blue">小提示：先手动删除文件，然后使用git rm file和git add  file效果是一样的。</font>都将文件修改信息添加到了暂存区。

2.不小心错误的删除了文件，因为版本库中还存在，所以我们可以很轻松的把文件回复到最新版本。

```cmd
$ git checkout -- file
```

 **注意：从来没有被添加到版本库就被删除的文件，是无法恢复的！**