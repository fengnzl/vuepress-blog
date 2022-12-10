# 腾讯短信验证Api

腾讯短信验证接口Api编写，后端语言PHP，使用框架ThinkPHP5.1
<!-- more -->


产品需要实现用户只能使用手机验证码登陆，并且其服务器为腾讯云，因此我们使用的是腾讯短信接口，首先我们在产品中搜索短信，然后进入以下界面：

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190526013102.png)

点击接入指南，我们进入到官方文档，https://cloud.tencent.com/document/product/382/9557  ，然后按照文档所说，获取**SDKAppID 和 AppKey**。

## 获取 SDKAppID 和 AppKey

进入短信控制台，进行应用添加，添加完应用后，点击应用即可看到SDKAppID 和 AppKey。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190526013512.png)

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190526013840.png)

## 申请签名和模版

一个完整的短信由短信**签名**和**短信正文内容**两部分组成，两者均需申请和审核，但只有申请完签名才能申请短信正文。

!![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/a07ee2001ef100dc64159b0b3f202df.png)

若产品只针对国内用户则按以下顺序进行申请即可。

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190526014239.png)

申请完签名后即可申请短信正文，

![](https://raw.githubusercontent.com/fengnzl/HexoImages/master/img/20190526014541.png)

其中{1}，{2}这些可以在项目文件中进行配置，但数字必须按顺序来。

## 配置 SDK

按照文档进行composer或者手动下载均可。

如果是手动下载，则需要在文件中进行引用：

```php
require(__DIR__."/../../../extend/qcloudsms/src/index.php");//注意__DIR__后一定要加/
```

然后在项目文件中按照指定的单发模板进行修改即可：

模板文件如下：

```php
//指定模板单发短信
use Qcloud\Sms\SmsSingleSender;

try {
    $ssender = new SmsSingleSender($appid, $appkey);
    $params = ["5678"];
    $result = $ssender->sendWithParam("86", $phoneNumbers[0], $templateId,
        $params, $smsSign, "", "");  // 签名参数未提供或者为空时，会使用默认签名发送短信
    $rsp = json_decode($result);
    echo $result;
} catch(\Exception $e) {
    echo var_dump($e);
}
```

在实际项目中需要自行修改和配置，如下为tp5.1项目中的配置：

```php
<?php
namespace app\api\controller;
//引入腾讯云短信验证文件
require(__DIR__."/../../../extend/qcloudsms/src/index.php");
use Qcloud\Sms\SmsSingleSender;
use app\api\model\Captcha;
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,fs-token");
header('Access-Control-Allow-Methods: GET, POST');
class Sms extends  Base
{
    // 短信应用SDK AppID
    private $appid = 1400211624; // 1400开头

        // 短信应用SDK AppKey
    private  $appkey = "429f08cab6c2544bf7ff8065ebaaf8deafafda";

        // 需要发送短信的手机号码
//    public  $phoneNumbers = ["21212313123", "12345678902", "12345678903"];

        // 短信模板ID，需要在短信应用中申请
    private  $templateId = 7839;  // NOTE: 这里的模板ID`7839`只是一个示例，真实的模板ID需要在短信控制台中申请

    private  $smsSign = "XXX"; // NOTE: 这里的签名只是示例，请使用真实的已申请的签名，签名参数使用的是`签名内容`，而不是`签名ID`
    /**
     * 短信验证码发送函数
     * @param $phone char  手机号
     * @return mixed 短信信息或错误信息
     */
    public function send($phone,$pwd){
        if(user_md5($phone)!=$pwd){
            $this->apiReturn(303,'md5验证失败');
        }
        //设置随机验证
        $captcha = mt_rand(100000,999999);
        //将验证码保存到数据库
        $sql = [
            'captcha' => $captcha,
            'phone' => $phone,
            'add_time' => time()
        ];
        //根据手机号查询验证码
        $res = Captcha::getInfoByPhone($phone);
        //如果没有数据 则插入数据  否则更新数据
        if($res){
            //根据手机号进行数据更新
            $res->save([
                'captcha' => $captcha,
                'add_time'=> time()
            ],['phone' => $phone]);
        }else{
            Captcha::create($sql);
        }
        //捕获异常
        try{
            //实例化单发短信对象
            $ssender =  new SmsSingleSender($this->appid,$this->appkey);
            //设置模板对应参数  [验证码，失效时间]
            $params = [$captcha,10];
            //发送短信 86为国家码  返回结果为json数据
            $result = $ssender->sendWithParam("86", $phone, $this->templateId,
                $params, $this->smsSign, "", "");  // 签名参数未提供或者为空时，会使用默认签名发送短信
            //反序列化数据
            $data=json_decode($result);
            //返回结果
            $this->apiReturn(200,'发送成功',$data);
        }catch (\Exception $e){
            //返回错误信息
            $error = $e->getMessage();
            $this->apiReturn(303,$error);
        }
    }
}
```

短信验证接口文件：

```php
/**
 * @title 短信验证接口
 */
class Captcha extends  Base
{
    /**
     * @title 获取短信验证码
     * @description 获取短信验证码 默认6位数，失效时间为10分钟
     * @author 开发者
     * @url /api/captcha/sendRegisterSms
     * @method POST
     * @param name:phone type:char require:1 default:null  desc:手机号
     * @param name:pwd type:char require:1 default:null  desc:验证参数（实际就是手机号）
     */
    public function sendRegisterSms()
    {
        //获得提交的手机号和密码
        $phone = input('phone');
        $pwd=user_md5(input('pwd'));
        //手机号登陆验证
        (new SmsCaptcha())->goCheck();
        //引入短信验证方法
        $sms=new Sms();
        $sms->send($phone, $pwd);
    }
}
```

api接口返回友好信息函数：

```php
/**
 * api接口返回友好信息
 * @param number $code   状态
 * @param string $msg    状态描述
 * @param unknown $data  返回数据
 */
public function apiReturn( $code=200 , $msg='', $data = array() ,$Total=0 ){
    $returnData = array(
        'code' => $code,
        'msg'  => $msg?$msg:return_msg($code),
        'data' => $data,
        'Total'=>$Total
    );
    if(I('callback')){
        echo I('callback').'('.json_encode($returnData).')';die;
    }
```

自定义非常规加密函数：
```php
/**
 * 系统非常规MD5加密方法
 * @param  string $str 要加密的字符串
 * @param  string $auth_key 要加密的字符串
 * @return string
 * @author jry <598821125@qq.com>
 */
function user_md5($str, $auth_key = ''){
    if(!$auth_key){
        $auth_key = config('AUTH_KEY');
    }
    return '' === $str ? '' : md5(sha1($str) . $auth_key);
}
```