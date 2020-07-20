// @flow
let str: string = 'aa';
let num: number = 12;
let bool: boolean = false;
let unde: void = undefined; // undefined 的类型是 void
let nu: null = null; // null 的类型是 null

const a: string = 'a';  // 字面量值对应的类型名称是小写 
const b: string = String('b');  // String 函数是将参数转化成一个字符串，类型仍是小写
const c: String = new String('c'); // 大写开头的类型名称，其对应的值是 new 创建出来的类型实例；

