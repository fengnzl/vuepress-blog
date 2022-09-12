let activeEffect;
// save active effect function bucket
const bucket = new WeakMap();

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
    fn();
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

const changeBranch = reactive({
  isOk: true,
  text: "hello",
});

effect(() => console.log(changeBranch.isOk ? changeBranch.text : "not"));

setTimeout(() => (changeBranch.isOk = false), 2000);
setTimeout(() => (changeBranch.test = "world"), 3000);
