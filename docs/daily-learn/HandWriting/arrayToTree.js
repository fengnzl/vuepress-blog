const data = [
  // 注意这里，专门把pid为1的元素放一个在前面
  { id: 2, name: "部门2", pid: 1 },
  { id: 1, name: "部门1", pid: 0 },
  { id: 3, name: "部门3", pid: 1 },
  { id: 4, name: "部门4", pid: 3 },
  { id: 5, name: "部门5", pid: 4 },
  { id: 7, name: "部门7", pid: 6 },
];

function arrayToTree(data) {
  const idObject = data.reduce((prev, cur) => {
    cur.children = [];
    prev[cur.id] = cur;
    return prev;
  }, {});
  const res = [];
  data.forEach((item) => {
    if (item.pid && idObject[item.pid]) {
      idObject[item.pid].children.push(item);
    } else {
      res.push(item);
    }
  });
  return res;
}
console.log(JSON.stringify(arrayToTree(data), null, 2));
/*
[
  {
    "id": 1,
    "name": "部门1",
    "pid": 0,
    "children": [
      {
        "id": 2,
        "name": "部门2",
        "pid": 1,
        "children": []
      },
      {
        "id": 3,
        "name": "部门3",
        "pid": 1,
        "children": [
          {
            "id": 4,
            "name": "部门4",
            "pid": 3,
            "children": [
              {
                "id": 5,
                "name": "部门5",
                "pid": 4,
                "children": []
              }
            ]
          }
        ]
      }
    ]
  }
] 
*/
