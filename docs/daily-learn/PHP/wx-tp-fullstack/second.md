# 微信小程序商城构建全栈应用（二）

此文主要描述了如何在项目中构建验证层以及介绍了 RESTFul API。

<!-- more -->

## Banner接口定义及自定义控制器多级目录

banner对应的是页面中的banner位的个数，banner_item对应的是某个banner位的子banner，banner_item的key_word由子banner来的type字段来决定是什么，可能是商品ID或者是专题ID等。banner和banner_item是属于一对多的关系，即一个banner可以有多个banner_item，某个banner_item只能属于一个banner。

```mysql
SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for banner
-- ----------------------------
DROP TABLE IF EXISTS `banner`;
CREATE TABLE `banner` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL COMMENT 'Banner名称，通常作为标识',
  `description` varchar(255) DEFAULT NULL COMMENT 'Banner描述',
  `delete_time` int(11) DEFAULT NULL,
  `update_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COMMENT='banner管理表';

-- ----------------------------
-- Records of banner
-- ----------------------------
INSERT INTO `banner` VALUES ('1', '首页置顶', '首页轮播图', null, null);

-- ----------------------------
-- Table structure for banner_item
-- ----------------------------
DROP TABLE IF EXISTS `banner_item`;
CREATE TABLE `banner_item` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `img_id` int(11) NOT NULL COMMENT '外键，关联image表',
  `key_word` varchar(100) NOT NULL COMMENT '执行关键字，根据不同的type含义不同',
  `type` tinyint(4) NOT NULL DEFAULT '1' COMMENT '跳转类型，可能导向商品，可能导向专题，可能导向其他。0，无导向；1：导向商品;2:导向专题',
  `delete_time` int(11) DEFAULT NULL,
  `banner_id` int(11) NOT NULL COMMENT '外键，关联banner表',
  `update_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COMMENT='banner子项表';

-- ----------------------------
-- Records of banner_item
-- ----------------------------
INSERT INTO `banner_item` VALUES ('1', '65', '6', '1', null, '1', null);
INSERT INTO `banner_item` VALUES ('2', '2', '25', '1', null, '1', null);
INSERT INTO `banner_item` VALUES ('3', '3', '11', '1', null, '1', null);
INSERT INTO `banner_item` VALUES ('5', '1', '10', '1', null, '1', null);
```

首先我们要在`api/controller/v1`文件中新建`banner.php`控制器文件，然后在里面编写接口

以下是比较规范的方法注释

``` php
class Banner extends Controller
{
    /**
     * 获取指定id的banner信息
     * @url /banner/:id
     * @http GET
     * @id banner的id号
     */
    public function getBanner()
    {
        
    }
}
```

这是我们需要在`route.php`文件中进行如下设置，才能正确请求接口

``` php
use think\Route;
Route::get('banner/:id','api/v1.Banner/getBanner');
```

## Validate验证器

**独立验证：**批量验证要使用batch，项目开发较少用  这种方式进行验证。

```php
public function getBanner()
    {
        // 独立验证
        $data = [
            'name'=>'afsdafdsafds',
            'email'=> 'affsdaqq.com'
        ];

        $validate = new Validate([
            'name' => 'require|max:10',
            'email' => 'email'
        ]);
        $result = $validate->batch()->check($data);
        halt($validate->getError());
    }
```

请求之后会提示验证出错

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191127234709.png)

**验证器验证：**他对独立验证进行了很好的封装，也是推荐的一种方式。

在`api/validate`文件夹中新建`TestValidate.php`文件，然后再该验证器中编写验证规则

``` php
namespace app\api\validate;
use think\Validate;
class TestValidate extends Validate
{
    protected $rule = [
        'name' => 'require|max:10',
        'email' => 'email'
    ];
}
```

然后再需要验证这类参数的地方实例化调用即可。

``` php
$validate = new TestValidate();
$result = $validate->batch()->check($data);
```

##  零食商贩架构体系  

有些服务器的api需要token令牌，有些开放的就不用。传统我们所说的登录的功能就api中就是获取token令牌的过程。小程序与微信服务器也要交互来获取用户信息。

通过以下结构图来理清思路，一般中小型项目都满足该架构，如果要使用分布式解决高并发问题，先按以下架构部署后再升级。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191128001920.png)

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191128002009.png)

# 构建接口参数校验层

如果按照之前独立验证的方式进行请求参数的验证，当使用相同的验证机制时，就会出现大量重复的代码，如果需要验证的参数的多了也会变得重复，而且将验证值封装成一个函数，也不是最优解。因此需要使用验证器进行验证。

 随着项目的深入，会定义一系列验证一类的验证器。验证一类的验证可在多个处理业务逻辑上实现复用，也可减少代码冗长。当验证器足够多的时候甚至可以成为一个类库，供其它项目调用。处理某个业务逻辑当然也可以用多个验证器。 

 由于项目中验证器都会使用到`goCheck`方法，需要封装一个公共验证器类，则其它验证器类继承该基类即可，该基类中需要定义一个`goCheck`方法。 用于检测`http`传递的参数是否正确，当然自定义的方法也可以写入。

```php
namespace app\api\validate;


use think\Exception;
use think\Request;
use think\Validate;

class BaseValidate extends Validate
{
    /**
     * 对http传递的参数进行验证
     * @return bool  true
     * @throws Exception 验证的错误信息
     */
    public function goCheck(){
        // 获取Http传递的所有参数，并对参数进行校验
        $params = Request::param();
        // 调用验证器中的check()对参数进行验证
        $result = $this->check($params);
        // 判断验证是否通过
        if($result){
            return true;
        }else{
            // 未设置全局异常处理的情况下直接抛出错误
            $error = $this->getError();
            throw new Exception($error);

        }
    }
}
```

然后在相关的验证器中继承`BaseValidate`,并填写相关验证规则如`IDMustBePositiveInt`验证器用于判断是否为正整数

```php
/**
 * 判断id是否是正整数的验证器
 * @package app\api\validate
 */
class IDMustBePositiveInt extends BaseValidate
{
    /**
     * 定义验证规则
     * 格式：'字段名'    => ['规则1','规则2'...]
     * @var array
     */    
   protected $rule = [
       'id' => 'require|IsPositiveInt',
       ];
    
    /**
     * 定义错误信息
     * 格式：'字段名.规则名'    => '错误信息'
     * @var array
     */    
    protected $message = [
        'id.require' => '必须填写相关id值',
    ];
    /**
     * 自定义验证规则 判断id必须为正整数
     */
    //                           校验字段的值  校验规则  传递的数据   校验的字段
    protected function IsPositiveInt($value , $rule='' ,$data='' ,$field='' ){
        if(is_numeric($value) && intval($value).'' === $value&&($value + 0)>0){
            return true;
        }else{
            return $field.'必须是正整数';
        }
    }
}
```

最后在相关控制器中调用相关验证器并调用`goCheck()`方法进行验证，如果验证不通过则捕获异常，并通过抛出错误或者全局的异常处理机制进行输出或记录到日志中。

``` php
(new IDMustBePositiveInt())->goCheck();
```

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128135157.png)

**注：**此时还不能进行批量验证，当使用全局异常处理时再完善此部分内容。

## REST与RESTFul

### SOAP（REST之前的重要协议）

>  SOAP（Simple Object Access Protocol，即简单对象访问协议）是交换数据的一种协议规范，使用在计算机网络Web服务（web service）中，交换带结构信息。SOAP为了简化网页服务器（Web Server）从XML数据库中提取数据时，节省去格式化页面时间，以及不同应用程序之间按照HTTP通信协议，遵从XML格式执行资料互换，使其抽象于语言实现、平台和硬件。 

其主要具有以下特点:

1. 重
2. 通常来说，使用XML描述数据
3. 前端访问公共服务的时候需要先访问网站后台，由网站后台去使用公共服务提供的代理类来访问公共服务，很长的访问过程，间接操作。

### REST与RESTFul API

**REST**

>  英文：Representational State Transfer，又称具象(表述性)状态传输
>  一种风格，约束，设计理念 基于资源
>  可以参考这篇文章https://www.zhihu.com/question/27785028 
>  REST模式与复杂的SOAP和XML-RPC相比更加简洁 

**RESTFul API**

>  REST 指的是一组架构约束条件和原则。满足这些约束条件和原则的应用程序或设计就是 RESTful。
>  使用 RPC 样式架构构建的基于 SOAP 的 Web 服务成为实现 SOA 最常用的方法。RPC 样式的 Web 服务客户端将一个装满数据的信封（包括方法和参数信息）通过 HTTP 发送到服务器。服务器打开信封并使用传入参数执行指定的方法。方法的结果打包到一个信封并作为响应发回客户端。客户端收到响应并打开信封。每个对象都有自己独特的方法以及仅公开一个 URI 的 RPC 样式 Web 服务，URI 表示单个端点。它忽略 HTTP 的大部分特性且仅支持 POST 方法。 

Restful Api基于REST的API设计理论，就是REST在Web接口中的一种应用和延伸。其主要有以下特点：

1. 轻
2. 通常来说，使用JSON描述数据（基本上web应用方面都是用json）
3. 无状态（假设有两个请求，这两个请求是没有先后顺序之分的，没有直接关系，互相也不依赖），区别于有状态，有状态的就比如说连接数据库，只有先连接成功数据库才可以进行一系列的操作，操作完成后要关掉连接。
4. 基于资源，增删改查都只是对于资源状态的转变*，使用url来表示资源（不要出现动词，使用名词）
5. 使用Http动词来操作资源（get、post、delete、put）

总结：在传统的web开发里面我们选择get和post的依据是如果你的参数足够简单的话，不管你的操作是增、删还

是改都会选择get，如果参数比较复杂的话就会用post方式，在restful不是由以上这些决定的，而是取决你的操作

是查询操作还是新增操作

**例子：**

```http
/getmovie/:mid(不建议，动词操作)
GET：/movie/:mid
```

**RESTFul API 最佳实践**

HTTP动词（幂等性，资源安全性）

1. POST：创建
2. PUT：更新
3. GET：查询
4. DELETE：删除

状态码 ：404 400 200 201 202 401 403（A用户操作B用户的数据如果检测到要返回403） 500（未知的，或者知道错误但是不会返回给客户端查看时返回500）

错误码：自定义的错误ID号

统一描述错误：错误码、错误信息当前URL

使用Token令牌来授权和验证身份

版本控制，测试环境与生产环境分开：[api.xxx.com](http://api.xxx.com/)     [dev.api.xxx.com](http://dev.api.xxx.com/)

URL语义要明确，最好可以“望文知意”

最好是有一份比较标准的文档（中大型企业要有）

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128142045.png)

**学习RESTFul API**

可以模仿豆瓣API或者Github开发者API（标准）

RestFul API的合理使用（切勿盲目照搬标准REST，有些业务复杂的照搬很难操作）