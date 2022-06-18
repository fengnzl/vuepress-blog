const arr = [1, [2, [7, [4, 5]]], 6];

function flatArr(arr) {
  return arr.reduce((prev, cur) => {
    if (Array.isArray(cur)) {
      prev.push(...flatArr(cur));
    } else {
      prev.push(cur);
    }
    return prev;
  }, []);
}
function flatArr2(arr) {
  const result = [];
  for (let val of arr) {
    if (Array.isArray(val)) {
      result.push(...flatArr2(val));
    } else {
      result.push(val);
    }
  }
  return result;
}
function* flatArr3(arr) {
  for (const item of arr) {
    if (Array.isArray(item)) {
      yield* flatArr3(item);
    } else {
      yield item;
    }
  }
}

console.log(arr.flat(Infinity));
console.log(
  arr
    .toString()
    .split(",")
    .map((item) => +item)
);
console.log(flatArr(arr));
console.log(flatArr2(arr));
console.log([...flatArr3(arr)]);
