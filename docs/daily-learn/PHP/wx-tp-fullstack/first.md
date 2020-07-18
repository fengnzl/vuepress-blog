# 微信小程序商城构建全栈应用（一）

此项目是使用TP5编写服务端接口及微信支付登陆等处理。这里主要介绍了项目的环境，工具及准备工作，以及TP5中的模块，路由与请求参数的获取。

<!-- more -->

## 环境

Web框架：ThinkPHP5.024
基础语言、环境：PHP 5.6，MySQL，Apache，PHPEnv
客户端：小程序
开发工具：PHPStorm，微信Web开发者工具（VC Code），PostMan（Fiddler），Navicat 

## TP5层次结构

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127191255.png)

TP5自带的Web Server：

public目录下输入`php -v localhost:8080 router.php`即可

## TP5基本命令

1. 安装thinkphp

   ```php
   composer create-project topthink/think [项目名称] 
   ```

   如果不写版本号则默认为最新版本

2. 创建分组（模块目录）

   ```php
   php think build --module 分组名称 
   ```

3. 创建控制器

   ```php
   php think make:controller 模块名/控制器名   
   ```

   其中控制器名称首字母必须大写

4. 创建模型

   ```php
   php think make:model 【模块名】/模型名 模型名为表名相当 
   ```

   模型名首字母大写

5. 创建验证器

   ```php
   php think make:validate 模块/验证器名称 
   ```

6. 创建中间件

   ```php
   php think make:middleware 中间件的名称
   ```

## PHPStorm关联xedebug

1.首先安装`xedebug` ,将`xdebug.dll`文件让在`php/etc`文件夹中，同时修改`php.ini`文件，在PHPEnv集成环境中已经自带xdebug,只需要将phpdtorm 与其关联即可。

2.首先点击phpstorm右上角的小三角图标

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127191938.jpg)

点击Edit Configurations,出现下图

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127192015.jpg)

点击左上角的+号，之后点击PHP Web Page

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127192109.jpg)

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127192233.png)

点击Server旁边的..，进入配置项

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127192319.png)

在此界面设置服务器的名称和主机地址，设置完成后点击apply和ok,之后进入如下界面：

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127192343.png)

在这里我们可以设置显示的名称和开始的url地址，如之前设置的主机为localhost,此处则要设置项目所在地址 ，如果项目文件为`htdocs/tp`，则url需要设置为`tp/public/index.php`。

## TP5中的模块，路由与请求参数

使用以下命令创建模块

```php
php think build --module sample
```

也可以设置自动创建命名空间

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127202006.png)

**TP5的URL路径格式**
PATH_INFO模式
http://ServerName/index.php/module/controller/action/[param/value...]
http://localhost/zerg/public/index.php/index/index/index

URl不区分大小写（可配置，应用目录下的config.php）

1. 兼容模式
   http://ServerName/index.php?s=module/controller/action/p/v...
2. 缺点
3. 太长
4. 不够灵活
5. URL路径暴露除了服务器文件结构
6. 不能很好的支持URL语义化（最大的缺陷）	

### URL访问模式

 PATH_INFO，混合模式（默认，不同方法使用不同的访问模式，config文件配置） ，强制使用路由模式

我们可以在`config.php`文件中进行设置

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127212156.png)

**路由模式**： 动态配置路由（其他访问模式会失效，在 `route.php`配置 

如我们在`sample/test.php`文件中编写一下代码

``` php
public function hello()
{
	return 'hello';
}
```

我们可以通过正常路由模式进行访问

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127202729.png)

当在应用目录下的`route.php`文件中进行以下配置，则无法通过正常路由模式进行访问、

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127202840.png)

**动态注册路由**

``` php
Route::rule('路由表达式','路由地址','请求类型','路由参数（数组）','变量规则（数组）')
```

请求类型: PUT , GET, POST, DELETE以及*

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127203248.png)

### 请求参数的获取

TP5中获取请求的参数有以下几种方法

1. 在方法中定义相关变量名进行获取

   ``` php
   // route.php
   Route::post('hello/:id','sample/Test/hello');
   // Test.php
   public function hello($id,$name,$age)
       {
           echo $id;
           echo ':';
           echo $name;
           echo ':';
           echo $age;
       }
   ```

   ![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127204048.png)

2. 当继承了基类控制器
   ![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/Gridea/20191127224605.png)

   继承了系统的基类控制器的话，系统已经自动完成了请求对象的构造方法注入了，可以直接使用`$this->request`调用当前的请求对象。

3. 操作方法注入

   ```php
   use think\Request;
   // 无论是否继承了系统的基类控制器，都可以使用操作方法注入
   class Test extends Controller
   {
       public function hello(Request $request)
       {
           return $request->param('id');
       }
   }
   ```

4. 通过门面静态调用（低版本TP无法使用此方法）

   ```php
   use think/facade/Request;
   class Test extends Controller
   {
       public function hello()
       {
           return Request::param('id');
       }
   }
   ```

5. 助手函数`input()`或者`request()->param()`调用

**隐藏入口文件：** 在应用入口文件同级目录`.htaccess`文件 进行如下修改即可

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127211138.png)

## 业务需求

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191127211403.png)