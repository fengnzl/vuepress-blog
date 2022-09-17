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
// 标记变量是否可以进行追踪，默认 true，可以追踪
let shouldTrack = true;
["push", "pop", "shift", "unshift", "splice"].forEach((method) => {
  const originMethod = Array.prototype[method];
  arrayInstrumentations[method] = function(...args) {
    // 在调用原始方法之前，禁止追踪
    shouldTrack = false;
    const res = originMethod.apply(this, args);
    // 调用方法之后，恢复原来的行为，即允许追踪
    shouldTrack = true;
    return res;
  };
});
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
// const mutableInstrumentations = {
//   add(key) {
//     // this 仍然执行代理对象，通过 this[RAW] 获取原始数据对象
//     const target = this[RAW];
//     // 判断是否已经存在该值
//     const hadKey = target.has(key);
//     // 只有不存在该键值才做处理
//     const res = target.add(key);
//     if (!hadKey) {
//       trigger(target, key, TriggerType.ADD);
//     }
//     return res;
//   },
//   delete(key) {
//     // this 仍然执行代理对象，通过 this[RAW] 获取原始数据对象
//     const target = this[RAW];
//     // 判断是否已经存在该值
//     const hadKey = target.has(key);
//     const res = target.delete(key);
//     // 只有存在该键值才触发响应
//     if (hadKey) {
//       trigger(target, key, TriggerType.DELETE);
//     }
//     return res;
//   },
// };
function getType(argument) {
  return Object.prototype.toString
    .call(argument)
    .slice("[object".length + 1, -1)
    .toLowerCase();
}

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
    get(target, key) {
      if (key === RAW) {
        return target;
      }
      // 如果是数组，且 key 存在于 arrayInstrumentations 上
      if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      const targetType = getType(target);
      // 不是只读属性 或者键值不是 symbol 类型
      if (!isReadonly || typeof key !== "symbol") {
        // taget 如果是 Map 或者 Set
        if (targetType === "set" || targetType === "map") {
          if (key === "size") {
            track(target, ITERATE_KEY);
            return Reflect.get(target, key, target);
          }
          // 返回定义在 mutableInstrumentations 下的方法
          return mutableInstrumentations[key];
        }
        track(target, key);
      }

      if (isShallow) {
        return res;
      }
      if (isObject(res)) {
        return isReadonly ? reactive(res) : readyonly(res);
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
      const rawValue = newVal?.[RAW] || newVal;
      const res = Reflect.set(target, key, rawValue, receiver);
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
  // 禁止追踪时，直接返回
  if (!activeEffect || !shouldTrack) return;
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
 * Map 数据拥有 set 和 get 方法，这里我们与 Set 的 add 和 delete 方法类似进行处理
 */
const mutableInstrumentations = {
  get(key) {
    // 获取原始数据对象
    const target = this[RAW];
    // 判断读取的 key 是否存在
    const hadKey = target.has(key);
    // 追踪依赖
    track(target, key);
    const res = target.get(key);
    if (this.__isShallow__) {
      return res;
    }
    if (hadKey && isObject(res)) {
      // 如果存在属性
      return this.__isReadonly__ ? readyonly(res) : reactive(res);
    }
    return res;
  },
  set(key, newVal) {
    // 获取原始数据对象
    const target = this[RAW];
    const hadKey = target.has(key);
    const oldValue = target.get(key);
    // 设置新值
    target.set(key, newVal[RAW] || newVal);
    // 不存在则说明是新增数据
    if (!hadKey) {
      trigger(target, key, TriggerType.ADD);
    } else if (
      oldValue !== newVal &&
      (newVal === newVal || oldValue === oldValue)
    ) {
      trigger(target, key, TriggerType.SET);
    }
  },
};

// 增加第三个参数 isReadonly，代表是否只读，默认 false
function createReactive(obj, isShallow = false, isReadonly = false) {
  return new Proxy(obj, {
    // 拦截读取操作
    get(target, key) {
      if (key === RAW) {
        return target;
      }
      if (key === "__isShallow__") {
        return isShallow;
      }
      if (key === "__isReadonly__") {
        return isReadonly;
      }
      // 如果是数组，且 key 存在于 arrayInstrumentations 上
      if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      const targetType = getType(target);
      // 不是只读属性 或者键值不是 symbol 类型
      if (!isReadonly || typeof key !== "symbol") {
        // taget 如果是 Map 或者 Set
        if (targetType === "set" || targetType === "map") {
          if (key === "size") {
            track(target, ITERATE_KEY);
            return Reflect.get(target, key, target);
          }
          // 返回定义在 mutableInstrumentations 下的方法,
          this.__isShallow__ = isShallow;
          this.__isReadonly__ = isReadonly;
          return mutableInstrumentations[key];
        }
        track(target, key);
      }

      if (isShallow) {
        return res;
      }
      if (isObject(res)) {
        return isReadonly ? reactive(res) : readyonly(res);
      }
      return res;
    },
  });
}
const p = reactive(new Map([["key", 1]]));
effect(() => console.log(p.get("key"))); // 1
p.set("key", 2); // 2

/**
 * 上述存在问题，如以下所示
 */
// 原始对象
const m = new Map();
// 代理对象
const p1 = reactive(m);
// p2 为另一个代理对象
const p2 = reactive(new Map());
// 将 p2 设置为 p1 的一个键值对
p1.set("p2", p2);
// 这里我们通过原始对象访问 p2
effect(() => console.log(m.get("p2").size)); // 0
// 这里通过原始对象赋值，本应该不会触发副作用函数，但实际上未处理前会触发，
m.get("p2").set("foo", 1); // 1
/**
 *  这是因为在 mutableInstrumentations set 方法中，我们将新值原封不动的设置到原始数据上
 *  // 设置新值
    target.set(key, newVal);
 * 上述将响应式数据设置到原始数据上我们称为数据污染， 因此我们需要将其改为如下所示
    target.set(key, newVal[RAW] || newVal);
    Set 类型的 add 方法，普通对象的写值操作和数组添加元素方法都需要做类似的处理
 */
