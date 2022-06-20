# Node.js +Koa2 打造web框架(二)

## LinValidator 校验器

我们通过是使用 LinValidator 来校验请求参数，具体可查看[文档](https://doc.cms.talelin.com/server/koa/validator.html#%E7%B1%BB%E6%A0%A1%E9%AA%8C)，如果有时间更推荐使用 [joi](https://github.com/sideway/joi) 这个强大的校验器。

简单的校验参数是正整数示例如下所示：

```js
const { LinValidator, Rule } = require('../core/lin-validator')

class PositiveIntegerValidator extends LinValidator {
  constructor() {
    super();
    this.id = [
      new Rule('isInt', '必须是正整数', { min: 1 })
    ]
  }
}

module.exports = {
  PositiveIntegerValidator
}
```
然后我们在写的接口处引入即可：

```js
router.get("/v1/:id/classic/latest", (ctx, next) => {
  const v = new PositiveIntegerValidator().validate(ctx)
  v.get('path.id') // 获取 id 值 
  ctx.body = {
    key: "classic",
  };
});
```

以上相关校验就不过多介绍，更多使用方法见文档。

当我们校验不通过时，会反回错误给前端，但是在开发的时候，我们可以看到😔做了统一拦截而没有在控制台输出错误，从而进行有效定位，因此我们需要通过配置文件来区分开发和生产环境，从而对错误进行区分处理。

```js
// config/config.js
module.exports = {
  environment: 'prod'
}

// 将配置文件全局挂载
// core/init.js
class InitManager {
  //...
  static initConfig(path = '') {
    path = path || `${process.cwd()}/config/config.js`
    const config = require(path)
    global.config = config
  }
}

// middleware/exception.js
const { HttpException } = require("../core/http-exception")
const catchError = async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    if (global.config.environment === 'dev') {
      throw error
    }
    if (error instanceof HttpException) {
      const { errorCode, msg, code } = error 
      ctx.body = {
        msg,
        errorCode,
        requestUrl: `${ctx.method} ${ctx.path}`
      }
      ctx.code = code
    } else {
      ctx.body = {
        msg: '发生了未知错误:)',
        errorCode: 999,
        requestUrl: `${ctx.method} ${ctx.path}`,
      };
      ctx.code = 500;
    }
  }
}
module.exports = {
  catchError
}
```

## Sequelize 链接数据库

数据库安装之后，我们需要安装 [Sequelize](https://sequelize.org/docs/v6/getting-started/) 来链接和操作数据库，安装之后我们还需要安装数据库对应的驱动，这里就不再详细赘述。

首先我们在 `config.js` 文件中设置数据库配置信息，然后新建 `db.js` 来进行个性化设置

```js
// config.js
module.exports = {
  environment: "prod",
  database: {
    dbName: "7yue",
    host: "localhost",
    port: 3306,
    user: "root",
    password: "islandroot",
  },
};
```
这时我们进行数据库的初始化配置：
```js
// init/db.js
const { Sequelize } = require('sequelize')
const {
  dbName,
  user,
  password,
  host,
  port,
} = require('../config/config').database
// 实例化相关 API 地址 https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-constructor-constructor
const sequelize = new Sequelize(dbName, user, password, {
  host,
  port,
  dialect: "mariadb",
  logging: true, // sql 执行在控制台输出
  timezone: "+08:00", // 时区设置，北京时间多 8 个小时
  define: {
    paranoid: true, // 创建软删除时间戳 deletedAt
    // 由于 timestamps 开启，sequelize 会默认添加 createdAt, updatedAt 时间戳
    // 这里为了遵守数据库字段名一般为下划线，所以可以开启 underscored 属性，
    // 可以对单独的模型字段设置 field 属性来忽略该影响
    underscored: true,
  },
});

async function checkConnect() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}
checkConnect();

// 使用 sync 方法自动同步所有模型

sequelize.sync({
  // alter: true, // 只针对模型中的必要字段进行修改
  force: true, // 会先将数据表删除，然后重新创建
}).catch(err => console.error(err))

module.exports = {
  sequelize
}
```

进行数据库的初始化配置之后，我们需要在 `models` 文件夹中创建对应数据表模型文件，如 `user` 模型

```js
// app/models/user.js
const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../../core/db')

class User extends Model { }

User.init({
  nickname: DataTypes.STRING
}, {
  sequelize, // 传入数据库连接实例
})
```
最基本的配置如上所示，我们只添加了 `nickname` 字段作为测试，这时我们只需要在入口文件 `app.js` 文件中导入即可

```js
// app.js
require('./app/models/user')
```

为了避免随着数据库模型的增加，而导入的代码过多，我们可以编写一个函数，在初始化配置中进行调用

```js
// core/init
class InitManager {
  static initCore() {
    //...
    InitManager.initModels()
  }
  static initModels() {
    const modelsDirectory = `${process.cwd()}/app/models` 
    requireDirectory(module, modelsDirectory);
  }
}
```

这时我们重启服务，可以看到输出的 `sql` 日志，和 `users` 数据库创建成功了

![create-table.png](/node/create-table.png)
![database-user.png](/node/database-user.png)

现在我们来完善 `user` 模型的字段

```js
const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../../core/db')

class User extends Model { }

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nickname: DataTypes.STRING,
    email: {
      type: DataTypes.STRING(128),
      unique: true,
    },
    password: DataTypes.STRING,
    openid: {
      type: DataTypes.STRING(64),
      unique: true,
    }
  },
  {
    sequelize, // 传入数据库连接实例
    tableName: "user", // 指定创建数据表名称
  }
);
```

