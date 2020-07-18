# php字节跳动小程序支付

由于字节跳动的开发文档可以说是非常节俭，可以说是节俭到有时候必要的一个完整的`demo`都没有，所以你在看他的开发文档时有时候会怀疑人生，尤其是在支付这块，由于字节跳动没有自己的支付渠道，且与鹅厂关系的原因，现在只支持**支付宝`APP`支付**，注意支付宝手机支付是不行的。

<!-- more -->

## 支付流程

流程图可以去看[官方文档](https://developer.toutiao.com/docs/payment/)，其中详情见文档几点几节，不要问我，我至今也没有找到。

支付的具体流程：首先前端通过`tt.login()`获取到登录凭证，然后服务端通过此凭证向字节跳动发送请求获得用户的`open_id`，然后服务端通过`open_id`和自己的订单号生成一个头条的订单号，然后生成支付宝支付的`url`，最后将相关参数组装后返回给前端，通过`tt.requestPayment()`吊起支付宝支付。

## 前端请求代码

```js
// pages/pay/index.js
Page({
  data: {
    //调用login接口返回的登陆凭证
    code:'',
    //用户的open_id
    open_id:'',
    //订单号
    ordercode:'',
    //支付宝请求所需参数
    orderParam:{}
  },
  /**
   * 页面加载，获取支付参数直接吊起支付
   */
  onLoad: function (options) {
    console.log(options.ordercode)
    var that = this;
    //判断ordercode是否存在
    if(!options.ordercode||options.ordercode==''){
      tt.showToast({
          title: '参数错误', // 内容
          duration:3000,
          icon:"none",
          success: (res) => {
            setTimeout(()=>tt.navigateBack(),3000)  
          }
        });
    }
     //获取订单号
    that.setData({
      ordercode:options.ordercode
    })

    tt.showLoading({
        title: '收银台努力加载中...',
        success (res) {
           that.getCode();
        },
        fail (res) {
            console.log(`showLoading调用失败`);
        }
    });    
  },
  /*获取用户的临时登陆凭证*/
  getCode: function(){
    var that =this
    //调取login接口
    tt.login({
      success (res) {
        that.setData({
          code:res.code
        }) 
        console.log(`login调用成功${res.code} ${res.anonymousCode}`);
        //调用获取用户openid的接口
        that.getOpenID();
      },
      fail (res) {
        tt.showToast({
          title: 'login 调用失败', // 内容
          duration:3000,
          icon:'none',
          success: (res) => {
            setTimeout(()=>tt.navigateBack(),3000);
          } 
        });
      }
    });
  },
  /*获取用户的open_id*/
  getOpenID:function(){
    var that = this;
    //调用后端获取用户openid接口
    tt.request({
      url: 'https://XXXXXXXX', // 目标服务器url
      data:{
        code:that.data.code
      },
      method:"POST",
      header:{
        "Content-Type": "application/x-www-form-urlencoded"  //post
      },
      success: (res) => {
        console.log(res.data.data);
        if(res.data.code==0){
          tt.showToast({
          title: '后端获取open_id失败', // 内容
          duration:3000,
          icon:'none',
          success: (ret) => {
            setTimeout(()=>tt.navigateBack(),3000);
          } 
        });
        }else{
          that.setData({
            open_id:res.data.data
          })
          //调用获取支付宝请求参数
          that.getOrder();

        }
      },
      fail: (res)=>{
        console.log(res)
        tt.showToast({
          title: '后端open_id接口调用失败', // 内容
          duration:3000,
          icon:'none',
          success: (ret) => {
            setTimeout(()=>tt.navigateBack(),3000);
          } 
        });
      }
    });
  },
  /*获取支付宝请求参数*/
  getOrder:function(){
    var that = this
    tt.request({
      url: 'https://XXXXXX', // 目标服务器url
      data:{
        ordercode:that.data.ordercode,
        open_id:that.data.open_id
      },
      method:"POST",
      header:{
        "Content-Type": "application/x-www-form-urlencoded"  //post
      },
      success: (res) => {
        console.log(res);
        if(res.data.code==0){
          tt.showToast({
          title: '后端获取支付宝参数失败', // 内容
          duration:3000,
          icon:'none',
          success: (ret) => {
            setTimeout(()=>tt.navigateBack(),3000);
          } 
        });
        }else{
          console.log(res.data)
          //将获得的支付请求数据绑定
          that.setData({
            orderParam:res.data.data
          })
          //调用支付请求
          that.payRequest()

        }
      },
      fail: (res)=>{
        console.log(res)
        tt.showToast({
          title: '后端orderParam接口调用失败', // 内容
          duration:3000,
          icon:'none',
          success: (ret) => {
            setTimeout(()=>tt.navigateBack(),3000);
          } 
        });
      }
    });
  },
  //调用支付宝进行支付
  payRequest:function(){
    var that = this;
    console.log(JSON.parse(that.data.orderParam.params));
    tt.requestPayment({
      data: {
        app_id: that.data.orderParam.app_id,
        method: that.data.orderParam.method,
        sign: that.data.orderParam.sign,
        sign_type: that.data.orderParam.sign_type,
        timestamp: String(that.data.orderParam.timestamp),
        trade_no: that.data.orderParam.trade_no,
        merchant_id: that.data.orderParam.merchant_id,
        uid: that.data.orderParam.uid,
        total_amount: that.data.orderParam.total_amount,
        pay_channel: that.data.orderParam.pay_channel,
        pay_type: that.data.orderParam.pay_type,
        risk_info:JSON.stringify({'ip':that.data.orderParam.risk_info}),
        params:that.data.orderParam.params,
        return_url: that.data.orderParam.return_url,
      },
      success (res) {
          console.log(res);
          tt.showToast({
            title: '支付成功！', // 内容
            duration:3000,
            icon:'none',
            success: (ret) => {
              setTimeout(that.orderDetail(),3000);
            } 
          });
      },
      fail (res) {
         console.log(res)
        tt.showToast({
          title: '支付失败！', // 内容
          duration:3000,
          icon:'none',
          success: (ret) => {
            setTimeout(()=>tt.navigateBack(),3000);
          } 
        });
      }

    });
  },
  //支付成功跳转结果页
  orderDetail:function(){
    var that = this;
    let ordercode = that.data.ordercode;
     tt.redirectTo({
        url: `/pages/detail/index?ordercode=${ordercode}`,
        success (res) {
            console.log(`${res}`);
        },
        fail (res) {
          console.log(`详情页调用失败`);
        }
    });
  }


})
```

## 后端接口代码

```php
<?php
namespace app\pay\controller;

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, run-token");
header('Access-Control-Allow-Methods: GET, POST');

use alipay\AlipayTradeAppPayRequest;
use alipay\AopClient;
use app\common\model\Orders as OrdersModel;
use app\pay\validate\TypePayParamsValidate;
use think\Config;
use think\Controller;
use think\Request;

class Paytype extends  Controller
{
    //字节登陆接口地址
    protected  $login_url ="https://developer.toutiao.com/api/apps/jscode2session?";
    //字节分配的小程序appID
    protected  $appID = '';
    //字节分配的小程序appSecret
    protected  $appSecret = '';
    //字节跳动分配的支付app_id
    protected $app_id = '';
    //接口名称
    protected $method = 'tp.trade.create';
    //请求编码
    protected $charset ='utf-8';
    protected $format ='JSON';
    //签名算法类型
    protected $sign_type = 'MD5';
    //请求交易的时间戳
    protected $timestamp;
    //调用接口的版本
    protected $version='1.0';
    //字节下单请求地址
    protected $trade_url = "https://tp-pay.snssdk.com/gateway?";

    //头条分配的商户号
    protected $merchant_id='';
    //币种
    protected $currency='CNY';
    //订单名称
    protected $subject;
    //订单详情
    protected $body;
    //订单拉起头条下单接口的有效时间 秒为单位  
    protected $valid_time =30000;
    //风控信息  传入用户的真实ip
    protected $risk_info;
    //头条支付密钥
    protected $app_secret='';

    //支付渠道
    protected $pay_chanel;
    //支付方式
    protected  $pay_type;
    //支付宝下单接口对应的异步通知url
    protected $notify_url;
    //支付宝完成支付返回的地址
    protected $return_url;
    //支付宝支付失败返回的地址
    protected $show_url;
    //设置alipay的product_code  使得返回的是字符串而不是表单
    protected $product_code = 'QUICK_MSECURITY_PAY';
    //设置alipay该笔订单最晚支付时间 90分钟  最多不能超过15d
    protected $timeout_express='90m';
    /**
     * 构造方法
     * @param 实例化对象
     * @access public
     */
    public function __construct()
    {
        $this->timestamp=time();
        $this->risk_info=$_SERVER['REMOTE_ADDR'];
    }
    /**
     *访问不存在的接口时返回错误信息
     */
    public function _empty(){
        $this->result([],404,'指定接口不存在！','json');
    }
    /**
     * 设置支付渠道
     * @parameter  $pay_chanel string  支付渠道  默认为空字符串
     * @return string  默认ALIPAY_NO_SIGN，支付宝
     */
    public function setPayChanel($pay_chanel=''){
        $this->pay_chanel = $pay_chanel?$pay_chanel:'ALIPAY_NO_SIGN';
    }
    /**
     * 设置支付方式
     * @parameter  $pay_type string  支付方式  默认为空字符串
     * @return string  默认ALIPAY_APP，支付宝
     */
    public function setPayType($pay_type=''){
        $this->pay_type = $pay_type?$pay_type:'ALIPAY_APP';
    }
    /**
     * 字节跳动下单接口
     * @parameter  $out_order_no string 用户下单的订单号
     * @parameter  $open_id string 用户的唯一标识id
     * @return  mixed  字节跳动分配的内部订单号或者错误信息
     */
    public function orderApi($out_order_no, $open_id){
        //获取订单相关信息
        $order_info = OrdersModel::getOrderInfoByOrdercode($out_order_no);
        if($order_info){
            //金额 分为单位
            $total_amount = $order_info['fee']*100;
            //下单时间
            $trade_time = $order_info['createtime'];
            //订单名称
            $this->subject = $order_info['goods']['name']?$order_info['goods']['name']:'订单名称';
            //订单详情
            $this->body = $order_info['goods']['description']?$order_info['goods']['description']:'订单详情';
        }else {
            $this->result([], 0, '订单未找到', 'json');
        }
        //设置业务请求参数
        $risk_info = ['ip'=>$this->risk_info];
        $biz_content=array(
            'out_order_no'=>$out_order_no,
            'uid'=>$open_id,
            'merchant_id'=>$this->merchant_id,
            'total_amount'=>$total_amount,
            'currency'=>$this->currency,
            'subject'=>$this->subject,
            'body'=>$this->body,
            'trade_time'=>$trade_time,
            'valid_time'=>$this->valid_time,
            'notify_url'=>$this->notify_url,
            'risk_info'=>json_encode($risk_info),
        );
        //设置请求参数
        $request_params=array(
            'app_id'=>$this->app_id,
            "method"=>$this->method,
            "charset"=>$this->charset,
            "sign_type"=>$this->sign_type,
            "timestamp"=>$this->timestamp,
            "version"=>$this->version,
            'biz_content'=>json_encode($biz_content),
        );
        //获得拼接待签名字符串
        $sign_str=arr2string($request_params);
        //生成MD5签名
        $sign = $sign_str.$this->app_secret;
        $request_params['sign']=md5($sign);
        //拼接请求字符串
        $request_str=arr2string($request_params);
        //请求地址
        $url= $this->trade_url;
        //进行post请求 这里是自己封装的请求方法
        $http_response=sendHttpRequest($url,$request_str,'POST');
        $http_response=json_decode($http_response);
        //对请求的返回结果进行判断
        if($http_response->response->code==10000){
            //返回字节给予的交易单号
            $trade_no=$http_response->response->trade_no;
            return $trade_no;
        }else{
            $this->result($http_response,0,'下单失败，请稍后重试！','json');
        }
    }

    /**
     * 字节跳动调用支付所需的请求参数
     */
    public function orderParam(){
        //验证器验证参数
        (new TypePayParamsValidate())->goCheck();
        //获取商品订单号
        $out_order_no= input('post.ordercode');
        //获取用户的open_id
        $open_id = input('post.open_id');
        //调用下单接口 获得字节内部订单号
        $trade_no = $this->orderApi($out_order_no,$open_id);
        //获取订单相关信息
        $order_info = OrdersModel::getOrderInfoByOrdercode($out_order_no);
        //调用支付宝sdk签名参数方法
        $paramsSDK = $this->alipayGet($out_order_no,$order_info);
        //获得支付宝 url
        $params=[
            'url'=>$paramsSDK['url'],
        ];
        if($order_info){
            //金额 分为单位
            $total_amount = $order_info['fee']*100;
        }else{
            $this->result([], 0, '订单未找到', 'json');
        }
        //设置支付渠道和支付方式
        $pay_chanel=input('post.pay_chanel')?input('post.pay_chanel'):'';
        $pay_type = input('post.pay_type')?input('post.pay_type'):'';
        $this->setPayChanel($pay_chanel);
        $this->setPayType($pay_type);
        $order_params=[
            'app_id'=>$this->app_id,
            //固定方法
            'method'=>'tp.trade.confirm',
            'sign_type'=>$this->sign_type,
            'uid'=>$open_id,
            'timestamp'=>strval($this->timestamp),
            'trade_no'=>$trade_no,
            'merchant_id'=>$this->merchant_id,
            'total_amount'=>$total_amount,
            'pay_channel'=>$this->pay_chanel,
            'pay_type'=>$this->pay_type,
            'risk_info'=>json_encode($this->risk_info),
            'params'=>json_encode($params),
            'return_url'=>$paramsSDK['return_url'],
        ];
        $signKeys=array("app_id","sign_type","timestamp","trade_no","merchant_id","uid","total_amount","params");
        $signData=array();
        foreach ($signKeys as $v) {
            $signData[$v] = $order_params[$v];
        };
        //获得拼接待签名字符串
        $sign_str=arr2string($signData);
        //生成MD5签名
        $sign = $sign_str.$this->app_secret;
        $order_params['sign']=md5($sign);
        $this->result($order_params,1,'下单成功！','json');
    }
    /**
     * alipay支付宝请求string
     */
    public function alipayGet($out_order_no,$order_info){
        $config = Config::get("alipay");
        $aop = new AopClient;
        $aop->gatewayUrl = $config['gatewayUrl'];
        $aop->appId = $config['app_id'];
        $aop->rsaPrivateKey = $config['merchant_private_key'];
        $aop->format = "json";
        $aop->charset =  $config['charset'];
        $aop->signType = $config['sign_type'];
        $aop->alipayrsaPublicKey = $config['alipay_public_key'];
        //实例化具体API对应的request类,类名称和接口名称对应,当前调用接口名称：alipay.trade.app.pay
        $request =new AlipayTradeAppPayRequest();
        //SDK已经封装掉了公共参数，这里只需要传入业务参数
        $bizcontent=[
            "body"=>$order_info['goods']['name'],
            "subject"=>$order_info['goods']['name'],
            "out_trade_no"=>$out_order_no,
            "timeout_express"=>$this->timeout_express,
            "total_amount"=>$order_info['fee'],
            "producct_code"=>$this->product_code
            ];
        $bizcontent = json_encode($bizcontent);
        $request->setNotifyUrl($config['notify_url']);
        $request->setBizContent($bizcontent);
        //这里和普通的接口调用不同，使用的是sdkExecute
        $response = $aop->sdkExecute($request);
        $params=[
            'return_url'=>$config['return_url'],
            'url'=>$response
        ];
        return $params;
    }


    /**
     *根据头条login获得的code请求用户的open_id
     * @param string $code 前端调用login api获得的code
     */
    public function getOpenID($code){
        //拼接请求参数
        $request_str = 'appid='.$this->appID.'&secret='.$this->appSecret.'&code='.$code;
        //请求open_id 自己封装的请求方法
        $http_response =sendHttpRequest($this->login_url,$request_str,'GET');
        $http_response = json_decode($http_response,true);
        if(empty($http_response)){
            $this->result([],0,'获取session_key及open_id时异常，字节跳动内部错误','json');
        }else{
            //判断请求是否出错
            $login_fail = array_key_exists('errcode',$http_response);
            if($login_fail){
                $this->result($http_response,0,$http_response['errmsg'],'json');
            }else{
                $this->result($http_response['openid'],1,'获取open_id成功','json');
            }
        }
    }
}
```

注：相关支付宝`SDK`问题，请查阅[支付宝官方文档](https://docs.open.alipay.com/204)，这里直接用的文档中的`php`请求demo，支付宝相关支付问题请[查阅](https://openclub.alipay.com/club/history/read/7695)

