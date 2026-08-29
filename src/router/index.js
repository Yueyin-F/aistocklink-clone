import { createRouter, createWebHistory } from 'vue-router'

const T = (t) => `股票资讯AI智能分析 - ${t}`

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue'), meta: { title: T('首页') } },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { title: T('用户登录') } },
  { path: '/profile', name: 'Profile', component: () => import('../views/ProfileView.vue'), meta: { title: T('个人信息'), requiresAuth: true } },
  { path: '/search', name: 'search', component: () => import('../views/SearchView.vue'), meta: { title: T('股票搜索') } },
  { path: '/stock/:code', name: 'stockDetail', component: () => import('../views/StockDetailView.vue'), props: true, meta: { title: T('股票详情') } },
  { path: '/favorites', name: 'favorites', component: () => import('../views/FavoritesView.vue'), meta: { title: T('自选股'), requiresAuth: true } },
  { path: '/forecast', name: 'performanceForecast', component: () => import('../views/ForecastView.vue'), meta: { title: T('业绩预测') } },
  { path: '/tenx', name: 'tenxScore', component: () => import('../views/TenxView.vue'), meta: { title: T('十倍股评分') } },
  { path: '/trend', name: 'trendScore', component: () => import('../views/TrendView.vue'), meta: { title: T('趋势股评分') } },
  { path: '/trend/report', name: 'trendScoreReport', component: () => import('../views/TrendReportView.vue'), meta: { title: T('趋势股评分报告') } },
  { path: '/compare', name: 'stockCompare', component: () => import('../views/CompareView.vue'), meta: { title: T('个股对比') } },
  { path: '/monitor', redirect: '/hot-burst' },
  { path: '/hot-burst', name: 'hotBurst', component: () => import('../views/HotBurstView.vue'), meta: { title: T('机构调研推荐热门股') } },
  { path: '/stock-intel', name: 'stockIntel', component: () => import('../views/StockIntelView.vue'), meta: { title: T('自选股情报') } },
  { path: '/potential-push-history', name: 'potentialPushHistory', component: () => import('../views/PushHistoryView.vue'), meta: { title: T('长线风口龙头历史表现'), requiresAuth: true } },
  { path: '/wechat/:msgid', name: 'wechatMessage', component: () => import('../views/WechatMessageView.vue'), props: true, meta: { title: T('微信推送消息详情') } },
  { path: '/update-logs', name: 'updateLogs', component: () => import('../views/UpdateLogsView.vue'), meta: { title: T('更新日志') } },
  { path: '/download', name: 'download', component: () => import('../views/DownloadView.vue'), meta: { title: T('下载 App') } },
  { path: '/event', name: 'eventList', component: () => import('../views/EventListView.vue'), meta: { title: T('事件传导') } },
  { path: '/event/:id', name: 'eventDetail', component: () => import('../views/EventDetailView.vue'), meta: { title: T('AI事件分析') } },
  { path: '/tags/:tagCode', name: 'TagView', component: () => import('../views/TagView.vue'), meta: { title: T('板块龙头') } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = to.meta?.title || '股票资讯AI智能分析'
})

export default router
