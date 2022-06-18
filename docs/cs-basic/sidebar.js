const CSBasicSidebar = [
  {
    title: "数据结构与算法",
    children: [
      "data-structures/base-structures",
      {
        title: "two-pointers",
        children: [
          "data-structures/two-pointers/duplicate-zeros",
          "data-structures/two-pointers/detect-cycle",
          "data-structures/two-pointers/four-sum",
          "data-structures/two-pointers/sort-color",
        ],
      },
    ],
  },
  {
    title: "计算机基础",
    children: ["c-learn"],
  },
];

module.exports = {
  CSBasicSidebar
}