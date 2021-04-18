export class Set {
  constructor() {
    this.set = Object.create(null);
  }

  add(key) {
    this.set[key] = true;
  }

  has(key) {
    return this.set[key] === true;
  }

  delete(key) {
    if (this.has(key)) {
      delete this.set[key];
      return true;
    }
    return false;
  }

  clear() {
    this.set = Object.create(null);
  }

  // 自定义size 方法
  size() {
    return Object.keys(this.set);
  }

  values() {
    return Object.keys();
  }
}
