function isDeep(obj) {
  if (typeof obj !== "object" || obj == null) {
    return 1;
  }
  let depth = 0;
  // Object.values(obj).forEach((item) => (depth = Math.max(depth, isDeep(item))));
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      depth = Math.max(depth, isDeep(obj[key]))
    }
  }
  // 因为对象深度从 1 开始，所以需要 + 1
  return depth + 1;
}
let obj = {
  name: "abc",
  key: {
    name2: {
      name: "dd",
    },
  },
};
let obj2 = {
  name: "abc",
  key: {
    name2: {
      name: "dd",
    },
  },
  ybz: {
    xyk: 123,
    tdl: {
      wym: {
        xyw: 234,
        ss: {
          name: 1,
          age: {
            test: 2,
          },
        },
      },
      syd: 123,
      syh: [123456.23456, 2345],
    },
    cwj: 123,
  },
};
isDeep(obj); // 4
isDeep(obj2); // 7
isDeep(1); // 1
isDeep("1"); // 1
isDeep({ a: 1 }); // 2
isDeep({ a: [1, 2] }); // 3
isDeep({}); // 1
