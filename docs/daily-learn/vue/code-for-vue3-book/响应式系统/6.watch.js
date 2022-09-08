let activeEffect;
// use bucket to store reactive obj active effect function
const bucket = new WeakMap();
// solve nested effect causes wrong active effect
const effectStack = [];

function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  const effectsForRun = new Set();
  deps &&
    deps.forEach((effect) => {
      if (effect !== activeEffect) {
        effectsForRun.add(effect);
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

function reactive(obj) {
  return createReactive(obj);
}

function createReactive(obj) {
  return new Proxy(obj, {
    set(target, key, newVal) {
      target[key] = newVal;
      trigger(target, key);
      return true;
    },
    get(target, key) {
      track(target, key);
      return target[key];
    },
  });
}

function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(activeEffect);
    // 将 fn 执行的结果存储在 res 中
    const res = fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    // 将 res 作为 effectFn 的返回值
    return res;
  };

  effectFn.options = options;
  effectFn.deps = [];
  // 只有非 lazy 的时候才执行副作用函数
  if (!options.lazy) {
    effectFn();
  }
  // 将副作用函数作为返回值进行返回
  return effectFn;
}

function cleanup(effectFn) {
  for (const deps of effectFn.deps) {
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

const jobQueue = new Set();
let isFlushing = false;
const p = Promise.resolve();
function flushJob() {
  if (isFlushing) return;
  isFlushing = true;
  p.then(() => jobQueue.forEach((job) => job())).finally(
    () => (isFlushing = false)
  );
}

function computed(getter) {
  // use value to cache the last computed value
  let value;
  // use dirty to indicate whether the value needs to be recalculated
  let dirty = true;

  const effectFn = effect(getter, {
    // use lazy to indicate that the effect function will be called only when computed value is visited
    lazy: true,
    // when the scheduler function is  called, it means that the dependent data changes, we need set dirty to true, and call the trigger function
    scheduler() {
      dirty = true;
      trigger(obj, "value");
    },
  });

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn();
      }
      track(obj, "value");
      return value;
    },
  };
}

function watch(source, cb, options) {
  // source 可以是响应式数据或者一个 getter 函数，所以要分别讨论处理
  let getter;
  // 如果 source 是函数，说明用户传递的是 getter, 所以直接将 source 赋值给 getter
  if (typeof source === "function") {
    getter = source;
  } else {
    // 递归读取响应式数据 source
    getter = () => traverse(source);
  }
  // 定义新值和旧值
  let oldValue, newValue;
  const effectFn = effect(() => getter(), {
    lazy: true,
    // 当依赖发生变化，调用回调函数
    scheduler() {
      // 在 scheduler 中执行副作用函数，得到的是新值
      newValue = effectFn();
      // 将旧值和新值作为回调函数的参数
      cb(newValue, oldValue);
      // 更新旧值，否则下次会得到错误的旧值  注意如果是引用类型的数据，则需要使用cloneDeep
      // 这里简单处理 对象和基本类型数据
      oldValue =
        typeof newValue === "object" && newValue !== null
          ? JSON.parse(JSON.stringify(newValue))
          : newValue;
    },
  });
  // 手动调用副作用函数，拿到旧值
  const value = effectFn();
  oldValue =
    typeof value === "object" && value !== null
      ? JSON.parse(JSON.stringify(value))
      : value;
}

function traverse(source, hasSeen = new Set()) {
  // 如果 source 是原始值 或者已经被读取过，则什么都不做
  if (typeof source !== "object" || source === null || hasSeen.has(source))
    return;
  // 将数据添加到 hasSeen 表明已经遍历的读取过，避免循环引用引起的死循环
  hasSeen.add(source);
  // 暂时不考虑数组等其他机构
  // 假设只是对象
  for (const key in source) {
    traverse(source[key], hasSeen);
  }
  return source;
}

const obj = reactive({
  foo: 1,
});

watch(
  () => obj.foo,
  (newVal, oldVal) => {
    console.log(newVal, oldVal);
  }
);
watch(obj, (newVal, oldVal) => {
  console.log("obj", newVal, oldVal);
});
obj.foo++;
