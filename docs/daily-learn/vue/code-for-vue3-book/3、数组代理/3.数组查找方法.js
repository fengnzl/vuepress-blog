// 存储副作用函数的桶
const bucket = new WeakMap();
const ITERATE_KEY = Symbol();
const RAW = Symbol();
const TriggerType = {
  ADD: "ADD",
  SET: "SET",
  DELETE: "DELETE",
};

const arrayInstrumentations = {};
["includes", "indexOf", "lastIndexOf"].forEach((method) => {
  const originMethod = Array.prototype[method];
  arrayInstrumentations[method] = function(...args) {
    // this 是代理对象，先在代理对象中查找
    let res = originMethod.apply(this, args);

    // 如果代理对象中没有找到，则通过 this[RAW] 获取原始数组，在原始数组中查找
    if (res === false) {
      res = originMethod.apply(this[RAW], args);
    }
    return res;
  };
});

// 定义一个 map, 存储原始对象到代理对象的映射
const reactiveMap = new Map();
function reactive(obj) {
  // 判断是否已经创建过代理对象
  const existProxy = reactiveMap.get(obj);
  if (existProxy) {
    return existProxy;
  }
  const proxy = createReactive(obj);
  reactiveMap.set(obj, proxy);
  return proxy;
}
function shallowReactive(obj) {
  return createReactive(obj, true);
}
function readyonly(obj) {
  return createReactive(obj, /* isShallow */ false, /* isReadonly */ true);
}
function shallowReadonly(obj) {
  return createReactive(obj, /* isShallow */ true, /* isReadonly */ true);
}
// 增加第三个参数 isReadonly，代表是否只读，默认 false
function createReactive(obj, isShallow = false, isReadonly = false) {
  return new Proxy(obj, {
    // 拦截读取操作
    get(target, key, receiver) {
      if (key === RAW) {
        return target;
      }
      // 如果操作的目标对象是数组，且 key 存在于 arrayInstrumentations 上
      if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      // 添加判断如果 key 是 Symbol 类型，则不进行追踪
      // 只有非只读才需要建立响应式联系
      if (!isReadonly && typeof key !== "symbol") {
        // 将副作用函数 activeEffect 添加到存储副作用函数的桶中
        track(target, key);
      }

      const res = Reflect.get(target, key, receiver);

      if (isShallow) {
        return res;
      }

      if (isObject(res)) {
        return isReadonly ? readyonly(res) : reactive(res);
      }

      return res;
    },
    // 拦截设置操作
    set(target, key, newVal, receiver) {
      // 如果是只读的，打印错误信息并返回
      if (isReadonly) {
        console.warn(`属性 ${key} 是只读的`);
        return true;
      }
      const oldVal = target[key];
      // 如果属性不存在，则说明是在添加新的属性，否则是设置已存在的属性
      const type = Array.isArray(target)
        ? // 如果代理目标是数组，检测是新增数据还是修改数据
          Number(key) >= target.length
          ? TriggerType.ADD
          : TriggerType.SET
        : hasOwnProperty(target, key)
        ? TriggerType.SET
        : TriggerType.ADD;
      // 设置属性值
      const res = Reflect.set(target, key, newVal, receiver);
      if (target === receiver[RAW]) {
        if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
          // 增加第四个参数，即触发响应的新值
          trigger(target, key, type, newVal);
        }
      }

      return res;
    },
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
    ownKeys(target) {
      // 如果目标对象是数组，则使用 length 属性作为 key
      track(target, Array.isArray(target) ? "length" : ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
    deleteProperty(target, key) {
      // 如果是只读的，打印错误信息并返回
      if (isReadonly) {
        console.warn(`属性 ${key} 是只读的`);
        return true;
      }
      const hadKey = hasOwnProperty(target, key);
      const res = Reflect.deleteProperty(target, key);

      if (res && hadKey) {
        trigger(target, key, "DELETE");
      }

      return res;
    },
  });
}

function isObject(argument) {
  return typeof argument === "object" && argument !== null;
}
function hasOwnProperty(target, key) {
  return Object.prototype.hasOwnProperty.call(target, key);
}

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

function trigger(target, key, type, newVal) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);

  const effectsToRun = new Set();
  effects &&
    effects.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn);
      }
    });
  if (Array.isArray(target)) {
    if (key === "length") {
      // 如果修改了 length，则需要取出索引大于等于 length 值的元素
      depsMap.forEach((effects, key) => {
        if (key >= newVal) {
          effects.forEach((effectFn) => {
            if (activeEffect !== effectFn) {
              effectsToRun.add(effectFn);
            }
          });
        }
      });
    }
    if (type === TriggerType.ADD) {
      const lengthEffects = depsMap.get("length");
      lengthEffects &&
        lengthEffects.forEach((effectFn) => {
          if (activeEffect !== effectFn) {
            effectsToRun.add(effectFn);
          }
        });
    }
  }

  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    const iterateEffects = depsMap.get(ITERATE_KEY);
    iterateEffects &&
      iterateEffects.forEach((effectFn) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn);
        }
      });
  }

  effectsToRun.forEach((effectFn) => {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn);
    } else {
      effectFn();
    }
  });
}

// 用一个全局变量存储当前激活的 effect 函数
let activeEffect;
// effect 栈
const effectStack = [];

function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);
    // 当调用 effect 注册副作用函数时，将副作用函数复制给 activeEffect
    activeEffect = effectFn;
    // 在调用副作用函数之前将当前副作用函数压栈
    effectStack.push(effectFn);
    const res = fn();
    // 在当前副作用函数执行完毕后，将当前副作用函数弹出栈，并还原 activeEffect 为之前的值
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];

    return res;
  };
  // 将 options 挂在到 effectFn 上
  effectFn.options = options;
  // activeEffect.deps 用来存储所有与该副作用函数相关的依赖集合
  effectFn.deps = [];
  // 执行副作用函数
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
 * 数组查找方法
 * 数组方法内部依赖于其基本语义，因此大部分我们不需要进行处理
 */
// =================>
// const arr = reactive([1, 2]);
// effect(() => {
//   console.log(arr.includes(1)); // 初始打印 true
// });
// arr[0] = 3; // 可以正确触发响应   false

/**
 * 未修改之前
 * 根据 https://262.ecma-international.org/13.0/#sec-array.prototype.includes 规范 Let elementK be ? Get(O, ! ToString(𝔽(k))) 及 get 拦截器可知最后返回的是一个代理对象，因此不相等
 * 对于这类方法我们需要进行单独处理
 * 并在 get 拦截读取操作时进行相应的判断
 */
// 未处理之前
// const obj = {};
// const test = reactive([obj]);
// console.log(test.includes(obj)); // false

// 处理之后
const obj = {};
const test = reactive([obj]);
console.log("includes", test.includes(obj));
console.log("includes", test.includes(test[0]));
// includes true
// includes true
