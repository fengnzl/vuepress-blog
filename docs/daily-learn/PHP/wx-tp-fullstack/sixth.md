# 微信小程序商城构建全栈应用（六）

本文主要介绍了scope权限，微信下单与支付的相关流程和接口的编写。

<!-- more -->

## Scope权限作用域

这里假设`Product`控制器有一个删除商品的接口，需要拥有相关权限才可以进行调用，这时我们需要在用户调用接口的时候进行身份验证，对用户进行分组，只有特定分组的用户才可访问该接口。当用户传递`Token`令牌过来后，我们需要对其分组进行判断。我们在`UserToken`这个类编写`prepareCachedValue`方法中时使用了`scope`作用域，这里不同的数字代表了不同的权限身份，16代表`app`用户的权限，32代表管理员（`cms`)的权限。

这里编码直接用硬编码的形式设置用户的权限，可读性和扩展性都很差。

``` php
// app用户的权限数值
$cachedValue['scope'] = 16;
```

因此我们通过模拟枚举的方式来为不同的身份继续赋值。

```php
// lib/enum/ScopeEnum.php
namespace app\lib\enum;

class ScopeEnum
{
    const User = 16;

    const Super = 32;
}

// app用户的权限
$cachedValue['scope'] = ScopeEnum::User;
```

在访问某些接口时需要携带相关令牌，我们需要在用户访问接口之前，先检验用户所在权限数值，如果符合权限，我们就允许其访问接口。`TP5`提供了一个前置的操作方法，在访问某些接口前会执行该前置方法，在这个前置方法中验证用户令牌所在权限，符合身份验证，则允许访问，否则抛出异常。

**注意：**`TP5`前置方法不支持驼峰命名，因此需要我们在`think/Controller.php`文件中将`beforeAction`方法中的以下字段进行修改

``` php
$this->request->action()改成$this->request->action(true)
```

权限检测：

```php
// v1/Address.php
//前置方法
protected $beforeActionList = [
	'checkPrimaryScope'=>['only' => 'createOrUpdateAddress'],
];

/**
* 检测初级权限
*/
protected function checkPrimaryScope(){
    $scope = TokenService::getCurrentTokenVar('scope');
    if($scope>=ScopeEnum::User){
   		return true;
    }else{
    	throw new ForbiddenException();
    }
}
```

权限不够的情况下抛出异常

``` php
class ForbiddenException extends BaseException
{
    public $code = 403;
    public $msg = '权限不够';
    public $errorCode = 10001;
}
```

这里我们手动将缓存中的权限改为15，进行接口测试可以得到抛出的错误信息：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191211144159.png)

## 下单与支付的业务流程

用户在下单到支付过程主要有以下几个步骤：

1. 用户选择商品之后，向`API`提交包含它所选择商品的相关信息。
2. `API`接收信息之后，需要检测订单相关商品的库存量。
3. 有库存，把订单存入数据库中=下单成功，返回客户端消息，告诉客户端可以支付
4. 调用支付接口，进行支付
5. 还需要再次进行库存量检测（允许一段时间内进行支付）
6. 服务器调用微信的支付接口进行支付
7. 微信返回支付结果（异步）
8. 成功：库存量检测，进行库存量扣除， 失败：返回一个支付失败的结果

流程分析图如下所示：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191211151111.png)

## 重构权限控制前置方法

这里我们编写订单控制器，首先编写下单方法，这时我们需要一个权限控制的前置方法来判断管理员不能帮用户支付：

```php
// v1/Order.php
protected function checkExclusionScope(){
    $scope = TokenService::getCurrentTokenVar('scope');
    if($scope==ScopeEnum::User){
    	return true;
    }else{
    	throw new ForbiddenException();
    }
}
public function placeOrder(){}
```

由于这里的前置方法和权限控制方法可能许多地方都要使用，因此我们将其放入到`BaseController.php`控制器中，并分别编写对应`order`和`address`方法的权限控制调用方法，并在`token`类中编写具体的权限控制方法，然后在控制器中分别调用具体方法。

```php
// api/service/Token.php
 /**
 * 用户和cms管理员均可访问的权限
 */
 public static function needPrimaryScope(){
     $scope = self::getCurrentTokenVar('scope');
     if($scope>=ScopeEnum::User){
     	return true;
     }else{
     	throw new ForbiddenException();
     }
 }

/**
* 只有用户可访问的权限
*/
public static function needExclusionScope(){
    $scope = self::getCurrentTokenVar('scope');
    if($scope==ScopeEnum::User){
    	return true;
    }else{
    	throw new ForbiddenException();
    }
}
```

然后在`BaseController`中获取权限控制方法

```php
// v1/BaseController.php
use think\Controller;
use app\api\service\Token as TokenService;
class BaseController extends Controller
{
    protected function checkPrimaryScope(){
        TokenService::needPrimaryScope();
    }

    protected function checkExclusionScope(){
        TokenService::needExclusionScope();
    }
}
```

最后在具体的控制器中编写前置方法：

```php
// v1/Order.php
class Order extends BaseController
{
    // 前置方法
    protected $beforeActionList = [
        'checkExclusionScope' => ['only'=> 'placeOrder']
    ];

    public function placeOrder(){}
}
```

编写下单接口的参数校验，这里下单可能是一组商品，每个商品参数又包含商品`id`和商品数量，因此客户端向服务器提交的参数应该是一个类似以下的二维数组。

```php
protected $products = [
            [
                'product_id'=>1,
                'count' => 3
            ],
            [
                'product_id'=>2,
                'count' => 5
            ],
        ];
```

封装一个订单接口的验证器：

```php
// validate/OrderPlace.php
namespace app\validate;
use app\lib\exception\ParameterException;

class OrderPlace extends BaseValidate
{
    protected $rule = [
        'products' => 'checkProducts'
    ];

    protected function checkProducts($values){
        if(empty($values)){
            throw new ParameterException([
                'msg' => '商品列表不能为空'
            ]);
        }

        if(!is_array($values)){
            throw new ParameterException([
                'msg' => '商品参数不正确'
            ]);
        }

        foreach ($values as $value){
            $this->checkProduct($value);
        }

        return true;
    }

    protected $singleRule = [
        'product_id' => 'require|isPositiveInt',
        'count' => 'require|isPositiveInt'
    ];

    protected function checkProduct($value){
        $validate = new BaseValidate($this->singleRule);
        $result = $validate->check($value);

        if(!$result){
            throw new ParameterException([
                'msg' => '商品参数错误'
            ]);
        }
    }
}
```

然后在订单接口进行调用即可：

``` php
// v1/Order.php中placeOrder方法
(new OrderPlace())->goCheck();
```

## 下单接口业务模型

首先我们在下单控制其中接收相关参数：

``` php
public function placeOrder(){
    (new OrderPlace())->goCheck();
    // 这里a修饰符是将传入的变量转换为数组类型，默认为字符串类型
    $products = input('post.products/a');
    $uid = TokenService::getCurrentUid();
}
```

由于这里业务逻辑比较复杂，所以我们将相关业务写在`service/Order.php`类中

``` php
class Order
{
    // 订单的商品列表，也就是客户端传递的products参数
    protected $oProducts;

    //真实的商品信息（包括库存量）
    protected $products;

    protected $uid;

    /**
     * 下单函数
     */
    public function place($uid, $oProducts){
        // oProducts和products进行对比
        // products 从数据库中查询
        $this->oProducts = $oProducts;
        $this->products = $this->getProductsByOrder($oProducts);
        $this->uid = $uid;
    }

    /**
     * 根据订单信息查找真实的商品信息
     */
    private function getProductsByOrder($oProducts){
//        foreach ($oProducts as $oProduct){
//            循环查询数据库，对数据库的压力很大，商品列表是不可控的，因此少用或者不用
//        }
        $oPIDs = [];
        foreach ($oProducts as $item){
            // 这里先把订单中的product_id先取出来放置在数组中
            array_push($oPIDs,$item['product_id']);
        }

        $products = Product::all($oPIDs)
            ->visible(['id','price','stock','name','main_img_url'])
            ->toArray();
        return $products;
    }
}
```

当获取了数据库中的商品信息，我们要进行库存量检测，如果任意一种商品库存量不足，我们认为检测不通过。

这里我们首先编写获取订单状态函数：

``` php
// `service/Order.php` 
/**
 * 获取订单状态，获取到详细的订单信息方便检验商品库存量
 */
 private function getOrderStatus(){
     $status = [
         'pass'=>true,
         'orderPrice'=> 0, // 订单总价格
         'pStatusArray'=>[] // 订单所有的商品信息状态，方便历史菜单查询
     ];

    foreach ($this->oProducts as $oProduct){
    }
}
```

然后获取商品的状态信息：

``` php
// `service/Order.php`
private function getOrderStatus(){
        $status = [
            'pass'=>true,
            'totalCount' => 0,
            'orderPrice'=> 0, // 订单总价格
            'pStatusArray'=>[] // 订单所有的商品信息状态，方便历史菜单查询
        ];

        foreach ($this->oProducts as $oProduct){
            $pStatus = $this->getProductStatus($oProduct['product_id'], $oProduct['count'], $this->products);
            if(!$pStatus['haveStock']){
                $status['pass'] = false;
            }
            $status['orderPrice'] += $pStatus['totalPrice'];
            $status['totalCount'] += $pStatus['count'];
            array_push($status['pStatusArray'], $pStatus);
        }
        return $status;
    }
```

这里我们编写了获取单个商品的相关信息：

``` php
// `service/Order.php`
// 获取商品的状态信息
    private function getProductStatus($oPID, $oCount, $products){
        $pIndex = -1;
        $pStatus = [
            'id' => null, // 商品id
            'haveStock' => false, // 是否有库存
            'count' => 0, // 数量
            'name' => '', // 名称
            'totalPrice' => 0 // 当前商品订单总价格
        ];

        for($i=0;$i<count($products);$i++){
            if($oPID == $products[$i]['id']){
                $pIndex = $i;
            }
        }
        if($pIndex == -1){
            throw new OrderException([
                'msg'=> 'id为'.$oPID.'的商品不存在，创建订单失败'
            ]);
        }
        else{
            $product = $products[$pIndex];
            $pStatus['id'] = $product['id'];
            $pStatus['name'] = $product['name'];
            $pStatus['count'] = $oCount;
            $pStatus['totalPrice'] = $product['price']*$oCount;

            if($product['stock'] - $oCount >=0){
                $pStatus['haveStock'] = true;
            }
        }
        return $pStatus;
    }
```

订单异常处理：

```php
class OrderException extends BaseException
{
    public $code = 404;
    public $msg = '订单不存在，请检查ID';
    public $errorCode = 80000;
}
```

## 订单创建

最后在下单接口获取库存量检测的状态信息并进行判断即可,同时这里为了返回接口的一致性，库存量检测不通过也需要返回一个订单号，`order_id=-1`，表示订单创建失败。

``` php
 /**
 * 下单函数
 */
 public function place($uid, $oProducts){
     // oProducts和products进行对比
     // products 从数据库中查询
     $this->oProducts = $oProducts;
     $this->products = $this->getProductsByOrder($oProducts);
     $this->uid = $uid;

    $status = $this->getOrderStatus();
    // 如果检测不通过
    if(!$status['pass']){
    	$status['order_id'] = -1;
    }
     // 开始创建订单
     $orderSnap = $this->snapOrder($status);
}
```

对于复杂的业务，我们应学会将主干的业务模型抽离出来。模型不仅仅是用来编写代码，更是我们拆分业务，构建思路的重要方式。

经过分析我们可知，order 表和 order_product 表是一种多对多的关系，当用户查询订单详情时，我们应避免动态查询。因为商品的信息是动态了，可能一段时间之后进行了修改，如果使用动态查询，用户看到的订单详情将会改变。

因此我们需要对订单信息（所有商品和商品图片以及地址）做快照，这样避免了动态查询，并减轻了数据库的压力。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191216202441.png)

这里 order_product是为了扩展而使用的，如果需要动态查询则可以使用此表。

创建订单快照，注意这里地址使用了 JSON 形式进行存储，但这是因为考虑到没有做历史订单的功能，因此没有将其分离出去，最好的做法是使用 MongoDB 这样的 no-sql 数据库进行存储，或者在新建一个地址表。

```php
// 生成订单快照
    private function snapOrder($status){
        $snap = [
            'orderPrice' => 0,
            'totalCount' => 0,
            'pStatus' => [],
            'snapAddress' => null,
            'snapImg' => '', 
            'snapName'=>'' // 订单快照名称
        ];
        $snap['orderPrice'] = $status['orderPrice'];
        $snap['totalCount'] = $status['totalCount'];
        $snap['pStatus'] = $status['pStatusArray'];
        $snap['snapAddress'] = json_encode($this->getUserAddress());
        $snap['snapName'] = $this->products[0]['name'];
        $snap['snapImg'] = $this->products[0]['main_img_url'];

        if(count($this->products)>1){
            $snap['snapName'] .= '等';
        }
        return $snap;
    }

    private function getUserAddress(){
        $userAddress = UserAddress::where('user_id','=',$this->uid)
            ->find();

        if(!$userAddress){
            throw new UserException([
                'msg'=>'用户收货地址不存在，下单失败',
                'errorCode' => 60001
            ]);
        }
        return $userAddress;
    }
```

注意 order_product 表的 count 是指该订单某个商品的数量，而 order 表的 total_count 是指所有该订单所有商品的数量之和。

在编写大段操作数据的代码时，做好有捕获异常的处理。

``` php
// service/Order.php
// 生成订单
private function createOrder($snap){
    try{
        $orderNo = self::makeOrderNo();
        $order = new \app\api\model\Order();
        $order->user_id = $this->uid;
        $order->order_no = $orderNo;
        $order->total_price = $snap['orderPrice'];
        $order->total_count = $snap['totalCount'];
        $order->snap_img = $snap['snapImg'];
        $order->snap_name = $snap['snapName'];
        $order->snap_address = $snap['snapAddress'];
        $order->snap_items = json_encode($snap['pStatus']);

        $order->save();
        // 订单主键
        $orderID = $order->id;
        $create_time = $order->create_time;

        foreach ($this->oProducts as &$p)
        {
            $p['order_id'] = $orderID;
        }

        $orderProduct = new OrderProduct();
        $orderProduct->saveAll($this->oProducts);

        return [
            'order_no' => $orderNo,
            'order_id' => $orderID,
            'create_time' => $create_time
        ];
    }catch (Exception $ex){
        throw $ex;
    }
}
```

生成唯一订单号的方法：

``` php
// 生成唯一订单号  这里使用public static 是方便外部调用
public static function makeOrderNo(){
    $yCode = ['A','B','C','D','E','F','G','H','I','J'];
    // dechex 十进制转换为16进制
    $orderSn = $yCode[intval(date('Y'))-2017].strtoupper(dechex(date('m')))
    	.date('d').substr(time(),-5).substr(microtime(),2,5)
    	.sprintf('%02d',rand(0,99));
    return $orderSn;
}
```

创建 Order 和 OrderProduct 模型：

``` php
class OrderProduct extends BaseModel{}
class Order extends BaseModel
{
	 protected $hidden = ['user_id','delete_time','update_time'];
}
```

针对 TP5 一对多模型进行保存数据时，建议先保存一后保存多。在这里 order 表和 order_product 表是多对多的表，但是这里 product 表是不变的，因此实际上是按照一对多的方法进行保存的。

完善下单方法：

```php
// service/Order.php
public fucntion(){
	// ...
	// 开始创建订单
    $orderSnap = $this->snapOrder($status);
    $order = $this->createOrder($orderSnap);
    $order['pass'] = true;
    return $order;
}

// v1/Order.php
public function placeOrder(){
    (new OrderPlace())->goCheck();
    // 这里a修饰符是将传入的变量转换为数组类型，默认为字符串类型
    $products = input('post.products/a');
    $uid = TokenService::getCurrentUid();

    $order = new OrderService();
    $status = $order->place($uid, $products);
    return json($status);
}
```

建议将复杂的业务代码分离成很多的方法，每个方法有固定的业务逻辑，尽量保证主方法代码的简介。看源码也是如此，先将整体流程走通，再对感兴趣的代码进行详看。

## 数据库使用技巧

**自动写入时间戳**

每次创建订单或者修改相关信息，每次都手动写入事件戳是很麻烦的，因此我们需要使用 TP5 框架使用**模型**自动写入时间戳，但只能是 create_time、update_time、和 delete_time 三个字段。在 TP5 中实现的是软删除，所以只有当使用模型删除的时候， delete_time 才会进行赋值。如果使用的不是默认字段，则可以在当前模型下修改这三个字段的名称。例如在订单表我们进行如下设置：

```php
// 设置自动写入事件戳
    protected $autoWriteTimestamp = true;
// 指定创建时间
//    protected $createTime = 'createtime';
```

这是用微信小程序进行下单接口测试，可以看到返回的订单创建时间为当前时间。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191217195347.png)

**TP5 中使用事务**

我们在下单业务逻辑中，先保存了 order 数据表的信息，然后保存 order_product 数据表的信息，如果在保存 order 数据表的时候，突然断电（可能性非常小），那么 order_product 表中是没有对应的 order 的信息的，导致数据的不完整性。为了解决这种问题，需要我们使用事务操作，保证这两个保存操作同时进行或者不进行。

```php
// 生成订单
    private function createOrder($snap){
        // 开启事务
        Db::startTrans();
        try{
            $orderNo = self::makeOrderNo();
            $order = new \app\api\model\Order();
            // ...
            $order->save();
            // 订单主键
            $orderID = $order->id;
            $create_time = $order->create_time;

            foreach ($this->oProducts as &$p)
            {
                $p['order_id'] = $orderID;
            }
            $orderProduct = new OrderProduct();
            $orderProduct->saveAll($this->oProducts);

            // 事务提交
            Db::commit();
            return [
                'order_no' => $orderNo,
                'order_id' => $orderID,
                'create_time' => $create_time
            ];
        }catch (Exception $ex){
            // 事务回滚
            Db::rollback();
            throw $ex;
        }
    }
```

这里我们写一段伪代码来模拟断电：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191217200809.png)

这时通过下单接口请求之后，数据库中的订单表没有更新。如果将事务操作的代码注释掉，我们再一次进行接口访问，就可以看到 order 表中新增了一条记录，而 order_product 表中没有记录产生，这就导致了数据的不完整性。 