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
  // 缓存上一次计算的值
  let value;
  // dirty 标志，标识是否需要重新计算值，为 true 的时候表示脏，需要重新计算
  let dirty = true;
  // 把 getter 作为副作用函数，创建一个 lazy 的 effect
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      // 当依赖发生变化，在trigger执行的时候将其置为脏
      dirty = true;
      // 当计算属性依赖的响应式数据发生变化时 手动调用 trigger 函数触发响应
      trigger(obj, "value");
    },
  });
  const obj = {
    get value() {
      if (dirty) {
        value = effectFn();
        dirty = false;
      }
      // 当读取 value 时，手动调用 track 函数进行跟踪
      track(obj, "value");
      return value;
    },
  };
  return obj;
}

function isObject(argument) {
  return typeof argument === "object" && argument !== null;
}

function traverse(source, hasSeen = new Set()) {
  // 如果 source 不是对象 或者已经访问过 则什么都不做 直接返回
  if (!isObject(source) || hasSeen.has(source)) return;
  // 将数据添加到 hasSeen, 表明已经访问过，避免循环引起的死循环
  hasSeen.add(source);
  // 这里暂时只考虑 source 是对象的情况
  for (const key in source) {
    traverse(source[key], hasSeen);
  }
  return source;
}

function watch(source, cb, options = {}) {
  // 定义getter
  let getter;
  // 如果 source 是函数，则说明用户传递的是 getter，因此直接将其赋值
  if (typeof source === "function") {
    getter = source;
  } else {
    // 调用 traverse 函数递归读取对象，从而可以 track
    getter = () => traverse(source);
  }
  // 定义旧值和新值
  let oldValue, newValue;
  //提取 scheduler 函数作为独立的 job 函数
  const job = () => {
    // 在 scheduler 中执行副作用函数，得到的是新值
    newValue = effectFn();
    // 将旧值和新值作为回调函数的参数
    cb(newValue, oldValue);
    // 将旧值更新
    oldValue = isObject(newValue)
      ? JSON.parse(JSON.stringify(newValue))
      : newValue;
  };
  // 使用 effect 注册副作用函数时， 开启 lazy 选项，并将返回值存储到 effectFn 中 便于后续调用
  const effectFn = effect(() => getter(), {
    lazy: true,
    scheduler() {
      // 在调度函数中判断 flush 是否为 post，如果是，则将其加入到微任务队列中执行
      if (options.flush === "post") {
        const p = Promise.resolve();
        p.then(job);
      } else {
        job();
      }
    },
  });

  if (options.immediate) {
    // 立即执行 相当于直接调用了job 函数
    job();
  } else {
    // 手动调用副作用函数，拿到旧值
    const value = effectFn();
    oldValue = isObject(value) ? JSON.parse(JSON.stringify(value)) : value;
  }
}

const obj = reactive({
  foo: 1,
});

watch(
  () => obj.foo,
  (newVal, oldVal) => {
    console.log(newVal, oldVal);
  },
  { immediate: true }
);
obj.foo++;
// 1 undefined
// 2 1

const obj2 = reactive({
  bar: 3,
});
watch(
  obj2,
  (newVal, oldVal) => {
    console.log("obj2", newVal, oldVal);
  },
  {
    immediate: true,
    flush: "post",
  }
);

obj2.bar++;
obj2.bar++;

// obj2 { bar: 3 } undefined
// obj2 { bar: 5 } { bar: 3 }
// obj2 { bar: 5 } { bar: 5 }
