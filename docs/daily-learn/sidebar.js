const dailyLearnSidebar = [
  {
    title: 'JavaScript',
    children: [
      'JavaScript/call-apply-bind-simulator',
      'JavaScript/commonModule-vs-ESM',
      'JavaScript/learn-closure',
      'JavaScript/learn-functional',
      'JavaScript/let-var-const',
    ]
  },
  {
    title: 'Vue',
    children: [
      ['vue/ground-up/', 'From the Ground Up'],
    ]
  },
  {
    title: 'CSS',
    children: [
      'CSS/make-talkbubble',
      'CSS/content-ellipsis',
      'CSS/context-center',
    ]
  },
  {
    title: 'PHP',
    children: [
      'PHP/tp51-timestamp-autosave',
      'PHP/typedance-pay-mini',
      'PHP/tecent-SMS-verify',
      'PHP/restore-mysql-by-history',
      ['PHP/wx-tp-fullstack/first', '微信小程序商城构建全栈应用']
    ]
  },
  {
    title: 'Git',
    children: [
      'Git/git-des',
      'Git/git-time-machine',
    ]
  },
];

const vueSidebar = [
  {
    title: 'From the Ground Up',
    children: [
      ['ground-up/', 'Introduction'],
      'ground-up/reactivity',
      'ground-up/render-fun',
      'ground-up/vuex-simulator',
      'ground-up/vue-router-hash',
      'ground-up/form-validate',
      'ground-up/i18n',
    ]
  },
];

const wxTpFullstackSidebar = [
  {
    title: '微信小程序商城构建全栈应用',
    children: [
      'first',
      'second',
      'third',
      'fourth',
      'fifth',
      'sixth',
      'seventh',
    ]
  },
];


module.exports = {
  dailyLearnSidebar,
  vueSidebar,
  wxTpFullstackSidebar
}