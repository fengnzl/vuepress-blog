let activeEffect;

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
  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
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

  effectFn.options = options;
  effectFn.deps = [];
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
const RAW = Symbol();
const ITERATE_KEY = Symbol();
const TriggerType = {
  ADD: "ADD",
  SET: "SET",
  DELETE: "DELETE",
};
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (key === RAW) {
        return target;
      }
      track(target, key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, newVal, receiver) {
      const oldVal = target[key];
      const type = hasOwnProperty(target, key)
        ? TriggerType.SET
        : TriggerType.ADD;
      const res = Reflect.set(target, key, newVal, receiver);
      if (receiver[RAW] === target) {
        if (
          oldVal !== newVal &&
          (oldVal === oldVal || newVal === newVal) &&
          res
        ) {
          trigger(target, key, type);
        }
      }
      return res;
    },
    deleteProperty(target, key) {
      const hasKey = hasOwnProperty(target, key);
      const hasDelete = Reflect.deleteProperty(target, key);
      if (hasDelete && hasKey) {
        trigger(target, key, TriggerType.DELETE);
      }
      return hasDelete;
    },
    // 判断对象或者原型上是否存在某个属性key
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
    // for ... in 循环
    ownKeys(target) {
      track(target, ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
  });
}

function hasOwnProperty(target, key) {
  return Object.prototype.hasOwnProperty.call(target, key);
}

// const obj = reactive({ foo: { bar: 1 } });
// effect(() => console.log(obj.foo.bar));
// obj.foo.bar = 3;
// obj.foo = { bar: 2 };
// 1
// 2
// 由于在读取 obj.foo.bar 的时候首先读取了 obj.foo，并直接返回了 obj.foo 的值，因此只有 obj.foo 是响应式的，即浅响应

// 新增 isShallow 参数，代表是否为浅响应，默认为 false
function createReactive(obj, isShallow = false) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (key === RAW) {
        return target;
      }
      track(target, key);
      // 得到原始值结果
      const res = Reflect.get(target, key, receiver);
      // 如果是对象且不是浅响应，递归调用函数包装为响应式
      if (isObject(res) && !isShallow) {
        return createReactive(res);
      }
      return res;
    },
    set(target, key, newVal, receiver) {
      const oldVal = target[key];
      const type = hasOwnProperty(target, key)
        ? TriggerType.SET
        : TriggerType.ADD;
      const res = Reflect.set(target, key, newVal, receiver);
      if (receiver[RAW] === target) {
        if (
          oldVal !== newVal &&
          (oldVal === oldVal || newVal === newVal) &&
          res
        ) {
          trigger(target, key, type);
        }
      }
      return res;
    },
    deleteProperty(target, key) {
      const hasKey = hasOwnProperty(target, key);
      const hasDelete = Reflect.deleteProperty(target, key);
      if (hasDelete && hasKey) {
        trigger(target, key, TriggerType.DELETE);
      }
      return hasDelete;
    },
    // 判断对象或者原型上是否存在某个属性key
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
    // for ... in 循环
    ownKeys(target) {
      track(target, ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
  });
}

function isObject(argument) {
  return typeof argument === "object" && argument !== null;
}

function reactive(obj) {
  return createReactive(obj);
}

function shallowReactive(obj) {
  return createReactive(obj, true);
}

const test = reactive({ foo: { bar: 1 } });
effect(() => console.log(test.foo.bar));
test.foo.bar = 4;
// 1
// 4

const test2 = shallowReactive({ foo: { bar: 1 } });
effect(() => console.log(test2.foo.bar));
test2.foo.bar = 3;
test2.foo = { bar: 2 };
// 1
// 2
