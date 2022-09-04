let activeEffect;
// save active effect function bucket
const bucket = new WeakMap();

const effectStack = [];

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

  // add dependecy to active effect function's deps array
  activeEffect.deps.push(deps);
}

function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  // Beacuse cleanup function delete deps,at the same time track function called, thus the same set add and delete cause maximum call stack
  const depsForRun = new Set();
  // to solve obj.foo++ caused maximum call stack
  deps &&
    deps.forEach((effectFn) => {
      if (activeEffect !== effectFn) {
        depsForRun.add(effectFn);
      }
    });
  depsForRun.forEach((effectFn) => effectFn());
}

function reactive(obj) {
  return createReactive(obj);
}

function createReactive(obj) {
  return new Proxy(obj, {
    set(target, key, newValue) {
      target[key] = newValue;
      trigger(target, key);
      return true;
    },
    get(target, key) {
      track(target, key);
      return target[key];
    },
  });
}

function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(activeEffect);
    fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  };

  effectFn.deps = [];
  effectFn();
}

function cleanup(effectFn) {
  for (const deps of effectFn.deps) {
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

const obj = reactive({
  foo: 1,
});

// effect(() => {
//   console.log(obj.foo);
// });
// // ===================
// obj.foo++;
// obj.foo++;
// output is 1 2 3,but in actual work,we may only want trigger after propery was last modified, which means the ouput is 1 3, So we need a scheduler function to manage the timing of trigger
// ===================
function effect(fn, options) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(activeEffect);
    fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  };

  effectFn.deps = [];
  // add options to effectFn
  effectFn.options = options;
  effectFn();
}
function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  const depsForRun = new Set();
  deps &&
    deps.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        depsForRun.add(effectFn);
      }
    });
  depsForRun.forEach((effectFn) => {
    // if has scheduler function
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn);
    } else {
      effectFn();
    }
  });
}
const jobQueue = new Set();
let p = Promise.resolve();
let isFlushing = false;
function flushJob() {
  if (isFlushing) return;
  isFlushing = true;
  p.then(() => {
    jobQueue.forEach((job) => job());
  }).finally(() => (isFlushing = false));
}

effect(
  () => {
    console.log(obj.foo);
  },
  {
    scheduler(fn) {
      jobQueue.add(fn);
      flushJob();
    },
  }
);
obj.foo++;
obj.foo++;
// 1 3
