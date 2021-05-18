const dailyLearnSidebar = [
  {
    title: "JavaScript",
    children: [
      "JavaScript/call-apply-bind-simulator",
      "JavaScript/commonModule-vs-ESM",
      "JavaScript/learn-closure",
      "JavaScript/learn-functional",
      "JavaScript/let-var-const",
      "JavaScript/konwledge-point",
      "JavaScript/browser-relevant",
    ],
  },
  {
    title: "Vue",
    children: [
      "vue/",
      ["vue/ground-up/", "From the Ground Up"],
      ["vue/sourcecode-analysis/prepare/", "2.X 源码学习"],
      "vue/componentChange",
    ],
  },
  {
    title: "CSS",
    children: [
      "CSS/make-talkbubble",
      "CSS/content-ellipsis",
      "CSS/context-center",
      "CSS/css-secrets1",
    ],
  },
  {
    title: "PHP",
    children: [
      "PHP/tp51-timestamp-autosave",
      "PHP/typedance-pay-mini",
      "PHP/tecent-SMS-verify",
      "PHP/restore-mysql-by-history",
      ["PHP/wx-tp-fullstack/first", "微信小程序商城构建全栈应用"],
    ],
  },
  {
    title: "Git",
    children: ["Git/git-des", "Git/git-time-machine"],
  },
  {
    title: "Scaffold",
    children: [
      "Scaffold/Introduction",
      "Scaffold/LernaAndYargs",
      'Scaffold/Prepare'
    ],
  },
];

const vueGroundUpSidebar = [
  {
    title: "From the Ground Up",
    children: [
      ["", "Introduction"],
      "reactivity",
      "render-fun",
      "vuex-simulator",
      "vue-router-hash",
      "form-validate",
    ],
  },
];

const wxTpFullstackSidebar = [
  {
    title: "微信小程序商城构建全栈应用",
    children: [
      "first",
      "second",
      "third",
      "fourth",
      "fifth",
      "sixth",
      "seventh",
    ],
  },
];

const vueSourceCodeAnalysisSidebar = [
  {
    title: "准备工作",
    collapsable: false,
    children: [["prepare/", "Introduction"], "prepare/flow", "prepare/rollup"],
  },
  {
    title: "架构设计",
    collapsable: false,
    children: ["architect/architecture-design"],
  },
  {
    title: "从入口到整体流程",
    collapsable: false,
    children: [
      ["entryMount/all-flow", "整体流程"],
      ["entryMount/init-mixin", "initMixin 流程"],
      ["entryMount/state-mixin", "stateMixin 流程"],
      ["entryMount/events-mixin", "eventsMixin 流程"],
      ["entryMount/lifecycle-mixin", "lifecycleMixin 流程"],
      ["entryMount/others", "其它流程"],
    ],
  },
  {
    title: "响应式原理",
    collapsable: false,
    children: [
      "reactive/prepare",
      "reactive/getters",
      "reactive/setters",
      "reactive/nextTick",
      "reactive/reactiveAPI",
      "reactive/computed",
    ],
  },
];

module.exports = {
  dailyLearnSidebar,
  vueGroundUpSidebar,
  wxTpFullstackSidebar,
  vueSourceCodeAnalysisSidebar,
};
