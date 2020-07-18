---
title: ' ThinkPHP操作Excel'
date: 2020-01-28 20:36:09
tags: [ThinkPHP]
published: true
hideInList: false
feature: http://img.netbian.com/file/2019/1220/27ab69b19aed09caf8f47fe7e7c84b43.jpg
isTop: false
---

这里主要是记录在 ThinkPHP 中实现导入或者导出 Excel 文件的功能。

<!-- more -->


## 准备工作

由于 ThinkPHP 5.1 版本之后，官网不在提供下载版本，需要使用 Composer 或者 git 方式进行安装和更新。同时安装 PHPExcel 插件页需要用到 Composer，因此我们先对其进行安装。

我们可以在[官网](https://getcomposer.org/download/)下载最新的安装文件。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191224181400.png)

运行下载好的composer-setup.exe，勾选Developer mode（勾选此选项，可自定义安装目录），然后一路 next 即可，其中不要勾选 proxy 选项即可。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191224181700.png)

如果安装过程中提示缺少 xx.dll 的错误信息，说明 PHP 相关环境没有正确配置。

安装完成之后我们打开命令行，输入 composer，出现以下提示，说明安装成功。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191224182033.png)

然后我们执行如下命令进行[国内镜像安装](https://pkg.phpcomposer.com/)：

```js
composer config -g repo.packagist composer https://packagist.phpcomposer.com
```

安装完成之后，我们输入以下命令来安装 ThinkPHP。其中 5.0.* 是指安装匹配 5.0 的版本，如果不写版本号则默安装最新版本。

``` php
composer create-project topthink/think [项目名称] 5.0.*  --prefer-dist 
```

然后安装 phpexcel，首先打开命令行窗口，定位到项目目录，执行以下命令：

```php
composer require phpoffice/phpexcel
```

执行完返回如下成功提示。（这里之前安装过，所以提示可能有些不同）

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191224183501.png)

此时在项目的 vendor 中可以看到 phpexcel 已经安装成功。

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191224200456.png)

## 使用PHPExcel

首先在控制器中引用 PHPExcel，然后再编辑相关方法。

```php
use PHPExcel;
use PHPExcel_IOFactory;
```

### 读取excel

首先将一个测试 excel 表放进 public 文件夹中，表中内容如下：

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191224205319.png)

编写的读取 excel 表的方法为：

``` php
public function read(){
        try{
            if(!file_exists('./test.xlsx'))
            {
                throw new Exception('test.xlsx doesn\'t exist');
            }
            // 声明所读取的excel的格式为excel2007
            $reader = PHPExcel_IOFactory::createReader('Excel2007');
            // 加载文件
            $excel = $reader->load('./test.xlsx');
            // 读取指定表中的指定单元格数据
            //根据行列坐标获取第一个表中的第一个值
            echo '0列1行的值:' . $excel->getSheet(0)->getCellByColumnAndRow(0,1)->getValue() . '<br />';
            echo "单元格坐标A1的值:" . $excel->getSheet(0)->getCell('A1')->getValue() . '<br />';
            // 循环每个工作表
            foreach($excel->getWorksheetIterator() as $worksheet)
            {
                // 输出工作表名
                echo '当前工作表名:',$worksheet->getTitle().'<br/>';

                // 循环输出当前工作表的每行数据
                foreach ($worksheet->getRowIterator() as $row)
                {
                    // 输出当前行数
                    echo '当前行：',$row->getRowIndex().'<br/>';
                    // 获取当前行单元格的相关信息
                    $cellIterator = $row->getCellIterator();
                    // 获取当前行的所有信息，包括空单元格
                    $cellIterator->setIterateOnlyExistingCells(false);
                    foreach ($cellIterator as $cell)
                    {
                        if(!is_null($cell)){
                            // 获取单元格的坐标和值
                            echo '单元格：',$cell->getCoordinate(),'-',$cell->getCalculatedValue().'<br/>';
                        }
                    }
                }
            }
        }catch(Exception $e){
            throw $e;
        }
    }
```

访问该方法，可以得到结果如下：

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191224205527.png)

有时候我们需要将 excel 表中的数据读取，并保存到数据库中，于是需要我们编写如下方法：

``` php
public function saveToDB(){
        try{
            if(!file_exists(('./test.xlsx'))){
                throw new Exception('excel file: aa.xlsx doesn\'t exist');
            }
            // 声明需要读取excel的格式为excel2007
            $objReader = PHPExcel_IOFactory::createReader('Excel2007');
            //加载Excel 文件
            $objPHPExcel = $objReader->load('aa.xlsx');
            // 读取第一个工作表
            $sheet = $objPHPExcel->getSheet(0);
            // 获取总行数
            $totalRow = $sheet->getHighestRow();
            // 获取总列数
//            $totalColumn = $sheet->getHighestColumn();
            $data = [];
            $queryData = [];
            // 循环读取数据
            for($row = 2;$row<= $totalRow;$row++){
                // 需要读取的列
                $data['name'] = $sheet->getCell('A'.$row)->getValue();
                $data['job'] = $sheet->getCell('B'.$row)->getValue();
                DB::name('table')->save($data);
                // 获取插入的sql 语句
                array_push($queryData,DB::name('table')->getLastSql().';');
            }
            return json($queryData);
        }catch(Exception $e){
            throw $e;
        }
    }
```

这个需要自行设置数据等相关信息，这里就不再演示。

### 导出 Excel

编写导出 excel 的 download 方法，然后访问即可下载 excel 文件。

``` php
public function download(){
        // 实例化 PHPExcel 对象
        $objPHPExcel = new PHPExcel();

        // 设置文件属性 创建人 修改者 标题 等相关信息
        $objPHPExcel->getProperties()->setCreator("Maarten Balliauw")
            ->setLastModifiedBy("Maarten Balliauw")
            ->setTitle("Office 2007 XLSX Test Document")
            ->setSubject("Office 2007 XLSX Test Document")
            ->setDescription("Test document for Office 2007 XLSX, generated using PHP classes.")
            ->setKeywords("office 2007 openxml php")
            ->setCategory("Test result file");


        // excel 表中添加数据
        $objPHPExcel->setActiveSheetIndex(0)
            ->setCellValue('A1', 'eminem')
            ->setCellValue('B2', 'rap god!')
            ->setCellValue('C1', 'Hello')
            ->setCellValue('D2', 'world');

        // 重命名当前数据表
        $objPHPExcel->getActiveSheet()->setTitle('demo');


        // 设置打开数据表 光标在第一个单元格
        $objPHPExcel->setActiveSheetIndex(0);


        // Redirect output to a client’s web browser (Excel2007)
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="HelloWorld.xlsx"'); // 文件名设置
        header('Cache-Control: max-age=0');
        // If you're serving to IE 9, then the following may be needed
        header('Cache-Control: max-age=1');

        // If you're serving to IE over SSL, then the following may be needed
        header ('Expires: Mon, 26 Jul 1997 05:00:00 GMT'); // Date in the past
        header ('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT'); // always modified
        header ('Cache-Control: cache, must-revalidate'); // HTTP/1.1
        header ('Pragma: public'); // HTTP/1.0

        $objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
        $objWriter->save('php://output');
        exit;
    }
```

访问该方法，下载文件内容如下所示：

![](https://raw.githubusercontent.com/recoveryMonster/HexoImages/master/blog/20191224211648.png)

**注意：**

- 通过composer 安装的 TP 框架和 PHPExcel 可以直接通过 use 引入文件，如果是直接下载 PHPExcel 后复制到 vendor 文件夹，或者直接源码下载的 TP 框架，use 可能会出现问题，需要使用以下方法进行导入：

  ``` php
  require_once(VENDOR_PATH.'phpoffice/phpexcel/Classes/PHPExcel.php');
  require_once(VENDOR_PATH.'phpoffice/phpexcel/Classes/PHPExcel/IOFactory.php');
  
  // 声明需要读取excel的格式为excel2007
  $reader = \PHPExcel_IOFactory::createReader('Excel2007');
  $objPHPExcel = new \PHPExcel();
  ```

- 该PHPExcel 插件已经不在维护，而是推荐使用 [PhpSpreadsheet](https://github.com/PHPOffice/PhpSpreadsheet)。

  

