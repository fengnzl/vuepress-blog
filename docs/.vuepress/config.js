const nav = require('./nav');
const sidebar = require('./sidebar');
const plugins = require('./plugin');

module.exports = {
  title: '城南花已开',
  description: '所爱隔山海，城南花已开',
  base: '/',
  dest: 'dist',
  head: [
    ['link', { rel: 'icon', href: `/assets/logo.ico` }],
  ],
  markdown: {
    lineNumbers: true // 代码块显示行号
  },
  themeConfig: {
    nav,
    sidebar,
    editLinkText: '在 GitHub 上编辑此页',
    repo: 'recoveryMonster',
    logo: '/assets/logo.png',
    docsDir: 'docs',
    lastUpdated: '上次更新',
    searchMaxSuggestoins: 10,
    sidebarDepth: 2
  },
  plugins,
}