import { defaultToString } from "../util.mjs";
import { ValuePair } from "../models/ValuePair.mjs";

export class Dictionary {
  constructor(toStrFn = defaultToString) {
    this.toStrFn = toStrFn;
    this.table = {};
  }

  has(key) {
    return this.table[this.toStrFn(key)] != null;
  }

  set(key, value) {
    if (key != null && value != null) {
      const tableKey = this.toStrFn(key);
      this.table[tableKey] = new ValuePair(key, value);
      return true;
    }
    return false;
  }

  get(key) {
    const valuePair = this.table[this.toStrFn(key)];
    return valuePair == null ? undefined : valuePair.value;
  }

  delete(key) {
    if (this.has(key)) {
      delete this.table[this.toStrFn(key)];
      return true;
    }
    return false;
  }

  keyValues() {
    return Object.values(this.table);
  }

  values() {
    return this.keyValues().map((valuePair) => valuePair.value);
  }

  keys() {
    return this.keyValues().map((valuePair) => valuePair.key);
  }

  forEach(cb) {
    const valuePairs = this.keyValues();
    for (let i = 0, len = valuePairs.length; i < len; i++) {
      const result = cb(valuePairs[i].key, valuePairs[i].value);
      if (result === false) {
        break;
      }
    }
  }

  size() {
    return this.keyValues().length;
  }

  isEmpty() {
    return this.size() === 0;
  }

  clear() {
    this.table = {};
  }

  toString() {
    if (this.isEmpty()) {
      return "";
    }

    const valuePairs = this.keyValues();
    let objString = `${valuePairs[0].toString()}`;
    for (let i = 1, len = valuePairs.length; i < len; i++) {
      objString = `${objString},${valuePairs[i].toString()}`;
    }
    return objString;
  }
}

var dictionary = new Dictionary();
dictionary.set("Gandalf", "gandalf@email.com");
dictionary.set("John", "johnsnow@email.com");
dictionary.set("Tyrion", "tyrion@email.com");
console.log(dictionary.has("Gandalf")); // true
console.log(dictionary.size()); // 3
console.log(dictionary.keys()); // ["Gandalf", "John", "Tyrion"]
console.log(dictionary.values()); // ["gandalf@email.com", "johnsnow@email.com", "tyrion@email.com"]
console.log(dictionary.get("Tyrion")); // tyrion@email.com
dictionary.delete("John");
console.log(dictionary.keys()); // ["Gandalf", "Tyrion"]
console.log(dictionary.values()); // ["gandalf@email.com", "tyrion@email.com"]
console.log(dictionary.keyValues());

// [
//  ValuePair { key: 'Gandalf', value: 'gandalf@email.com' },
//  ValuePair { key: 'Tyrion', value: 'tyrion@email.com' }
// ]
