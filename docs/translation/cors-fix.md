# **修复 CORS 错误的三种方法及 Access-Control-Allow-Origin Header 的工作原理**

::: tip

\* 原文：[3 Ways to Fix the CORS Error — and How the Access-Control-Allow-Origin Header Works](https://medium.com/@dtkatz/3-ways-to-fix-the-cors-error-and-how-access-control-allow-origin-works-d97d55946d9)

\* 作者：[David Katz](https://medium.com/@dtkatz)

\* 翻译：[城南花已开](https://fengnzl.github.io/)

:::



## Cors 错误

![cors-error](/translation/cors-error.png)

之前遇到过？现在正在处理这个错误？

当我们在应用代码中使用 API 的时候，老实说，这个 bug 超过它应该出现的次数。每次我们遇到这个 bug 时，反应都是一样的：

![error-reaction](/translation/error-reaction.png)

## 修复方法一：安装 Allow-Control-Allow-Origin 插件

最快的修复方法是你可以安装 [moesif CORS extension](https://chrome.google.com/webstore/detail/moesif-origin-cors-change/digfbfaphojjndkpccljibejjbppifbc?hl=en-US) 插件，安装成功后，在浏览器中激活该扩展。确保插件图标的 label 从关闭变为开启。然后刷新应用，API 请求现在应该可以正常工作了！🎉

## 插件修复是骗人的

这个插件的确解决了问题。但是，该修复只适用于你自己的机器。在本地开发环境，你可以通过插件来克服这个问题。

但是当你发布应用的时候，你不能要求你的用户都安装插件，这不是一个明智的决定。

肯定有更加合适的解决方法。在找到方法之前，让我们来回答以下几个问题。

## 为什么一开始会出现 CORS 错误

这个错误源于浏览器实现的一种名为**同源策略**的安全机制。

同源策略用来对抗最常见的网络攻击之一：跨站点请求伪造。在这个攻击中，一个恶意网站试图利用浏览器的 cookie storage 系统。

针对一个域名下的所有 HTTP 请求，浏览器都会在请求中附加与该域名相关的 cookie。这对于权限验证和 session 设置非常有用。例如，当你登陆一个像 facebook-clone.com 这样的网页应用程序，你的浏览器会存储 facebook-clone.com 域名下的相关 session cookie：

![session-cookie](/translation/cors-session-cookie.png)

这太棒了！session cookie 被存储了。每次当你重新访问 facebookclone.com 标签，并点击其应用程序，你不必再次登录。相反，API 将在后面的的 HTTP 请求中携带存储的 session cookie。

唯一的问题是，当向某个域名发出另一个请求时，浏览器会携带关于储存该域名下的 cookie。因此，会产生如下场景，当你点击了一个特别的弹窗，打开了 evil-site.com.

![session-cookie2](/translation/cors-session-cookie2.png)

evil-site.com 网站同样拥有向 facebook-clone.com 发送请求的能力。由于请求将被发送到 facebookclone.com域名，浏览器将包含相关的 cookie。evil-site 网站发送会话cookie，并获得访问 facebook-clone 网站的权限。您的帐户已被跨站伪造请求攻击成功入侵。

幸运的是，在这种情况下，浏览器就像老鹰捉小鸡一样，将随时阻止恶意代码发出这样的API请求。它会阻止 evil 网站并提示“Blocked by the same-origin policy“。🕶️

## 同源策略工作原理

浏览器会在底层检查 web 应用的 origin 和 server 是否匹配。origin 简单来说就是前端应用和后端服务器域名。但是 origin 实际上包括 protocol（协议）、host（主机） 和 port（端口）。例如，对于 `https://www.facebook-clone.com` 来说其 protocol 是 `https://`，host 是 `www.facebook-clone.com`，隐藏的 port 是 443（https 通常使用的端口号）。

为了同源检查，浏览器将所有的请求都附带一个特殊请求，该请求将向域名信息接收服务器发送。例如，一个应用运行在 `localhost:3000`，这个特殊的请求如下所示：

```
Origin: http://localhost:3000
```

服务器接收到这个特殊的请求之后，将会返回一个 response header。这个响应头中包含 `Access-Control-Allow-Origin` 键，来表明那个 origins 可以访问服务器资源。这个键可能会有一两个值：

1. 服务器可以特别严格，指明只有一个 origin 可以访问。

   ```
   Access-Control-Allow-Origin: http://localhost:3000
   ```

2. 服务器可以不做限制，并使用通配符表明所有的域名都可以访问其资源。

   ```
   Access-Control-Allow-Origin: *
   ```

一旦浏览器接收到这个头信息，它会将前端域名与服务器返回的 `Access-Control-Allow-Origin` 值进行比较。如果两者不匹配，浏览器将举红旗并阻止 API 请求，报 CORS 错误。

## 插件“修复”了它么？

简单来说，没有。`access-control-allow-origin plugin` 只是关闭了浏览器的同源策略。对于每个请求，他会在返回头（response header）中添加 `Access-Control-Allow-Origin: *` 。它欺骗了浏览器，然后使用通配符重写了浏览器该返回的值。

在开发环境中使用插件是没有问题的。有可能你已经知道服务器指定了 `Access-Control-Allow-Origin` 为前端应用所在域名。同时在开发中使用插件，从而 localhost 域名可以正常发送请求。

但是如果你正在使用另一个 API，那么这个插件并没有“修复”这个问题。如前所述，你不能要求用户安装插件来访问应用。

## 修复方法二：发送请求至代理

你不能要求用户通过安装浏览器插件的形式来访问应用。但是你可以控制 web 应用的 API 请求将要访问的后端地址。

[cors -anywhere](https://github.com/Rob--W/cors-anywhere/#documentation)  服务器是将 CORS 头添加到请求的代理。该代理充当客户端和服务端之间的中介。在本例中，cors-anywhere 代理服务器在前端 web 应用程序发出请求和服务器响应数据之间运行。类似于 `Allow-control-allow-origin` 插件，它在响应中添加了 `Access-Control-Allow-Origin: *` 头。

它是这样工作的，假设前端试图发送一个 GET 请求：

[https://joke-api-strict-cors.appspot.com/jokes/random](https://joke-api-strict-cors.appspot.com/random_joke)

但是这个 api 接口并没有允许设置允许 web 应用域名可以访问的 `Access-Control-Allow-Origin` 值。因此，将请求变为：

https://cors-anywhere.herokuapp.com/[https://joke-api-strict-cors.appspot.com/jokes/random](https://joke-api-strict-cors.appspot.com/random_joke)

代理服务器从上面的URL接收 `https://joke-api-strict-cors.appspot.com/jokes/random`。 然后，它发出请求以获取服务器的响应。 最后，代理服务器将 `Access-Control-Allow-Origin：*` 应用于该原始响应。

这个方法非常棒因为它可以同时在开发和生产环境中使用。总的来说，你正在利用同源策略只能在浏览器与服务器的通信中实现。这意味着它不用在服务器之间的通信中强制执行。

`cors-anywhere` 代理的一大缺点就是需要一段时间来接收响应。延迟时间高到足以是你的应用运行比较缓慢。

这使我们去寻找一个最终、甚至更好的方法。

## 修复方法三：搭建自己的代理

我建议通过搭建自己的代理来修复这个问题。与前面的解决方案完全一样，你再次利用了在服务器到服务器通信中没有强制执行同源策略这一特性。此外，你不用在担心延迟。你不用和其他人一同使用 `cors-anywhere` 。你可以根据服务器的需求来提供相应的资源。

以下是通过 express 框架使用 Node.js 代码快速搭建的一个与之前相同的代理 [https://joke-api-strict-cors.appspot.com/](https://joke-api-strict-cors.appspot.com/random_joke) 的服务器：

```node
const express = require('express');
const request = require('request');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/jokes/random', (req, res) => {
  request(
    { url: 'https://joke-api-strict-cors.appspot.com/jokes/random' },
    (error, response, body) => {
      if (error || response.statusCode !== 200) {
        return res.status(500).json({ type: 'error', message: err.message });
      }

      res.json(JSON.parse(body));
    }
  )
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
```

这是如何运作的？ 代理使用 express 中间件将 `Access-Control-Allow-Origin：* ` 的 `header` 应用于服务器的每个响应。 在它自己的` jokes/random` GET端点处，代理从另一个服务器发送请求获取随机笑话。 即使域名不同，同源政策也不会阻止请求。 毕竟，这是服务器之间的请求。 最后，代理会创建对原始请求者（浏览器上的应用程序）的响应，该响应包括结果数据和中间件应用的 `Access-Control-Allow-Origin：* ` 的 `header`。

## 结论

CORS 错误可能是前端开发者的噩梦。但是，一旦理解了错误背后的同源策略，以及它如何对抗恶意的跨站点请求伪造攻击，它就变得可以忍受了。

最终，有了这些修复，就再也不用在浏览器控制台日志中看到红色的 CORS 错误了。相反，遇到它时，你可以使用代理或者插件，并高喊：

![cors-power](/translation/cors-power.jpeg)