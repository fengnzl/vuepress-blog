/**
 * Set 和 Map 都有特定属性和方法来操作自身，因此像平时的代理就会有问题，
 */
const s = new Set([1, 2, 3]);
const p = new Proxy(s, {});
// console.log(p.size);
// TypeError: Method get Set.prototype.size called on incompatible receiver
/**
 * https://262.ecma-international.org/13.0/#sec-get-set.prototype.size
  根据规范可知，访问size 属性，内部使用了 [[SetData]] 插槽，代理对象不存在这个内部插槽，因此会报错
 */
const p2 = new Proxy(s, {
  get(target, key, receiver) {
    if (key === "size") {
      // 如果读取的是 size 属性，则通过指定第三个参数为原始对象target
      return Reflect.get(target, key, target);
    }
    return Reflect.get(target, key, receiver);
  },
});
console.log(p2.size); // 3

// 调用 delete 方法删除数据
// TypeError: Method Set.prototype.delete called on incompatible receiver
// p2.delete(1);

/**
 * 这是由于 delete 与 size 属性不同，是一个方法，p2.delete() 方法调用时， 由 Reflect.get(target, key, receiver) 可知最后 this 指向的是代理对象 p2, 而不是原始对象 target， 因此我们需要在其调用该方法的时候绑定 this 为原始对象
 */
const p3 = new Proxy(s, {
  get(target, key, receiver) {
    if (key === "size") {
      // 如果读取的是 size 属性，则通过指定第三个参数为原始对象target
      return Reflect.get(target, key, target);
    }
    const targetType = getType(target);
    if (targetType === "map" || targetType === "set") {
      return target[key].bind(target);
    }
    return Reflect.get(target, key, receiver);
  },
});

function getType(argument) {
  return Object.prototype.toString
    .call(argument)
    .slice("[object".length + 1, -1)
    .toLowerCase();
}
console.log(p3.size); // 3
p3.delete(1);
console.log(p3.size); // 2
