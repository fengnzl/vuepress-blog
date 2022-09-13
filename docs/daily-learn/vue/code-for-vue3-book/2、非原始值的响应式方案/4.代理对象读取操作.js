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

function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  // 取出与 ITERATE_KEY 相关的副作用函数
  const iterateEffects = depsMap.get(ITERATE_KEY);
  const effectsForRun = new Set();
  effects &&
    effects.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectsForRun.add(effectFn);
      }
    });
  iterateEffects &&
    iterateEffects.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectsForRun.add(effectFn);
      }
    });
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
const obj = { foo: 1 };
const p = new Proxy(obj, {
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
  set(target, key, newVal, receiver) {
    const res = Reflect.set(target, key, newVal, receiver);
    trigger(target, key);
    return res;
  },
});

effect(() => {
  if ("foo" in p) {
    console.log("has trigger");
  }
});
p.foo++;
// has trigger
// has trigger

effect(() => {
  for (const key in p) {
    console.log("iterate trigger", key);
  }
});
p.bar = 2;
// iterate trigger foo
// iterate trigger foo
// iterate trigger bar
