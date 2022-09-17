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
let mutableInstrumentations = {
  add(key) {
    // this 仍然执行代理对象，通过 this[RAW] 获取原始数据对象
    const target = this[RAW];
    // 判断是否已经存在该值
    const hadKey = target.has(key);
    // 只有不存在该键值才做处理
    const res = target.add(key);
    if (!hadKey) {
      trigger(target, key, TriggerType.ADD);
    }
    return res;
  },
  delete(key) {
    // this 仍然执行代理对象，通过 this[RAW] 获取原始数据对象
    const target = this[RAW];
    // 判断是否已经存在该值
    const hadKey = target.has(key);
    const res = target.delete(key);
    // 只有存在该键值才触发响应
    if (hadKey) {
      trigger(target, key, TriggerType.DELETE);
    }
    return res;
  },
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
  forEach(cb, thisArg) {
    // wrap 函数，将可代理的值转换为响应式数据
    const wrap = (val) =>
      isObject(val)
        ? this.__isReadonly__
          ? readyonly(val)
          : reactive(val)
        : val;
    // 获取原始数据对象
    const target = this[RAW];
    // 与 ITERATE_KEY 建立响应式联系
    track(target, ITERATE_KEY);
    // 调用原始 forEach 方法进行遍历
    target.forEach((value, key) => {
      // 通过 .call 调用 callback 并传递 thisArg
      cb.call(thisArg, wrap(value), wrap(key), this);
    });
  },
};
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
    get(target, key, receiver) {
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
      const res = Reflect.get(target, key, receiver);
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
      const rawValue = newVal?.[RAW] || newVal;
      // 设置属性值
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
  const isTypeAdd = type === TriggerType.ADD;
  const isTypeDelete = type === TriggerType.DELETE;
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
    if (isTypeAdd) {
      const lengthEffects = depsMap.get("length");
      lengthEffects &&
        lengthEffects.forEach((effectFn) => {
          if (activeEffect !== effectFn) {
            effectsToRun.add(effectFn);
          }
        });
    }
  }

  if (
    isTypeAdd ||
    isTypeDelete ||
    // 操作类型为 type 且目标对象是 Map 类型的数据对象
    (type === TriggerType.SET && getType(target) === "map")
  ) {
    const iterateEffects = depsMap.get(ITERATE_KEY);
    iterateEffects &&
      iterateEffects.forEach((effectFn) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn);
        }
      });
  }

  if (isTypeAdd || isTypeDelete || getType(target) === "map") {
    // 取出 MAP_KEY_ITERATER_KEY 相关联的副作用函数进行执行
    const mapKeyIterateEffects = depsMap.get(MAP_KEY_ITERATER_KEY);
    mapKeyIterateEffects &&
      mapKeyIterateEffects.forEach((effectFn) => {
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

// 可迭代协议指一个对象实现了 Symbol.iterator 方法，从而被称为可迭代对象，迭代器协议指一个对象实现了 next 方法
/**
 * 迭代器方法🈯️ keys/values/entries/for...of 方法
 * 其中 for...of 和 entries 方法本质都是调用原始数据对象的 Symbol.iterator 方法，不同的是，entries 方法返回值是一个可迭代对象，for..of 实现可迭代协议即可
 */
Object.assign(mutableInstrumentations, {
  // 共用 iterationMethod 方法
  [Symbol.iterator]: iterationMethod, // for...of
  entries: iterationMethod,
});

function iterationMethod() {
  //获取原始数据对象
  const target = this[RAW];
  const itr = target[Symbol.iterator]();

  const wrap = (val) =>
    isObject(val)
      ? this.__isReadonly__
        ? readyonly(val)
        : reactive(val)
      : val;
  // 收集依赖
  track(target, ITERATE_KEY);
  return {
    next() {
      const { value, done } = itr.next();
      return {
        value: value ? [wrap(value[0]), wrap(value[1])] : undefined,
        done,
      };
    },
    // 实现可迭代协议, 不实现，调用 p.entries() 报错  p.entries is not a function or its return value is not iterable
    [Symbol.iterator]() {
      return this;
    },
  };
}

const p = reactive(
  new Map([
    ["key1", "value1"],
    ["key2", "value2"],
  ])
);
effect(() => {
  for (const [key, value] of p) {
    console.log(key, value);
  }
});
effect(() => {
  for (const [key, value] of p.entries()) {
    console.log(key, value);
  }
});

/**
 * values 和 keys 方法类似，只是返回的不是键值对
 */
const IterationMethod = {
  VALUES: "VALUES",
  KEYS: "KEYS",
};
Object.assign(mutableInstrumentations, {
  values() {
    return valuesOrKeysIterationMethod.call(this, IterationMethod.VALUES);
  },
  keys() {
    return valuesOrKeysIterationMethod.call(this, IterationMethod.KEYS);
  },
});
const MAP_KEY_ITERATER_KEY = Symbol();
function valuesOrKeysIterationMethod(type) {
  // 获取原始对象的值
  const target = this[RAW];
  const isTypeKeys = type === IterationMethod.KEYS;
  // 获取原始对应的方法
  const itr = isTypeKeys ? target.keys() : target.values();
  const wrap = (val) =>
    isObject(val)
      ? this.__isReadonly__
        ? readyonly(val)
        : reactive(val)
      : val;
  // 收集对应的依赖
  // track(target, ITERATE_KEY)
  track(target, isTypeKeys ? MAP_KEY_ITERATER_KEY : ITERATE_KEY);
  return {
    next() {
      const { value, done } = itr.next();
      return {
        // value 是值，而非键值对
        value: wrap(value),
        done,
      };
    },
    [Symbol.iterator]() {
      return this;
    },
  };
}

const p2 = reactive(
  new Map([
    ["key1", "value1"],
    ["key2", "value2"],
  ])
);
effect(() => {
  for (const value of p2.values()) {
    console.log(value); // value1, value2
  }
});
effect(() => {
  for (const key of p2.keys()) {
    console.log(key); // key1, key2
  }
});

// p2.set("key2", "valueChanged");
/**
 * 修改 key2 所对应的值，我们看到 keys 方法也会重新触发执行，这是不对的，因为我们只是修改了值，对 key 值没有改动，我们可以看到在 keys 方法中我们也是通过 ITERATE_KEY 来收集依赖，在 trigger 函数中 Map 类型的 set 操作会取出相关副作用函数进行执行，从而触发更新
 *
 * 我们需要对 keys 单独使用 MAP_KEY_ITERATER_KEY 进行建立响应式联系, valuesOrKeysIterationMethod 函数修改为下面
 * track(target, isTypeKeys ? MAP_KEY_ITERATER_KEY : ITERATE_KEY);
 *
 * trigger 函数也要单独在 操作类型为 ADD 和 DELETE 的时候 取出 MAP_KEY_ITERATER_KEY 相关副作用函数进行执行
 */
const p3 = reactive(
  new Map([
    ["p3key1", "value1"],
    ["p3key2", "value2"],
  ])
);
effect(() => {
  for (const key of p3.keys()) {
    console.log("p3", key);
  }
});
p3.set("p3key1", "valueChanged"); // 不会触发
p3.set("p3key3", "value3"); // 可以触发
