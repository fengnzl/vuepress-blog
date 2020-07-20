// @flow
class Foo {
  x: string;
  y: string | number; // y 可以是字符串或者数字

  constructor(x: string, y: string | number) {
    this.x = x
    this.y = y
  }
}


type objType = {
  a: string,
  b: Array<number>,
  c: Foo
}

var obj: objType = {
  a: 'hello',
  b: [1, 2],
  d: new Foo('hello', 3)
}