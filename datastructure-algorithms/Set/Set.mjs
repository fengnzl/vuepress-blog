export class _Set {
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
    return Object.keys(this.set).length;
  }

  values() {
    return Object.keys(this.set);
  }

  union(otherSet) {
    const unionSet = new _Set();
    this.values().forEach((key) => unionSet.add(key));
    otherSet.values().forEach((key) => unionSet.add(key));
    return unionSet;
  }

  intersection(otherSet) {
    const intersectionSet = new _Set();
    // 减少循环次数
    const values = this.values();
    const otherValues = otherSet.values();
    let smallValues = values;
    let biggerSet = otherSet;
    if (values.length > otherValues.length) {
      smallValues = otherValues;
      biggerSet = this;
    }
    smallValues.forEach((key) => {
      if (biggerSet.has(key)) {
        intersectionSet.add(key);
      }
    });
    return intersectionSet;
  }

  difference(otherSet) {
    const diffSet = new _Set();
    this.values().forEach((key) => {
      if (!otherSet.has(key)) {
        diffSet.add(key);
      }
    });
    return diffSet;
  }

  isSubsetOf(otherSet) {
    if (this.size() > otherSet.size()) {
      return false;
    }
    const values = this.values();
    for (let i = 0; i < values.length; i++) {
      if (!otherSet.has(values[i])) {
        return false;
      }
    }
    return true;
  }
}

const setA = new _Set([1, 2, 3]);
const setB = new _Set([4, 5, 6]);
setA.union(setA);
