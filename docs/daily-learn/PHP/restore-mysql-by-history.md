# 通过历史data文件目录恢复数据库

通过历史文件目录中的数据库文件和InnoDB的共有表空间文件恢复误删数据库。
<!-- more -->

今天突然看到phpEnv这个简介界面的php集成环境，想起我那upupw集成环境就是一把泪，所以就想尝鲜一把，于是我就按照其开发文档进行下载安装，但是万万没想到我为了避免产生其文档所说的的mysql文档无法启动的情况，于是一时大意失荆州未备份数据库就将mysql卸载，于是可想而知，当我安装号phpenv工具时，打开数据库时懵逼的表情，数据库都没了orz，但是我发现mysql下载之后在原文件夹中还存在data文件，于是通过百度终于找到了恢复方法。

## 数据恢复

**首先找到卸载mysql目录下的data文件夹：**

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/img/20190526003715.png)

里面有很多的历史文件，其他都不要管，1 是ibdata1  该文件是InnoDB的共有表空间，必须要拷贝过去的，2 是我要恢复的数据库名称。

关闭mysql服务，将这两个文件拷贝到新安装的mysql 的data文件目录（D:\phpEnv\server\mysql\mysql-57\data）下，重新启动服务，你会发现OJBK了。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/img/20190526004051.png)

此时打开navicat你会发现数据库又恢复了。

