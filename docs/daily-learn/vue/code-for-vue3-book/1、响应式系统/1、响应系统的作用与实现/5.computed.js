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

const obj = reactive({
  foo: 1,
  bar: 3,
});

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

const res = computed(() => obj.foo + obj.bar);

effect(() => console.log("computed", res.value));
console.log(res.value);
obj.foo++;
console.log(res.value);
