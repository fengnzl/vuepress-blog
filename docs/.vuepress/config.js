module.exports = {
  title: 'Vue-learn',
  description: '用于记录平时学习Vue的日常',
  base: '/vue-learn/',
  dest: 'dist',
  head: [
    ['link', { rel: 'icon', href: `/assets/logo.ico` }],
  ],
  markdown: {
    lineNumbers: true // 代码块显示行号
  },
  themeConfig: {
    logo: '/assets/logo.png',
    docsDir: 'docs',
    lastUpdated: '上次更新',
    nav: [
      { text: 'Vue日常学习', link: '/dailyLearn/ground-up/' },
      { text: '源码学习', link: '/sourceLearn/' },
      { text: 'vue-demo', link: '/VueDemo/' },
      {
        text: 'Github',
        link: 'https://github.com/recoveryMonster',
        target: '_blank'
      }
    ],
    sidebar: {
      '/dailyLearn/': [
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
      ]
    }
  },
}