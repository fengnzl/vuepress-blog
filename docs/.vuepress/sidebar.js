const { vueSidebar, dailyLearnSidebar, wxTpFullstackSidebar } = require('../daily-learn/sidebar');
const { CSBasicSidebar } = require('../cs-basic/sidebar');
const { translationWeeklySidebar } = require('../translation-weekly/sidebar');


module.exports = {
  '/daily-learn/vue/': vueSidebar,
  '/daily-learn/PHP/wx-tp-fullstack/': wxTpFullstackSidebar,
  '/daily-learn/': dailyLearnSidebar,
  '/cs-basic/': CSBasicSidebar,
  '/translation-weekly/': translationWeeklySidebar,
}