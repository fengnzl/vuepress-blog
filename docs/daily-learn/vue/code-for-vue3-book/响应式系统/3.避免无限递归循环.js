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

//==========================
const nestedObj = reactive({
  foo: 1,
  bar: 2,
});

// when execute nestedObj.foo++ statement, Firstly we visit the nestedObj's foo property, and track function was called, current effect fucntion add to deps, at the same time, the property's vale was added one, thus the trigger function was called, current effect fucntion was called, maximum call stack size exceeded
effect(() => {
  console.log("99");
  nestedObj.foo++;
});

// In order to solve the problem mentioned eariler, we must deal with at trigger function, and not trigger the current effect function
