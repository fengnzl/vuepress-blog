# 微信小程序商城构建全栈应用（四）

此文主要描述了TP5中数据库的访问模式、ORM（对象关系映射）和数据集等相关知识，并以此编写部分的项目接口。

<!-- more -->

## 数据库访问与ORM

在完成数据库的相关配置之后，我们就可以进行相关数据的查询。

这里首先编写了`BannerMIssException.php`异常文件

``` php
class BannerMissException extends BaseException
{
    public $code = 404;
    public $msg = '请求的Banner不存在';
    public $errorCode = 40000;
}
```

然后再相关方法中根据id获取相关banner的信息

``` php
public function getBanner($id)
    {
        (new IDMustBePositiveInt())->goCheck();
        $banner = BannerModel::getBannerByID($id);
        if(!$banner){
            throw new BannerMissException('参数错误');
        }
        return json($banner);
    }
```

数据库的访问模式（最终都是生成原生的sql语句进行查询）

1. 使用原生语句查询

   ```php
   public static function getBannerByID($id){
           return Db::query("select * from banner_item where banner_id=?",[$id]);
   }
   ```

2. 使用查询器Query来操作数据库

3. 

### TP5数据库中间层架构解析  

平时我们不用框架进行数据库访问的话，一般都是直白的sql语句或者pdo的方式进行访问。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191201201901.png)

而TP5框架则使用的是面向对象的思想（类与类之间相互关联完成一系列功能）。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191201202021.png)

其中Db是数据库操作的入口对象，即数据库的链接和增删改查操作都是通过Db对象完成的。Db链接数据库时首先实例化Collection连接器对象，通过此对象来链接，Collection内部是通过PHP的PDO来链接，平时处于待命状态（惰性），只有在执行sql语句时，才会真正的链接数据库，从而节约服务器数据库的资源。如果使用原生语句查询，则不会使用到Query和Builder两个对象。

TP5提供了使用查询器Query来操作数据库，即对常见的CURD操作进行封装，能够进行链式操作等，然后通过Builder生成器将封装的数据生成不同类型的原生的sql语句然后通过Collection链接类进行数据库操作。

### 查询构造器  

**为什么我们要查询构建器等别的方法来执行数据库操作而不用原生的SQL操作？**

1. 第一个原因原生的SQL语句没有使用查询构建器等简洁方便；
2. 第二个是主要原因，查询数据器封装了对不同数据库的操作，提供给开发者统一的SQL操作语法，不需要关心原生SQL的差异性。TP5的数据库操作最终都会转化为原生SQL的操作。  

``` php
public static function getBannerByID($id){
        return Db::table('banner_item')->where('banner_id', $id)->select();
    }
```

Db就相当于一个实现接口，我们不需要关系它的实现细节，只要操作数据库就会使用Db类。db类使用的table、where等都是辅助方法或链式方法，而select和find和update和delete和insert等方法才是真正的执行数据操作方法，不管使用了多少辅助方法都不会进行数据查询等操作，只有使用了select和find和update和delete和insert等方法才能执行数据操作方法。 

**为什么链式方法并不会执行真正的SQL语句和可以通过链条的方式来调用？**

 每个链式方法都会返回一个Query对象，所以才可以添加任意多的链式方法，无论添加多少，最终都只会得到一个Query对象，Query对象只有使用select等方法才能生成SQL语句。链式方法只能在真正的SQL执行方法（select方法等）之前调用，不同的链式方法没有先后顺序，相同的链式方法的先后顺序是有可能对最后产生的结果有影响的（比如order方法）。

 当使用完Db类执行过select等方法后，Db的状态就会被清除。

链式方法的where方法有三种写法，表达式、数组法（不建议使用）、闭包法。  

```php
// 数组法
$map['banner_id'] = $id;
$result = Db::table('banner_item')
    ->where($map)
    ->select();
// 闭包法
 $result = Db::table('banner_item')
            ->where(function ($query) use($id){
                $query->where('banner_id','=',$id);
            })
            ->select();
        return $result;
```

### 开启SQL日志记录  

如果只想看单独一条sql语句，则可以在链式操作中加入`fetchSql()`方法。第二种方法就是将sql语句记录到日志中，主要分为以下几个步骤：

1. 开启数据库调试模式

   ```php
   // database.php
   // 数据库调试模式
   'debug'           => true,
   ```

2. 在配置日志选项中开启sql记录

   ``` php
   'log' => [
           // 日志记录方式，内置 file socket 支持扩展
           'type'  => 'file',
           // 日志保存目录
           'path'  => LOG_PATH,
           // 日志记录级别
           'level' => ['sql'],
       ],
   ```

此时重新请求即可在日志文件中看到相关记录

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191201215143.png)

但是这样直接在配置文件中修改，相当于再次开启了默认的全局的日志记录功能，因此我们需要向全局异常日志处理中一样在一个地方开启日志处理功能即可，这里选择在项目的入口文件进行开启。

```php
//开启sql日志
\think\Log::init([
    // 日志记录方式，内置 file socket 支持扩展
    'type'  => 'file',
    // 日志保存目录
    'path'  => LOG_PATH,
    // 日志记录级别
    'level' => ['sql'],
]);
```

**注意：一般在生产环境无需开启sql日志记录。**

### ORM与模型

ORM：对象关系映射。 将一个数据表当做一个对象来对待。

模型： 复杂的模型可能对应多个对象或者多个数据表的，不是一一对应的，简单的模型会产生一个假象，即一个模型对应一个数据库的表，模型的作用主要是用来处理比较复杂的业务逻辑。模型是根据业务逻辑来划分的，简单地说就是根据功能来划分。模型更加关注业务逻辑，而不是数据库查询。模型是可以划分多层的，TP5推荐划分的有model层、service层、logic层。，需要继承Model基类，通过模型调用数据库返回的是一个对象，而用Db类得到的数据为数组，模型查到的数据无需调用json()方法，框架会自行进行序列化操作;

```php
// api/v1/banner.php
$banner = BannerModel::get($id);
if(!$banner){

throw new BannerMissException('参数错误');
}
return $banner;
```

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191201220404.png)

**一般模型和数据表名是一一对应的，但是也可以在模型中指定对应的表。**

``` php
protected $pk = 'uid'; # 设置主键名称
protected $table = 'think_user'; #设置当前模型对应的完整数据表名称
```

**推荐使用静态调用原因如下：**

1.静态方法调用更加具体，不用实例化对象。

2.从类和对象方面考虑，当new一个表时，相当于实例化一个模型对象的一条记录，后面在调用方法get一个id或者其他方法寻找记录时，逻辑上是不正确的，当使用静态方法时，类对应着一张表，静态方法相当于获取表中的记录，这样更加合理。

DB获取数据的方法有find()【一条】和select()【多条】;

Model类获取数据的方法有get()【一条】和all()【多条】由于Model类是继承于DB类的，所以Model类也可以使用DB类的方法。

## 专题、分类、商品详情接口编写  

 数据表关系分析，这里以banner和banner_item表为例。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191201224010.png)

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191201223955.png)  

我们可以看出banner表和banner_item表是一对多的关系，从banner_item表来看，是一对一的关系，因此综合来看是一对多的关系，如果从banner_item表中来看，以为是一对多的关系，则两张表就是多对多的关系。

搞清楚表与表之间的关系和通过什么字段来关联对我们编写模型关联是很重要的。不管两个表之间是什么关系，查询出来的都是数组，一对多的话就有多个元素，一对一的话就只有一个元素罢了。  

### 模型关联

如果是一堆多关联用`hasMany（）`如banner 表对应着多个bannerItems：

```php
/**
*banner模型 一堆多关联 banner表与banner_item表形成一对多关联的方法
* return 关联结果的对象
*/
public function items(){
    return $this->hasMany('BannerItem','banner_id','id');
}
```

在调用的时候用with()方法来进行预载入，同时可以传递数组，表明关联的多个表。

```php
public static function getBannerByID($id){
        return self::with(['items','items.image'])->select($id);
    }
```

其中`items.image`（嵌套模型），表明items关联的模型下的image关联。即Banneritems模型又与`image模型有关联，

一对一关联用`belongsto()`方法

```php
class BannerItem extends Model
{
    public function image(){
        return $this->belongsTo('Image','img_id','id');
    }
}
```

返回的结果如下图所示：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191201230036.png)

**我们需要在那个模型里面调用关联或者获取另一个模型的数据，就在那个模型里面定义关联方法**

**如果在含有外键的表或模型中编写模型关联则使用`belongsTo`方法，如果在没有外键的表或模型中编写模型关联则使用`hasOne`方法**

我们可以在模型类的内部来处理隐藏字段的问题，在模型类内部加一个属性`hidden`来指定需要隐藏的模型字段，同样如果使用了`visible`属性就是指定需要显示的字段。

```php
// model/Banner.php
protected $hidden = ['update_time','delete_time'];

//model/BannerItem.php
 protected $hidden = ['id','img_id','delete_time','update_time','banner_id'];
 
// model/Image.php
protected $hidden = ['id','from','delete_time','update_time'];
```

这是查询结果如图：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191201231033.png)

**隐藏模型字段的原因主要有两个：**

- 出于安全性的考虑，有些字段是不应该被返回给客户端的；
- 为了保持返回的的json格式的数据比较简洁。

### 图片资源URL配置

image数据表中的url是一个相对路径，不是一个绝对路径  , 这是因为如果把url写完整的话，即包括域名和目录等，那数据表的数据就容易写死，以后如果域名和名录出现变更就不好修改了，如果我们写相对路径的话，图片路径也可以根据相应域名和目录来写出适合的完整url路径。  

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191201232141.png)

**如何设置图片url的完整路径呢？**

一般需要我们自己建立一个配置文件来为我们的业务服务。在application里面的extra文件夹中（如果不存在则自行创建）创建一个setting配置文件。

``` php
return [
    'image_prefix'=>'http://zerg.io/images'
];
```

 注意，这里我们的域名指向项目根目录下的public文件夹，因此我们的图片目录images也是需要放在public目录下。这样我们图片的前缀地址就配置好了，通过以下方法即可获取配置信息`config('setting.img_prefix')`。  

通过框架自带的[获取器]( https://www.kancloud.cn/manual/thinkphp5/135192 )我们可以在读取数据的时候自动在返回的字段中添加配置的前缀名。同时根据image数据表中有个from字段，来判断该图片url是网络上的还是本地的，如果是本地的我们就需要拼凑。

```php
// mosdel/Image.php
 /**
* 读取器 驼峰命名  get固定字段 Url读取的字段名 Attr字段值 data该记录的所有字段
* @param $value 图片url值
* @param $data 当前记录所有字段
* @return string  完整url值
*/
public function getUrlAttr($value,$data){
    $finalUrl = $value;
    if($data['from'] == 1){
        $finalUrl = config('setting.img_prefix').$value;
    }
    return $finalUrl;
}
```

   返回的结果

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191202005827.png)

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/Gridea/20191202005850.png)

   其实这个获取器也是AOP思想的应用，所有的value通过我们的`getUrlAttr`这个获取器变成了另外一种形式返回。获取器只有在我们对模型的属性进行访问的时候才会调用，而我们返回的banner模型对象后，就已经包含了对image模型的url属性访问，所以自动就调用了获取器。  

### 自定义模型基类

上面我们在`Image`模型下读取其url，并使用了获取器来自动添加前缀，如果我们在其他模型中也需要获取url，该用什么方法？

**因为某个模型的读取器只针对当前模型有效。**因此可以使用以下两种方法：

1. 把读取器里的代码封装成一个函数，在需要的时候调用该函数即可。
2. 使用面向对象的思想，将其放在模型基类中，该模型基类继承think的model类，其他模型继承该模型即可。

``` php
namespace app\api\model;

use think\Model;

class BaseModel extends Model
{
    public function getUrlAttr($value, $data){
        $finalUrl = $value;
        if($data['from'] == 1){
            $finalUrl = config('setting.img_prefix').$value;
        }
        return $finalUrl;
    }
}

// api/model/Image.php
class Image extends BaseModel
```

这时还存在一个问题，如果有的模型的图片路径并不是url，则这个获取器就无法使用，因此我们需要对基类模型中的`getUrlAttr`方法进行改进。

​		首先需要将其名称改为`prefixImageUrl`，并设置为`protected`，先不让所有的模型去调基类的获取器，而是当我们需要的时候，在当前模型重新定义获取器，这样可以把业务实现的具体逻辑集中到同一个地方。如果模型中有一些共有的特性，都应该考虑在基类模型中处理，这样扩展性能也相对较好。

```php
// model/BaseModel.php
class BaseModel extends Model
{
    protected function prefixImgUrl($value, $data){
        $finalUrl = $value;
        if($data['from'] == 1){
            $finalUrl = config('setting.img_prefix').$value;
        }
        return $finalUrl;
    }
}

// model/Image.php
public function getUrlAttr($value, $data){
	return $this->prefixImgUrl($value, $data);
}
```

**定义API版本号**

编写接口代码要遵循**开闭原则**：对扩展是开放的，对修改是封闭的。因此如果要修改代码，最好的方式是以扩展的形式来修改，例如Exception想要添加一个新功能，只需添加一个Exception类即可。

凡是修改代码，都会产生影响以前功能正常调用的风险。所以尽量不要去修改代码，而是在合适的地方添加新的扩展。根据版本的不同将代码分离出来，每一个版本做一个单独的代码模块。

**为什么需要版本号？**因为当我们的产品有新版本的时候，一些老的版本的接口我们可能就不再支持使用了，可以删除掉我们以前写的接口的代码，然后写新的代码，但是互联网产品一定要考虑对老版本的兼容性问题，有点用户是不会升级到你的新版本，这时候需要多版本以及版本号的支持，只有分版之后，才能对新老客户端都支持，在开始规划产品的时候就要知道应该向上兼容几个版本，而不是完全把以前的版本都给兼容了，没有必要，而且成本也高。

### 专题接口模型

首先theme表中的`top_img_id`表示主页专题模块的图片，而`head_img_id`则表示专题详情页面时的头部图片。所有的图片都是与image表有关联。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191203093606.png)

而主题表theme和产品表product是多对多的关系，因为一个主题可以包含多个产品，一个产品同时也可以属于多个主题。对于这种多对多关系，我们一般多使用一张表，否则会很繁琐。例如在主表中设置多一个字段来描述该theme下的所有product，这是通过新增和修改字段来设置；如果我们使用第三章表就可以直接插入一条记录，这样就会变得比较简单。

我们编写代码时应先集中在当前的业务点，即这三张表之间，我们先创建Theme控制器文件，其次是Theme和Product模型文件。

theme表和image表是一对一的关系，知道这些关系之后我们就可以在模型中将关联写好。

``` php
class Theme extends BaseModel
{
    protected $hidden = ['delete_time', 'update_time', 'topic_img_id', 'head_img_id'];

    public function topicImg(){
        return $this->belongsTo('Image','topic_img_id','id');
    }

    public function headImg(){
        return $this->belongsTo('Image', 'head_img_id', 'id');
    }

    public function products(){
        return $this->belongsToMany('Product','theme_product','product_id','theme_id');
    }

    public static function getThemeWithProducts($id){
        $theme = self::with(['topicImg','headImg','products'])->find($id);
        return $theme;
    }
}
```

**Theme接口验证与重构**

这里我们选择传递到接口的参数为ids=id1,id2...的形式，因此我们需要将验证正整数的公用函数`isPositiveInteger`方法提取到验证基类中。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191203113032.png)

然后编写相关验证器和获取theme列表的接口。

```php
// 验证器
class IDCollection extends BaseValidate
{
    protected $rule = [
        'ids' => 'require|checkIDs'
    ];
    protected $message = [
        'ids' => 'ids必须是以逗号分隔的多个正整数'
    ];

    //$value就是客户端传递过来的ids = id1, id2...
    protected function checkIDs($value){
        $values = explode(',', $value);
        if(empty($values)){
            return false;
        }
        foreach ($values as $id){
            if(!$this->isPositiveInt($id)){
                return false;
            }
        }
        return true;
    }
}
// v1/Theme.php
/**
 * 根据ids获取一组theme模型
 * @url theme?ids=id1,id2...
 * @http GET
 * @ids theme的id集合
 */
public function getSimpleList($ids=''){
    (new IDCollection())->goCheck();
    $ids = explode(',', $ids);
    $result = ThemeModel::with(['head_img','topic_img'])
        ->select($ids);
    if(!$result){
        throw new ThemeMissException();
    }
    return json($result);
}

// 异常抛出
class ThemeMissException extends BaseException
{
    public $code = 404;
    public $msg = '指定主题不存在，请检查主题ID';
    public $errorCode = 30000;
}
```

这是请求接口就可以正常获取数据，然后继续编写接口，并配置路由

```php
/**
* 获取指定id的theme及产品
* @url theme/:id
* @http GET
* @id theme的id
*/
public function getComplexOne($id){
    (new IDMustBePositiveInt())->goCheck();
    $result = ThemeModel::getThemeWithProducts($id);
    if(!$result){
        throw new ThemeMissException();
    }
    return json($result);
}
// 路由配置文件
Route::get('api/:version/theme','api/:version.Theme/getSimpleList');

Route::get('api/:version/theme/:id','api/:version.Theme/getComplexOne');
```

这时我们请求接口`zerg.io/api/v1/theme/1`会出现如下错误

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191203184602.png)

这是因为TP5的路由匹配的完整匹配模式，在读取路由匹配时，会按照顺序，如果有第一个路由成功匹配，后续如果有相似的路由则不会进行匹配。

所以需要我们将配置文件进行如下修改：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191203184750.png)

这是我们就可以正常请求接口。并返回如下结果：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191203185017.png)

这里的pivot代码的是中间表，包含了两个外键。这是TP5自动带上的，在多对多的关系表里，它是建立模型之间的关联关系而产生的数据。

### 数据库字段冗余的合理利用

首先先在product模型中隐藏一些属性。

``` php
class Product extends BaseModel
{
    protected $hidden = ['delete_time','create_time','category_id','from','img_id','pivot','update_time'];
}
```

在product表中`img_id`是与image表关联，通过这个字段和`main_img_url`最终都可以获得url，因此这里设置了两个字段。

**为什么要合理数据冗余？**这是出于性能的考虑，当数据量如果比较多，嵌套循环（theme-product-image）也多的情况下，查询起来性能会有所影响，product表如果要去image表中查询图片url，在有足够多的product时，查询性能就会有所影响，而做了数据冗余就可以减少去image表中查询url，从而提高一部分性能，减少数据库压力，主要要合理利用，不能滥用，根据具体的业务情况来决定。

**同时要注意不可滥用数据库冗余**。这对维护数据库的完整性和一致性比较困难，而且是不符合数据库的设计规范的。

这里我们完善接口，将返回的`main_img_url`字段的前缀补上

``` php
 public function getMainImgUrlAttr($value,$data){
 	return $this->prefixImgUrl($value, $data);
 }
```

**最近新品接口编写**

这里按照时间倒序排列，注意控制查询数量。同时`create_time, delete_time`字段是使用模型操作数据库时TP5创建的。

相关代码如下：

``` php
// model/product
 public static function getMostRecent($count){
        $products = self::limit($count)
            ->order('create_time desc')
            ->select();
        return $products;
    }
// validate/count
class Count extends BaseValidate
{
    protected $rule = [
        'count' =>'isPositiveInt|between:1,15'
    ];
}
//ProductMissExceprion.php
class ProductMissException extends BaseException
{
    public $code = 404;
    public $msg ="指定商品不存在，请检查参数";
    public $errorCode = 20000;
}
// 控制器
 public function getRecent($count=15){
        (new Count())->goCheck();

        $result = ProductModel::getMostRecent($count);
        if(!$result){
            throw new ProductMissException();
        }
        return json($result);
    }
```

如果我们想在某个接口中隐藏特定的字段，不能在模型中隐藏该字段，因此需要在接口处进行隐藏。首先接口返回的是一个数组对象，我们需要通过`collection`助手函数实现数据集对象的转换，从而可以使用`Collection`类的一系列方法其中就有`hidden`方法。

``` php
 $collection = collection($result);
 $collection->hidden(['summary']);
 return json($collection);
```

这时我们可以看接口返回的结果隐藏了`summary`这个字段。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191206134814.png)

如果上面以数组的形式来处理可能会比较复杂，因为没有一些内置的方法。而数据集对象给我们提供了很多方法来处理业务。一组product模型对象可以理解为就是数据集对象，最好就是用对象自带的方法来处理，而不是用公共的方法或者使用类外面的方法来处理，以此提高类的内聚性。

**我们可以修改数据库配置文件让其默认返回的是collection数据集对象。**

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/blog/20191206135403.png)

注意数据集的判断为空的方法是`isEmpty`，因此代码我们可以修改如下

``` php
public function getRecent($count=15){
        (new Count())->goCheck();

        $result = ProductModel::getMostRecent($count);
        $result->hidden(['summary']);
        if($result->isEmpty()){
            throw new ProductMissException();
        }
        return json($result);
    }
```

