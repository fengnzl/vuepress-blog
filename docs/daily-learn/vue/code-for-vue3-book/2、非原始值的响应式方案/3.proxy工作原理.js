// 创建代理对象指定的拦截函数，是用来自定义代理对象本身的内部方法和行为的，而不是指定被代理对象的内部方法和行为
// 代理透明性质，如果代理对象没有创建指定对应的拦截函数，则会调用原始对象对应的函数

// delete
const obj = { foo: 1 };
const p = new Proxy(obj, {
  deleteProperty(target, key) {
    return Reflect.deleteProperty(target, key);
  },
});
console.log(p.foo); // 1
delete p.foo;
console.log(p.foo); // undefined
console.log(obj.foo); // undefined
