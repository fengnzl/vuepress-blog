# 微信小程序商城构建全栈应用（五）

本文主要介绍了身份权限体系Token令牌的相关信息、商品接口及用户收货地址接口的编写。

<!-- more -->

## 身份权限体系

首先对于部分`API`，我们不希望被他人任意调用，因此需要确定用户的身份对其做权限控制。在`API`是通过令牌进行用户的身份验证，这类似于用户账号密码登陆。用户每次调用接口都需要携带令牌，只有正确的令牌方可调用接口。

大致流程如图：

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/Gridea/20191205230623.png)

首先通过`getToken`接口获取令牌，然后再调用接口是携带获取的令牌，**注意令牌可能在技术上是合法的，但可能身份权限不够，也无法正常调用接口。**

主要验证以下三个权限：

1. 验证是否合法
2. 验证是否有效
3. 验证是否具有权限

由于本项目是微信小程序后台接口，因此我们不需要在单独设置用户账号密码，可以延用微信的身份验证体系，否则需要给用户生成一个唯一的用户表示。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/Gridea/20191205231447.png)

其中`session_key`可以解密微信小程序返回的加密信息，用来获取用户的`userid`,其与`openid`的区别是， 同一个用户在不同的小程序，公众号和服务号拥有同一个`userid`，而`openid`却是不同的。`openid`除了用作身份标识，还可以用于支付等功能。由于`openid`没有失效期因此不能传到客户端中，必须存储在服务器中，因此需要我们生成一个时效性令牌，用来验证身份。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/Gridea/20191205232455.png)

### 实现身份权限体系

首先新建`Token`控制器

``` php
class Token
{
    public function getToken($code = ''){}
}
```

然后编写路由，注意这里使用的是post方式，因为对安全性有一定的要求。

``` php
Route::post('api/:version/Token/user','api/:version.Token/getToken');
```

编写相关验证器：

```php
class TokenGet extends BaseValidate
{
    protected $rule = [
        'code' => 'require|isNotEmpty'
    ];

    protected $message = [
        'code' => '没有code无法获取Token'
    ];
}
// BaseValidate.php
protected function isNotEmpty($value , $rule='' ,$data='' ,$field='' ){
    if(empty($value)){
        return false;
    }else{
        return true;
    }
}
```

然后创建User模型，这里因为业务比较复杂，因此建议写在service层里。简单的，粒度较小的我们放在Model层里。service是建立model层之上的，因此没有与数据表对应的限制。这里我们编写`get`方法来获取token。

```php
 // app/api/service/UserToken.php
 public function get($code){}
```

### 获取openid

根据获取`token`的流程图可知，我们将小程序向微信服务器请求获得的`code`之后调用服务器接口来获取`openid`

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/Gridea/20191206001919.png)

首先在extra文件夹中编写微信相关的配置文件,这里在appid, secret和js_code三个地方用了占位符。当使用login_url时动态填入数据。

```php
// extra/wx.php
return [
    'app_id' => '',
    'app+secret' => '',
    'login_url'=>'https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code'
];
```

然后编写UserToken这个类

```php
class UserToken
{
    protected $code;
    protected $wxAppID;
    protected $wxAppSecret;
    protected $wxLoginUrl;

    public function __construct($code){
        $this->code = $code;
        $this->wxAppID = config('wx.app_id');
        $this->wxAppSecret = config('wx.app_secret');
        $this->wxLoginUrl = sprintf(config('wx.login_url'), $this->wxAppID,$this->wxAppSecret,$this->code);
    }
}
```

 我们需要使用php去curl发起http请求，很多地方都会用到，所以我们在公共文件`app/api/common.php`文件中编写一个公共函数，供全局使用。这里抛出的Exception我们用TP5内置的，因为该错误不需要返回给客户端，只供服务端使用。大部分都是经验性的编码，参考即可。

``` php
/**
 * @param string $url get请求地址
 * @param int $httpCode 返回状态码
 * @return mixed
 */
function curl_get($url,&$http_code=0){
    //初始化curl
    $ch = curl_init();
    //设置请求的url
    curl_setopt($ch,CURLOPT_URL,$url);
    //设置获得的结果以字符串返回而不是输出
    curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
    //不做证书校验,部署在linux环境下请改为true
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    //设置连接的等待的超时时间
    curl_setopt($ch,CURLOPT_CONNECTTIMEOUT，10);
    //设置数据传输的超时时间
//    curl_setopt($ch,CURLOPT_TIMEOUT,500);
    //发起请求
    $file_contents = curl_exec($ch);
    //获取连接资源的最后一个http代码
    $http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    //关闭请求
    curl_close($ch);
    //返回获取的资源数据
    return $file_contents;
}
```

继续在UserToken 这个类中编写get方法

``` php
 public function get($code){
        $result = curl_get($this->wxLoginUrl);
        $wxResult = json_decode($result, true);

        if(empty($wxResult)){
            throw new Exception('获取openid及session_key异常，微信内部错误');
        }else{
            $loginFail = array_key_exists('errcode', $wxResult);
            if($loginFail){

            }else{

            }
        }
    }
```

因为微信对返回的错误码都有对应的相关错误信息，因此这里需要我们编写异常处理方法`proccessLoginError  `，并选择将错误信息返回给客户端，因此还需要编写异常处理器`WeChatException`，这里多写了一个方法是为了提高扩展性。

```php
// app/api/service/UserToken.php
private function processLoginError($wxResult){
        throw new WeChatException([
            'msg' => $wxResult['errmsg'],
            'errCode' => $wxResult['errcode']
        ]);
    }
// app/lib/exception/WeChatException.php
namespace app\lib\exception;
class WeChatException extends BaseException
{
    public $code =404;
    public $msg="微信服务器接口调用失败";
    public $errorCode = 999;
}
```

然后完善UserToken的get接口

``` php
// app/api/service/UserToken.php
public function get(){
    $result = curl_get($this->wxLoginUrl);
    $wxResult = json_decode($result, true);

    if(empty($wxResult)){
        throw new Exception('获取openid及session_key异常，微信内部错误');
    }else{
        $loginFail = array_key_exists('errcode', $wxResult);
        if($loginFail){
            $this->processLoginError($wxResult);
        }else{
            // 暂时return 查看结果
            return $wxResult;
            // 调用授权接口
            $this->grantToken($wxResult);
        }
    }
}

/**
 * 颁发令牌接口
 */
private function grantToken($wxResult){
    // 拿到openid->查询数据库，不存在则新增记录->生成令牌，准备缓存数据，写入缓存->令牌返回至客户端
    $openid = $wxResult['openid'];
}

// v1/Token.php
class Token
{
    public function getToken($code = ''){
        (new TokenGet())->goCheck();
        $ut = new UserToken($code);
        $token = $ut->get();
        return json($token);
    }
}
```

这里先暂时模拟微信获取登陆凭证`code`

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191206151653.png)

通过获取的`code`调用接口（code只能使用一次），注意这里使用的是`post raw`原生方式，且参数使用使用`JSON`格式传递，这里我们成功获取了`openid`和`session_key`。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191206160409.png)

**注意：`RESTFUL`接口使用的都是原生方式传参。**

### 用户保存及生成令牌

获取用户的`openid`之后，我们要去查询数据库，如果是新用户则保存至数据库，同时生成令牌，将其存入缓存，之后可以根据令牌从缓存中获取用户信息，而不是查询数据库。

```php
// app/api/service/UserToken.php
class UserToken
{
    protected $code;
    protected $wxAppID;
    protected $wxAppSecret;
    protected $wxLoginUrl;

    public function __construct($code){
        $this->code = $code;
        $this->wxAppID = config('wx.app_id');
        $this->wxAppSecret = config('wx.app_secret');
        $this->wxLoginUrl = sprintf(config('wx.login_url'), $this->wxAppID,$this->wxAppSecret,$this->code);
    }

    public function get(){
        $result = curl_get($this->wxLoginUrl);
        $wxResult = json_decode($result, true);

        if(empty($wxResult)){
            throw new Exception('获取openid及session_key异常，微信内部错误');
        }else{
            $loginFail = array_key_exists('errcode', $wxResult);
            if($loginFail){
                $this->processLoginError($wxResult);
            }else{
                // 调用授权接口
                return $this->grantToken($wxResult);
            }
        }
    }

    /**
     * 颁发令牌接口
     */
    private function grantToken($wxResult){
        // 拿到openid->查询数据库，不存在则新增记录->生成令牌，准备缓存数据，写入缓存->令牌返回至客户端
        $openid = $wxResult['openid'];
        // 第二步查询数据库
        $user = UserModel::getByOpenID($openid);
        if($user){
            $uid = $user->id;
        }else{
            $uid = $this->newUser($openid);
        }
        // 第三步 存缓存 key: 令牌  value: wxResult,uid(代表用户唯一身份),scope(决定用户身份)

    }

    /**
     * 准备存入缓存的数据
     * 这里scope代表权限  是一串整型数字，数字越大，权限越大
     */
    private function prepareCachedValue($wxResult, $uid){
        $cachedValue = $wxResult;
        $cachedValue['uid'] = $uid;
        $cachedValue['scope'] = 16;
    }
    /**
     * 将新用户保存到数据库
     */
    private function newUser($openid){
        $user = UserModel::create([
            'openid'=>$openid
        ]);
        return $user->id;
    }

    private function processLoginError($wxResult){
        throw new WeChatException([
            'msg' => $wxResult['errmsg'],
            'errorCode' => $wxResult['errcode'],
        ]);

    }
}


// model/User.php
class User extends BaseModel
{
    public static function getByOpenID($openid){
        $user = self::where('openid','=', $openid)
            ->find();
        return $user;
    }
}
```

注意这里`generateToken`方法是和`Token`相关的方法， 因此不适合放在`common.php`中，我们将其放置`UserToken.php`的基类`Token.php`中，还有一个原因是后面还要编写小程序的`APPToken`，因此将两个Token文件中的公共函数放置在其公共基类中，以此提高内聚性。

```php
// app/api/service/Token.php
class Token
{
    public static function generateToken(){
        // 选取32个字符组成一组随机字符串
        $randomChars = getRandomChars(32);
        // 为了安全性， 用三组字符串 进行md5加密
        $timestamp = $_SERVER['REQUEST_TIME_FLOAT'];
        // salt 盐 特殊的加密信息
        $salt = config('secure.token_salt');
        return md5($randomChars.$timestamp.$salt);
    }
}
```

其中`getRandomChars`为公共函数，令牌中的加密盐信息保存在`secure.php`配置文件中

```php
// common.php
/**
 * 获得随机字符串
 * @param $length
 * @return null|string
 */
function getRandomChars($length){
    $str = null;
    $strPol = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
    $max = strlen($strPol)-1;
    for($i=0;$i<$length;$i++){
        $str .= $strPol[rand(0,$max)];
    }

    return $str;
}

// extra/scure.php
return [
    // 随机字符串
    'token_salt' => 'afHienogfrsfdFWEn'
];
```

并在平常的配置文件`setting.php`文件中配置令牌的过期时间

``` php
'token_expire_in' => 7200
```

将生成的令牌信息存入缓存，并将令牌返回给前端

``` php
/**
* 颁发令牌接口
*/
private function grantToken($wxResult){
    // 拿到openid->查询数据库，不存在则新增记录->生成令牌，准备缓存数据，写入缓存->令牌返回至客户端
    $openid = $wxResult['openid'];
    // 第二步查询数据库
    $user = UserModel::getByOpenID($openid);
    if($user){
    	$uid = $user->id;
    }else{
    	$uid = $this->newUser($openid);
    }
    // 第三步 存缓存 key: 令牌  value: wxResult,uid(代表用户唯一身份),scope(决定用户身份)
    $cachedValue = $this->prepareCachedValue($wxResult, $uid);

    $token = $this->saveToCache($cachedValue);
    return $token;
}

private function saveToCache($cachedValue){
    // 随机生成字符串
    $key = self::generateToken();
    // 将数组转为字符串
    $value = json_encode($cachedValue);
    //过期时间
    $expire_in = config('setting.token_expire_in');
    //TP5封装的缓存函数 默认的是文件缓存
    $request = cache($key, $value, $expire_in);
    if(!$request){
    	throw new TokenException([
    		'msg' => '服务器缓存异常',
    		'errorCode' => 10005,
    	]);
    }
    return $key;
}

// 通用令牌异常类
namespace app\lib\exception;
class TokenException extends BaseException
{
    public $code = 401;
    public $msg = 'Token已过期或无效Token';
    public $errorCode = 10001;
}
```

这里由于返回前端的数据都要求是`JSON`格式的数据，因此这里在接口处我们返回一个关联数组，框架会默认将其序列化为`JSON`格式。

```php
// v1/Token.php
class Token
{
    public function getToken($code = ''){
        (new TokenGet())->goCheck();
        $ut = new UserToken($code);
        $token = $ut->get();
        return json([
            'token' => $token
        ]);
    }
}
```

### 小程序测试

这里我们编写了小程序测试页面，然后点击申请令牌，就可以看到令牌存储到了缓存中。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/Gridea/20191208222423.png)

在php项目中我们可以看到缓存已经写入到了文件中

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191209093535.png)

## 商品接口初步编写

前面实现了`Token`的实现，后面进行实现，这里先编写详情接口，首先编写路由。

``` php
Route::get('api/:version/product/:id', 'api/:version.Product/getOne');
```

我们在`product`模型中编写商品查询方法，首先商品查询分为商品的基础信息，商品详情和产品参数。编写该方法时应注意考虑模型关联。通过业务分析我们可以知道商品基础信息的图片是存在`image`表中。而商品详情有很多关于商品的图片，这些图片是存储在`product_img`表中，他们之间是一对多的关系。`product_img`表中并没有直接存储图片的地址，而是存储了`img_id`，从而间接的获取图片。同理`product`商品表和`product_property产品参数表也是一对多的关系。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191209100500.png)

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191209100524.png)

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191209100543.png)

创建`ProductImage`模型和`ProductProperty`模型，`ProductImage`和`Image`模型是一对一的关系，所以我们需要在`ProductImage`模型中编写与`Image`模型的关联

```php
// ProductImage.php
class ProductImage extends BaseModel
{
    protected $hidden = ['delete_time','img_id','product_id'];
    public function imgUrl(){
        return $this->belongsTo('Image','img_id','id');
    }
}

// ProductProperty.php
class ProductProperty extends BaseModel
{
    protected $hidden = ['product_id','delete_time','id'];
}
```

然后在`Product`模型中编写关联和详情获取

``` php
public function imgs(){
	return $this->hasMany('ProductImage','product_id','id');
}

public function properties(){
	return $this->hasMany('ProductProperty', 'product_id', 'id');
}

public static function getProductDetail($id){
    $product = self::with(['imgs', 'properties'])->find($id);
    return $product;
}
```

在`Product`控制器中编写相关的接口

```php
// v1/controller/Product.php
public function getOne($id){
    (new IDMustBePositiveInt())->goCheck();
    $product = ProductModel::getProductDetail($id);
    if(!$product){
    	throw new ProductMissException();
    }
    return json($product);
}
```

## 闭包函数构建查询器

上面接口返回的结果如图：

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191209185018.png)

这里并没有返回图片地址，我们只是调用了和`ProductImage`模型的关联，并没有具体关联到`Image`模型，因此需要在`Product`模型中进行嵌套查询。

``` php
 public static function getProductDetail($id){
     $product = self::with(['imgs.imgUrl', 'properties'])->find($id);
     return $product;
 }
```

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191209185410.png)

这里可以看到服务器没有返回正确的顺序，需要在服务端进行排序之后再返回给服务端，这里的排序是对`Product`模型下的关联属性来排序，因此需要闭包函数构建查询器，修改结果如图：

``` php
 public static function getProductDetail($id){
     $product = self::with(['imgs' => function($query){
     $query->with(['imgUrl'])
     	->order('order','asc');
     }])->with(['properties'])
     	->find($id);
     return $product;
 }
```

这是再次访问接口，返回结果的顺序就正常了。

## 路由变量规则与分组

``` php
Route::get('api/:version/product/recent','api/:version.Product/getRecent');
Route::get('api/:version/product/by_category','api/:version.Product/getAllInCategory');
Route::get('api/:version/product/:id', 'api/:version.Product/getOne');
```

通过前几节知识，我们知道以上路由都可以正常访问，但是当我们把第一条路由放置到最后，在重新访问，会出现以下报错：

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191209174631.png)

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191209173038.png)

因为这里匹配到了第二条路由，所以会报`ID`必须是正整数的错误。`TP5`的路由是按顺序匹配的，所以匹配到这里的第二条路由之后就不会再继续匹配后面的路由了。

根据编写的路由可知，这里recent是个常量，而`:id`是个可变的参数，因此我们要对`:id`进行限定，必须是正整数时的时候才能访问此接口，否则需要继续匹配，修改如下：

``` php
Route::get('api/:version/product/:id', 'api/:version.Product/getOne',[],['id'=>'\d+']);
```

其中第三个参数是可选项，第四个参数是对url传递的参数进行规则限定。当按上述修改之后即可正常访问。

同时对于多条控制器下的方法，官方文档建议**路由分组**，匹配效率会比单条单条写要好。

``` php
Route::group('api/:version/product',function (){
    Route::get('/by_category','api/:version.Product/getAllInCategory');
    Route::get('/:id', 'api/:version.Product/getOne',[],['id'=>'\d+']);
    Route::get('/recent','api/:version.Product/getRecent');
});
```

##  用户收货地址接口

用户相关信息接口必须要有权限控制（接口保护），必须是特定的用户才具有访问接口的权限，而不像商品信息等接口没有相关的限制。

**注意：**这里修改用户的相关信息，我们并不是通过前端直接传递`uid`进行修改，而是通过传递`Token`，后端再通过`Token`信息再缓存中获取用户的`uid`，避免用户传递错误的`uid`而修改了他人的信息。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191210100315.png)

地址数据表中的字段如下图所示：

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191210103217.png)

首先新建`Address`控制器，然后定义地址更新方法，

```php
// v1/Address.php
class Address
{
    public function createOrUpdateAddress(){}
}

// validate/AddressNew.php
class AddressNew extends BaseValidate
{
    protected $rule =  [
        'name'=>'require|isNotEmpty',
        'mobile'=>'require|isMobile',
        'province'=>'require|isNotEmpty',
        'city'=>'require|isNotEmpty',
        'country'=>'require|isNotEmpty',
        'detail'=>'require|isNotEmpty',
    ];
}
```

**封装获取UID方法**

我们在`service/Token.php`文件中封装获取`uid`的方法，首先编写`getCurrentTokenVar`通用方法，用于获取存在缓存中的特定信息，这里值是被缓存在文件中，是`json`格式（缓存至`redis`则为数组），为了操作方便，先将其转换为数组的形式

```php
// service/Token.php
public static function getCurrentTokenVar($key){
    // 所有的token都应通过http的header传递，而不是body
    $token = Request::instance()->header('token');
    // 获取缓存中的数据
    $vars = Cache::get($token);
    if(!$vars){// 缓存已过期或者缓存异常
    	throw new TokenException();
    }else{
        if(!is_array($vars)){
        	$vars = json_decode($vars, true);
    	}
        if(array_key_exists($key, $vars)){
       		return $vars[$key];
        }else{
        	throw new Exception('尝试获取的Token变量不存在');
        }
    }
}
/**
* 根据token获取uid
*/
public static function getCurrentUid(){
    $uid = self::getCurrentTokenVar('uid');
    return $uid;
}
```

**模型新增和更新**

继续完善上节控制器代码，并创建相关的模型关联，这里`User`和`UserAddress`模型是一对一的关系，因为我们规定一个用户只能有一个收货地址（若一个用户对应多个收货地址，那么就是一对多的关系），**在含有外键的表或模型中编写模型关联则使用`belongsTo`方法，如果在没有外键的表或模型中编写模型关联则使用`hasOne`方法。**因此这里使用`hasOne`方法，同时我们先写一段伪代码模仿客户端传值。

``` php
// model/User.php
public function address(){
	return $this->hasOne('UserAddress', 'user_id','id');
}

//v1/Address.php
public function createOrUpdateAddress(){
    (new AddressNew())->goCheck();
    // 根据token获取用户uid->
    //根据uid查找用户是否存在，不存在抛出异常 ->
    //用户存在，获取提交的地址信息 ->
    //判断更新还是添加地址
    $uid = TokenService::getCurrentUid();
    $user = UserModel::get($uid);
    if(!$user){
    	throw new UserException();
    }
    $dataArray = getDatas();
    // 获取用户地址
    $userAddress = $user ->address;
    if(!$userAddress){
    // 通过模型关心新增数据
    	$user->address()->save($dataArray);
    }else{
    //更新数据
    	$user->address->save($dataArray);
	}

	return new SuccessMessage();
}
```

未查找到相关用户的异常：

```php
class UserException extends BaseException
{
    public $code = 404;
    public $msg = '用户不存在';
    public $errorCode = 60000;
}
```

更新或者修改成功的消息提示：

``` php
class SuccessMessage extends BaseException
{
    public $code = 201;// 资源修改成功
    public $msg = 'ok';
    public $errorCode = 0;
}
```

关联的`UserAddress.php`模型

``` php
class UserAddress extends BaseModel
{
    protected $hidden = ['id','delete_time','user_id'];
}
```

**参数过滤：**

客户端传递的数据不一定就是安全的，可能传入一些额外的参数，如果直接将获取的参数数据直接保存到数据库，可能会将数据库中的信息进行覆盖。

因此我们需要在获取客户端发送过来的参数根据验证器的规则来进行获取，首先在`BaseValidte`类中新增一个方法`getDataByRule`对传递的参数进行过滤筛选，同时编写验证`isMobile`验证函数。

``` php
protected function isMobile($value , $rule='' ,$data='' ,$field=''){
    $rule = '^1(3|4|5|7|8)[0-9]\d{8}$^';
    $result = preg_match($rule, $value);
    if($result){
        return true;
    }else{
        return false;
    }
}

/**
 * 获取指定参数的变量值
 */
public function getDataByRule($arrays){
    if(array_key_exists('user_id',$arrays) ||
       array_key_exists('user_id', $arrays)){
        // 不允许包含user_id或者uid,防止恶意覆盖user_id外键
        throw new ParameterException([
            'msg' => '参数中包含非法的参数名user_id或者uid'
        ]);
    }
    $newArray = [];
    foreach ($this->rule as $key =>$value){
        $newArray[$key] = $arrays[$key];
    }
    return $newArray;
}
```

再对相应的控制器代码进行修改即可：

``` php
public function createOrUpdateAddress(){
    $validate = new AddressNew();
    $validate->goCheck();
    // 根据token获取用户uid->
    //根据uid查找用户是否存在，不存在抛出异常 ->
    //用户存在，获取提交的地址信息 ->
    //判断更新还是添加地址
    $uid = TokenService::getCurrentUid();
    $user = UserModel::get($uid);
    if(!$user){
    	throw new UserException();
    }
    //对传递的数据进行过滤
    $dataArray = $validate ->getDataByRule(input('post.'));
    // 获取用户地址
    $userAddress = $user ->address;
    if(!$userAddress){
        // 通过模型关心新增数据
        $user->address()->save($dataArray);
    }else{
        //更新数据
        $user->address->save($dataArray);
    }

    return json(new SuccessMessage(),201);
}
```


<!-- more -->
