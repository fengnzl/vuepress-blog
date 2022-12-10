# 微信小程序商城构建全栈应用（三）

此文主要描述了AOP切面编程的思想，全局异常处理流程以及日志记录的方法。

<!-- more -->

**所谓AOP即在程序运行时，动态地将代码切入到类的指定方法、指定位置上的编程思想（面向切面的编程）。** 下面的全局异常处理异常层就是运用了AOP思想，把代码抽象了起来，使得开发出更简洁、精炼的代码更容易，举个例子，看电影时需要票，但是检票人并不在意你是在线上购买的还是线下购买的，都会一一检查观影人是否能进入电影院。

**异常处理流程：**

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128151235.png)

存在问题：逐级进行抛异常处理之类的；有些异常没有捕获。
因此需要有一个全局异常处理来管理这些异常并作出统一的处理，必须要做两件事：1.需要记录日志；2.统一错误状态码和错误信息

## 固有的异常处理思维

首先我们抛出一个错误

```php
// model/Banner.php
namespace app\api\model;
use think\Exception;
use think\Model;
class Banner extends Model
{
    public static function getBannerById($id){
        try{
            1/0;
        }catch(Exception $ex){
            // TODO 可以记录日志
            throw $ex;
        }
        // TODO: use ID to get banner information
        return 'this is a banner information';
    }
}
// api/v1/Banner.php
/**
     * 根据id获取指定的banner信息
     * @url banner/:id
     * @http GET
     * @id banner的id号
     */
    public function getBanner($id){
        (new IDMustBePositiveInt())->goCheck();
        $banner = BannerModel::getBannerById($id);
        return json($banner);
    }
```

然后在`postman`中请求接口，在打开应用调试模式下，报如下错误：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128151825.png)

当关闭应用调试模式时，请求出现以下页面

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128152003.png)

开发网页的时候返回`html`页面来显示错误信息没有问题，但如果是开发`api`是不行的。

在控制器中继续捕获异常：

``` php
(new IDMustBePositiveInt())->goCheck();
try{
	$banner = BannerModel::getBannerById($id);
}catch(Exception $ex){
	$err = [
		'error_code' => 10001,
		'msg' => $ex -> getMessage(),
	];
	return json($err);
}

return json($banner);
```

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128152547.png)

这里200表示请求拿到了想要的结果，但实际上是个异常，不应该为200，因此我们返回的是应该加上code码。

``` php
return json($err, 400);
```

这样就可以了，以上是比较习惯的思维方式。请求 的状态码相应的会变成` 400Bad Request `

**记住一点：**代码越抽象，复用性越高；封装性越好，适应代码变化的能力就越强。

## 自定义全局异常处理

**异常主要分以下两类：**

1.  由于用户行为导致的异常（没有通过校验器，没查询到结果），这种异常通常不需要进行日志的记录，但需要向用户返回具体的信息。
2.  服务器自身的异常（代码错误， 调用外部接口错误），这种异常需要我们记录日志，并通常不向用户返回具体的错误信息。

### 编写异常公共类

首先我们要进行异常封装，只记录服务器错误，而用户引起的参数错误我们不仅从记录，否则错误日志过于庞大，且无用。

**第一步：**建立异常处理文件夹exception,建议文件与模块目录同级，这样异常处理文件可以用于其它模块或项目，且建议放入lib目录下，便于移植到其他目录。

建立异常处理基类`BaseException`并继承Exception,并处理抛出的异常错误。

``` php
namespace app\lib\exception;
use think\Exception;
class BaseException extends Exception
{
    // HTTP状态码
    public $code = 400;

    // 错误信息
    public $msg = '参数错误';

    // 自定义错误码
    public $errorCode = 10000;
}
```

针对本项目自定义错误码分以下几种

``` php
999  未知错误
1 开头为通用错误
2 商品类错误
3 主题类错误
4 Banner类错误
5 类目类错误
6 用户类错误
8 订单类错误

10000 通用参数错误
10001 资源未找到
10002 未授权（令牌不合法）
10003 尝试非法操作（自己的令牌操作其他人数据）
10004 授权失败（第三方应用账号登陆失败）
10005 授权失败（服务器缓存异常）


20000 请求商品不存在

30000 请求主题不存在

40000 Banner不存在

50000 类目不存在

60000 用户不存在
60001 用户地址不存在

80000 订单不存在
80001 订单中的商品不存在，可能已被删除
80002 订单还未支付，却尝试发货
80003 订单已支付过
```

**第二步：**需要开发者自定义异常处理类，来接管框架的异常处理，同时需要在应用配置文件`app.php`（tp5.0在`app/config.php`）中配置参数`exception_handle`。

建立自定义异常处理类`ExceptionHandler`，重写`render()`方法对父类进行覆盖，代码如下：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128162536.png)

``` php
namespace app\lib\exception;


use think\Exception;
use think\exception\Handle;

class ExceptionHandler extends Handle
{
    // HTTP状态码
    private $code;
    // 错误信息
    private $msg;
    // 自定义错误码
    private $errorCode;
    // 还需要返回客户端当前的url地址

    public function render(Exception $e){
        if($e instanceof BaseException){// 判断抛出的错误是否是自定义异常
            // 自定义异常，相关参数为BaseException 中的参数
            $this->code = $e->code;
            $this->msg = $e->msg;
            $this->errorCode = $e->errorCode;

        }else{
            if(config('app_debug')){ // //判断是否返回框架自带的错误页面
                return parent::render($e);
            }else{
                $this->code = 500;
                $this->msg = '服务器内部错误，不想告诉你';
                $this->errorCode = 999;
            }
        }

        // 获取当前请求路径的url
        $url = request()->url();

        $result = [
            'msg' => $this->msg,
            'error_code'=>$this->errorCode,
            'request_url'=> $url
        ];

        // 以json的形式返回错误
        return json($result, $this->code);
    }
}
```

配置`exception_handle`:

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128162736.png)

做完上一步就可以说封装好了，当我们需要抛出了非自定义特定的异常时，返回的信息如下所示：

```php
// model/Banner
public static function getBannerById($id){
    try{
    	1/0;
    }catch(Exception $ex){
    	// TODO 可以记录日志
    	throw $ex;
    }
    // TODO: use ID to get banner information
    return 'this is a banner information';
}
// v1/banner
 public function getBanner($id){
        (new IDMustBePositiveInt())->goCheck();
        $banner = BannerModel::getBannerById($id);

//        return json($banner);
    }
```

此时抛出的是系统异常，因此接口请求得到如下信息：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128164627.png)

 如果是客户端（自定义的异常）操作有误导致则按照自定义的异常返回结果：
这个是任何条件服务器都返回null 

```php
class Banner extends Model
{
    public static function getBannerById($id){
       return null;
    }
}
```

 编写抛出异常，即抛出`BannerMissException`这个异常类（这里的`BannerMissException`需要继承`BaseException`公共异常类，同时`BaseException`要继承框架自带的`Exception`类，简明的说，任何自定义异常类都要继承框架自带的异常类才能让自定义的异常处理类来接收自定义异常类，因为自定义异常处理类也有继承框架自带的异常处理类） 

``` php
namespace app\lib\exception;
class BannerMissException extends BaseException
{
    public $code = 404;
    public $msg = '请求的Banner不存在';
    public $errorCode = 40000;
}
```

然后判断抛出自定义异常即可

``` php
// api/v1/Banner
public function getBanner($id){
        (new IDMustBePositiveInt())->goCheck();
        $banner = BannerModel::getBannerById($id);
        // 抛出BannerMissException异常给render()方法，从而进行异常处理
        if(!$banner){
            throw new BannerMissException();
        }
    }
```

## ThinkPHP5中的日志系统

 在开发环境可以通过打印变量和调试来发现错误并纠正，但是如果在生产环境中是不允许随意修改来调试错误，只有等到新版本系统出来才能去改动生产环境的代码，因此生产环境通过日志（最好的方法）来排查错误。 

TP5的日志文件所在目录`runtime/log`

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128171358.png)

因为很多信息如果都作为日志去记录，则会出现很多无意义的记录信息，不仅耗费了很大的硬盘内存资源，同时也影响了错误的排查。TP5默认会记录全部，需要手动关闭，然后有选择的来记录日志。 

**修改日志保存的位置**

针对TP5.1，在`/config/log.php `中进行修改 （建议与TP5一样在入口文件定义LOG_PATH常量）

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128171755.png)

针对TP5，则需要在`config.php`这个文件，找到日志存放的位置，我们顺着找到，可能会出现在`REANTIME`那个目录下面。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128171946.png)

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128172045.png)

而我们只需要在`index.php`入口文件中重新定义`LOG_PATH`这个常量即可

```php
//定义日志文件
define('LOG_PATH', __DIR__ . '/../logs/');
```

## 全局异常处理加入日志

在修改log日志所在目录之后，我们还需关闭日志，使其在需要进行日志记录的时候在开启。

`tp5.1`关闭日志功能，需在`/thinkphp/convention.php`中将日志的`type`改为`test`,通过`ctrl+shift+r`进行全局查找（注意如果直接在`/config/log.php`下修改`type`并不管用，若将`close`设置为`true`的话，则全局关闭日志写入，在进行日志初始化操作也无法进行写入 ）

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128173638.png)

`tp5.0`关闭日志功能，则在`/app/config.php`直接将日志下的`type`改为`test`即可。

此时已经关闭日志功能，若需要开启日志记录功能，则需要进行初始化，在**`ExceptionHandler.php`文件下开启日志功能**， 从而实现出现异常时才进行日志记录。

```php
 /**
  *将错误记录到日志中
  * @param Exception $e 异常抛出的错误
  */
private function recordErrorLog(Exception $e){
    Log::init([
        'type' => 'File',
        'path' =>  LOG_PATH,
        'level' => ['error'], //只记录error以上的错误级别
        'close' => false, // 开启日志写入功能
    ]);
    Log::record($e->getMessage(), 'error');
}
```

注若日志里只想显示错误级别的日志，`tp5.0`直接初始化时候配置level即可，而`tp5.1`还需在`config/log.php`中将level级别改为error。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128184738.png)

在当前类中需要将异常保存到日志的地方进行调用即可

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128180352.png)

然后抛出系统异常，即可在将日志记录。

## 全局异常处理的应用

 在验证参数是否合法时，比如这里的id，调试环境我们可以看到具体的服务器报错信息，但是在生产环境中却报出了服务器内部错误的相关信息，这让客户端无法知道准确的错误点在哪里。如何解决呢？在验证的`goCheck`方法里集成了整个验证层的验证工作，所以我们需要定义一个参数错误的异常类。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128182632.png)

这是因为在基类验证器中我们直接抛出了系统错误而不是自定义的异常

``` php
/**
* 对http传递的参数进行验证
* @return bool true
* @throws Exception 验证的错误信息
*/
public function goCheck(){
    // 获取http传递的参数
    $params = \request()->param();
    // 对参数进行校验
    $result = $this->check($params);

    if(!$result){
        $err = $this->getError();
        throw new Exception($err);
    }else{
        return true;
    }
}
```

因此我们需要编写一个参数异常类`ParameterException`

```php
namespace app\lib\exception;

class ParameterException extends BaseException
{
    public $code = 400;
    public $msg = '参数错误';
    public $errorCode = 10000;

}
```

然后在`goCheck`方法中抛出参数异常即可

``` php
public function goCheck(){
    // 获取http传递的参数
    $params = \request()->param();
    // 对参数进行校验
    $result = $this->check($params);

    if(!$result){
        $e = new ParameterException([
            	'msg' => $this->error,
//              'code' => 400,
 //             'errorCode' => 10000
            ]);
            //$e->msg = $this->error;
        throw $e;
        /*未设置全局异常处理机制的情况下直接抛出错误。
         * $error=$this->getError();
         //抛出错误  此时不能用批量验证
         throw new Exception($error);*/

    }else{
    	return true;
    }
}
```

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128184616.png)

 如果使用外部通过给对象赋值成员变量也未尝不可，但是我们建议有更好的一种写法，我们在初始化对象的成员变量赋值最好的方式是通过构造函数来初始化赋值操作，更加符合面向对象的基本特性。则实例化的时候即可传入参数，相应的构造函数（父类中创建即可）会进行处理。 

```php
class BaseException extends Exception
{
    //http状态码
    public $code=400;
    //错误信息
    public $msg='参数错误';
    //自定义状态码
    public $errorCode=10000;

    /**
     * 如果自定义异常类实例化的时候传递了参数  则获取其参数 否则使用默认参数
     * @param array $params 调用自定义异常类时传递的参数
     */
    public function __construct($params=[])
    {
        if(!is_array($params)){
            return;
        }
        if(array_key_exists('code',$params)){
            $this->code=$params['code'];
        }
        if(array_key_exists('msg',$params)){
            $this->msg=$params['msg'];
        }
        if(array_key_exists('errCode',$params)){
            $this->errorCode=$params['errorCode'];
        }
    }
}

```

在`BaseValidate`文件中进行批量验证

``` php
// 对参数进行校验 batch进行批量验证
$result = $this->batch()->check($params);
```

然后添加验证规则，请求即可

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128190538.png)

当进行错误的请求之后

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191128193851.png)

