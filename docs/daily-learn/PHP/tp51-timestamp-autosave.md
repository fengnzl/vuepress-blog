# tp5.1通过模型实现时间戳自动写入

因为Db是模型的基石，模型的内部最终还是要依赖Db来完成对数据库的访问等操作，所以模型可以操作Db的方法，而Db不能操作模型的方法。

<!-- more -->

```php 
# 非必须
protected $pk = 'uid'; # 设置主键名称
protected $table = 'think_user'; #设置当前模型对应的完整数据表名称
```

## 配置方式

### 全局配置

该时间戳自动写入默认为false,如果要进行全局配置，只需在database.php文件中开启即可。

```php
// 自动写入时间戳字段
'auto_timestamp'  => true,
```

当create_time和update_time两个字段不为int时，可以进行如下设置：

```php 
// 开启自动写入时间戳字段   支持字段类型包括timestamp/datetime/int
'auto_timestamp' => 'datetime',
```

默认时间字段格式化输出，输出格式为 ‘Y-m-d H:i:s’，可以自行在database.php配置文件中进行修改为false或输出格式：

```php
// 时间字段取出后的默认时间格式
    'datetime_format' => 'Y-m-d H:i:s',
//改为false 或自定义输出格式
'datetime_format' => false/'Y/m/d H:i'
```

也可以在model中设置

```php
 protected $dateFormat = 'Y/m/d H:i';
```

### 单独配置

全局的时间戳自动写入设置为false,在相应的模型中开启时间戳写入，

```php
 protected $autoWriteTimestamp = true;
    //或者设置时间格式
    // protected $autoWriteTimestamp = 'datatime';
```

如果只需要create_time而不需要update_time，则可以在model中关闭update_time

```php
  // 关闭自动写入update_time字段
    protected $updateTime = false;
```

如果数据表中的字段名 不是create_time 和 update_time 则需在model中申明他们的属性，

```php
//如：
    protected $createTime = 'my_create_time_filed';
    protected $updateTime = 'my_careate_time_field';
```

## 添加数据实现时间戳自动写入

### create()方式（推荐）

使用模型中的create()方法，实现时间戳的自动写入，并返回插入字段的数组信息，此方法为**静态调用**：

```php 
public static function register($data){
    $register = self::create($data);//添加数据
    halt($register);//打印数据
}
```

结果如下：

```php 
D:\UPUPW_AP7.2_64\vhosts\xdd\think\thinkphp\library\think\Debug.php:226:
array (size=4)
  'username' => string 'aa' (length=2)
  'pwd' => string 'd93a5def7511da3d0f2d171d9c344e91' (length=32)
  'phone' => string '13623457891' (length=11)
  'id' => string '2' (length=1)
```

当post数组中的非数据表字段数据时，create()方法只将数据表中的字段进行添加，但返回的结果中包含非数据表中的字段值（这里使用了）：

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/img/modelcreate.png)

### save()方法

save()进行添加数据，也可实现时间戳的自动写入，返回结果为boolean值，此方法需**实例化调用**：

```php
use app\api\model\User as UserModel;
//获得input上传的全部信息
$data = input('post.');
$user =new UserModel();
$result=$user->save($data);
halt($result);
```

结果如下：

```php
D:\UPUPW_AP7.2_64\vhosts\xdd\think\thinkphp\library\think\Debug.php:226:boolean true
```

还可以用链式操作**allowField()方法**，过滤post数组中非数据表中的字段

// 过滤post数组中的非数据表字段数据

```php
// 过滤post数组中的非数据表字段数据
$user->allowField(true)->save($_POST);
$user->allowField([要插入的字段,要插入的字段])->save($_POST);
# 添加多条记录
$user = new User;
$list = [
    ['name'=>'thinkphp','email'=>'thinkphp@qq.com'],
    ['name'=>'onethink','email'=>'onethink@qq.com']
];
$user->saveAll($list);
```

虽然模型类也能使用DB中的insert()方法进行添加数据，但不会实现时间戳的自动写入，所以这里不再赘述。

## 静态调用还是实例调用？

框架推荐静态调用，第一个原因，静态调用的方法更为简洁；第二个原因,从模型的本质意义讨论，你实例化出模型对象后该对象才会对应数据表下的记录，只有把类实例化了才能代表一个事物。这里我们先实例化对象就相当于获得一组数据，然后通过数据进行添加数据或获取数据，显得有点不正常。而静态调用，则是把模型当作一个表。添加数据或者获取数据都是在表上完成，这个过程就像数据表添加或查询数据一样，这样比较好理解。这里也只是为了编程逻辑的完整性和合理性，不过还是可以任意选择一种方法进行操作。

## 查询数据实现update_time时间写入

get和find是一个记录或一个模型对象，all和select则是一组记录或一组模型对象。其中find和select是属于Db类的方法，由于查询数据之后不会自动写入时间戳，因此需要更改字段内容后用save()方法进行更新数据。

### 查询数据的方法：

```php
# 查询单条记录
User::get($id)；//根据主键获取单条记录
$user = User::where('name', 'thinkphp')->find();
# 查询多条记录
$list = User::where('status', 1)->limit(3)->order('id', 'asc')->select();
$list = User::where('status', 1)->limit(3)->order('id', 'asc')->all();
# 获取某个字段或者某个列的值
// 获取某个用户的积分
User::where('id',10)->value('score');
// 获取某个列的所有值
User::where('status',1)->column('name');

# 动态查询
// 根据name字段查询用户
$user = User::getByName('thinkphp');
```

### save()方法进行更新数据

```php
//更新时间
$result->update_time=time();
//保存数据
$result->save();
```

## 更新数据实现时间戳自动写入

### update()方法(推荐)

使用模型的静态update方法进行更新，此时update_time时间戳会自动写入，返回结果为一个数组：

`halt(UserModel::update(['id'=>2,'name'=>'aa']));`

返回结果：

```php
D:\UPUPW_AP7.2_64\vhosts\xdd\think\thinkphp\library\think\Debug.php:226:
array (size=3)
  'id' => int 2
  'name' => string 'aa' (length=2)
  'update_time' => string '2019-05-21 01:14:23' (length=19)
```

使用数据库的更新方法直接更新操作，也可实现时间戳的更新（**注意两种方法的写法**），返回的是受影响的字段数：

```php
halt(UserModel::where('id','=',2)->update(['username'=>'bb']));
```

### save()方法

save()方法进行更新数据，也可实现时间戳的自动写入，返回结果为boolean值，此方法需**实例化调用**：

```php
# 方法1
$user = User::get(1);  find
$user->name     = 'thinkphp';
$user->email    = 'thinkphp@qq.com';
$user->save();

# 方法2
$user = new User;
// save方法第二个参数为更新条件
$user->save([
    'name'  => 'thinkphp',
    'email' => 'thinkphp@qq.com'
],['id' => 1]);

$user = new User;
// 过滤post数组中的非数据表字段数据
$user->allowField(true)->save($_POST,['id' => 1]);
```

## 软删除实现时间戳自动写入

**软删除仅对模型的删除方法有效，**在数据表中建 (默认) delete_time 字段，默认为null，  记录被删除的时间戳，通过use SoftDelete开启软删除。软删除之后，delete_time为当前时间戳，普通查询数据时则不会查询到此字段。

```php
use think\model\concern\SoftDelete;

class User extends Model
{
    use SoftDelete;//开启软删除
｝
```

若 想更改默认的delete_time 字段，在model中使用：

```php
  protected $deleteTime = 'delete_tm';
```

### destory()方法（推荐）

使用**静态方法**destory()进行软删除时，自动为delete_time添加时间戳，返回的是boolean值，

```php
// 软删除
User::destroy(1);
// 真实删除
User::destroy(1,true);
```

返回结果：

`D:\UPUPW_AP7.2_64\vhosts\xdd\think\thinkphp\library\think\Debug.php:226:boolean true`

默认情况下查询的数据不包含软删除数据，如果需要包含软删除的数据，可以使用下面的方式查询：

```php
User::withTrashed()->find();
User::withTrashed()->select();
```

如果仅仅需要查询软删除的数据，可以使用：

```php
User::onlyTrashed()->find();
User::onlyTrashed()->select();
```

### delete()方法

delete()方法也可以实现软删除，此方法需要**实例化调用**，返回boolean值，使用时必须先获得某条字段的数据。

```php
//获取字段的数据
$user=UserModel::get(1)；
$user=UserModel::where('id','=',1)->find();
// 软删除
$user->delete();
// 真实删除
$user->delete(true);
```

### 获取数据

默认情况下查询的数据不包含软删除数据，如果需要包含软删除的数据，可以使用下面的方式查询：

```php
User::withTrashed()->find();
User::withTrashed()->select();
```

如果仅仅需要查询软删除的数据，可以使用：

```php
User::onlyTrashed()->find();
User::onlyTrashed()->select();
```

### 恢复被软删除的数据

```php
$user = User::onlyTrashed()->find(1);
$user->restore();
```

