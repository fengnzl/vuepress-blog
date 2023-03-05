const argv = process.argv.slice(2)
const appInfo = argv.reduce((prev, cur) => {
  const info = cur.split('=')
  if (info.length !== 2) {
    return prev
  }
  prev[info[0]] = info[1]
  return prev
}, {})
module.exports = [
  '@vuepress/back-to-top',
  '@vuepress/nprogress',
  [
    'vuepress-plugin-comment',
    {
      choosen: 'valine',
      // options选项中的所有参数，会传给Valine的配置
      options: {
        el: '#valine-vuepress-comment',
        appId: appInfo.COMMENT_APP_ID,
        appKey: appInfo.COMMENT_APP_KEY
      }
    }
  ]
]