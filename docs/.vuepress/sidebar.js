const { vueGroundUpSidebar, dailyLearnSidebar, wxTpFullstackSidebar, vueSourceCodeAnalysisSidebar } = require('../daily-learn/sidebar');
const { CSBasicSidebar } = require('../cs-basic/sidebar');
const { translationWeeklySidebar } = require('../translation-weekly/sidebar');


module.exports = {
  '/daily-learn/vue/ground-up/': vueGroundUpSidebar,
  '/daily-learn/vue/sourcecode-analysis/': vueSourceCodeAnalysisSidebar,
  '/daily-learn/PHP/wx-tp-fullstack/': wxTpFullstackSidebar,
  '/daily-learn/': dailyLearnSidebar,
  '/cs-basic/': CSBasicSidebar,
  '/translation-weekly/': translationWeeklySidebar,
}