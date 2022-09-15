// 存储副作用函数的桶
const bucket = new WeakMap();
const ITERATE_KEY = Symbol();
const RAW = Symbol();
const TriggerType = {
  ADD: "ADD",
  SET: "SET",
  DELETE: "DELETE",
};

function reactive(obj) {
  return createReactive(obj);
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
 * 遍历数组
 * for...in
 * 添加新元素 arr[100] = 'bar'
 * 修改数组长度 arr.length = 0
 * 无论添加新元素还是修改数组长度，本质都是修改数组的length 属性，因此在 ownKeys 中处理从而修改后可以触发
 */
// =================>

// const arr = reactive(["foo"]);
// effect(() => {
//   for (const key in arr) {
//     console.log("trigger", key, arr[key]);
//   }
// });
// arr[2] = "bar";
// arr.length = 1;
// trigger 0 foo
// trigger 0 foo
// trigger 2 bar
// trigger 0 foo

/**
 * 对于 for...of 使用迭代器实现迭代
 * https://262.ecma-international.org/13.0/#sec-array-iterator-objects 定义了内部实现，也是访问了length 属性，因此我们无需在 trigger 函数做单独处理，因为使用 for...of 循环会读取数组的 Symbol.iterator 属性，为了避免发生错误我们不应该在 track 中进行收集
 */

const arr2 = reactive(["foo"]);

effect(() => {
  for (const value of arr2) {
    console.log("trigger", value);
  }
});

arr2[1] = "bar";
arr2.length = 1;
// trigger foo
// trigger foo
// trigger bar
// trigger foo
