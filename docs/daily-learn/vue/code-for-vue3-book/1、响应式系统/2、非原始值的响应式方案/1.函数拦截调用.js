// proxy 只能代理对象，它允许我们拦截并重新定义一个对象的基本操作 如读取、设置属性，调用函数等

const fn = (name) => {
  console.log("I am " + name);
};

// 函数也是对象，调用函数是一个基本操作 而调用对象的方法就是一个复合操作，不是基本操作
fn();

const p = new Proxy(fn, {
  apply(target, thisArg, argsArray) {
    return target.call(thisArg, ...argsArray);
  },
});
p("lf");
