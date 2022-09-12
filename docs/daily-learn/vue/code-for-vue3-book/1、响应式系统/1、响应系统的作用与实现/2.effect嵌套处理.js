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
  const depsForRun = new Set(deps);
  depsForRun.forEach((fn) => fn());
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

// not add effectStack to handle nested effect function
const nestedObj = reactive({
  foo: 1,
  bar: 2,
});
effect(() => {
  console.log("effect run");
  effect(() => console.log("bar", nestedObj.bar));
  console.log("foo", nestedObj.foo);
});
nestedObj.bar++;
nestedObj.foo++;
// output as we can see we changed foo value, the nested effect function was triggered, not the outer effect function
// effect run
// bar 2
// foo 1
// bar 3
// bar 3

// add effect stack to store prev effect function and popped after fn fucntion was called, the output as blow
// bar 2
// foo 1
// bar 3
// effect run
// bar 3
// foo 2
