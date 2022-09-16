const bucket = new WeakMap();

function track(target, key) {
  if (!activeEffect) return;
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

function trigger(target, key, type) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  const effectsForRun = new Set();
  effects &&
    effects.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectsForRun.add(effectFn);
      }
    });
  // 只有新增或者删除属性，才需要出发 ITERATE_KEY 相关联的副作用函数重新执行
  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    // 取出与 ITERATE_KEY 相关的副作用函数
    const iterateEffects = depsMap.get(ITERATE_KEY);
    iterateEffects &&
      iterateEffects.forEach((effectFn) => {
        if (effectFn !== activeEffect) {
          effectsForRun.add(effectFn);
        }
      });
  }
  effectsForRun.forEach((effectFn) => {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn);
    } else {
      effectFn();
    }
  });
}

const effectStack = [];
function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(activeEffect);
    const res = fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  };

  effectFn.deps = [];
  effectFn.options = options;
  if (!options.lazy) {
    effectFn();
  }
  return effectFn;
}

function cleanup(effectFn) {
  for (const deps of effectFn.deps) {
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

/**
 * 读取操作
 * 访问属性  obj.foo  可以用 get 拦截
 * 判断对象或者原型上是否存在某个属性key, key in obj, 根据ECMA-262 13.10.1 可知我们可以使用 has 拦截
 * 使用for ... in 循环遍历对象 for (const key in obj) {} 根据 ECMA-262 14.7.5 可知，我们可以使用 ownKeys 进行拦截
 */
const ITERATE_KEY = Symbol();
const TriggerType = {
  ADD: "ADD",
  SET: "SET",
  DELETE: "DELETE",
};
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      // 建立联系
      track(target, key);
      // 返回属性值
      return Reflect.get(target, key, receiver);
    },
    // 拦截判断对象上是否存在属性
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
    // 拦截 for ... in 操作
    ownKeys(target) {
      // 由于 key 不确定，所以只有一个 target 参数，我们自行构造唯一标识
      track(target, ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
    // 拦截设置操作
    // 只有新值和旧值不同，且都不为 NaN 的时候触发副作用函数
    set(target, key, newVal, receiver) {
      // 获取旧值
      const oldVal = target[key];
      // 根据 key 是否是原有属性 判断操作是 ADD 还是 SET
      const type = hasOwnProperty(target, key)
        ? TriggerType.SET
        : TriggerType.ADD;
      const res = Reflect.set(target, key, newVal, receiver);
      //新值和旧值不同，且都不为 NaN 的时候触发副作用函数
      if (
        oldVal !== newVal &&
        (oldVal === oldVal || newVal === newVal) &&
        res
      ) {
        // 将 type 作为 trigger 函数的第三个参数
        trigger(target, key, type);
      }

      return res;
    },
    // 根据 ECMA-262 13.5.1 可知使用 deleteProperty 拦截对象的 delete 操作
    deleteProperty(target, key) {
      // 是否存在该属性
      const hasKey = hasOwnProperty(target, key);
      // 删除操作结果
      const res = Reflect.deleteProperty(target, key);
      // 自身属性和删除成功才触发函数
      if (hasKey && res) {
        trigger(target, key, TriggerType.DELETE);
      }
      return res;
    },
  });
}

function hasOwnProperty(target, key) {
  return Object.prototype.hasOwnProperty.call(target, key);
}

// const obj = { foo: 1, bar: NaN };
// const p = reactive(obj);
// effect(() => console.log(p.foo, p.bar));
// p.foo = 1;
// p.bar = NaN;

// const obj = {};
// const proto = { bar: 1 };
// const child = reactive(obj);
// const parent = reactive(proto);
// // 将 parent 设置为 child 的原型
// Object.setPrototypeOf(child, parent);

// effect(() => {
//   console.log(child.bar);
// });
// child.bar = 2;
// 1;
// 2;
// 2;
// 上面修改 child.bar 会触发两次副作用函数，造成不必要的更新，这是因为我们当访问 child 的 bar,由于自身没有改属性，会在原型上寻找，因此 parent 的 get 也会被触发，同理更新操作 set 也是如此，因此会造成两次触发
const RAW = Symbol();
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      // receiver 其实是 target 的代理对象
      // 代理对象通过 RAW 属性访问原始数据
      if (key === RAW) {
        return target;
      }
      // 建立联系
      track(target, key);
      // 返回属性值
      return Reflect.get(target, key, receiver);
    },
    // 拦截设置操作
    // 只有新值和旧值不同，且都不为 NaN 的时候触发副作用函数
    set(target, key, newVal, receiver) {
      // 获取旧值
      const oldVal = target[key];
      // 根据 key 是否是原有属性 判断操作是 ADD 还是 SET
      const type = hasOwnProperty(target, key)
        ? TriggerType.SET
        : TriggerType.ADD;
      const res = Reflect.set(target, key, newVal, receiver);
      // target === receiver.RAW 说明 receiver 就是 target 的代理对象
      if (receiver[RAW] === target) {
        //新值和旧值不同，且都不为 NaN 的时候触发副作用函数
        if (
          oldVal !== newVal &&
          (oldVal === oldVal || newVal === newVal) &&
          res
        ) {
          // 将 type 作为 trigger 函数的第三个参数
          trigger(target, key, type);
        }
      }
      return res;
    },
    // ...
  });
}

const obj = {};
const proto = { bar: 1 };
const child = reactive(obj);
const parent = reactive(proto);
// 将 parent 设置为 child 的原型
Object.setPrototypeOf(child, parent);

effect(() => {
  console.log(child.bar);
});
child.bar = 2;
// 1
// 2
