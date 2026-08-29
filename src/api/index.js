import axios from 'axios'

// 本地开发经 Vite 代理转发到真实后端 gupiao-api.yaozhineng.com
const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Kronos AI 价格预测后端（经本地代理转发）
const kronos = axios.create({
  baseURL: '/kronos',
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
)

// 通用解包: { code, message, data }
function unwrap(promise) {
  return promise.then((res) => {
    const body = res.data
    if (body && typeof body === 'object' && 'code' in body && body.code !== 200) {
      throw new Error(body.message || '请求失败')
    }
    return body?.data !== undefined ? body.data : body
  })
}

export const api = {
  // ===== 新闻 =====
  getHeadlines: () => unwrap(client.get('/news/headlines')),
  getNews: (cat) => unwrap(client.get(`/news/${cat}`)),
  getNewsCn: () => unwrap(client.get('/news/cn')),
  getNewsHk: () => unwrap(client.get('/news/hk')),
  getNewsGb: () => unwrap(client.get('/news/gb')),

  // ===== 股票 =====
  searchStocks: (keyword, pageSize = 20) =>
    unwrap(client.get(`/cn/stocks?keyword=${encodeURIComponent(keyword)}&pageSize=${pageSize}`)),
  getStockInfos: (symbols) => unwrap(client.get(`/cn/stock/infos?symbols=${symbols}`)),
  getStockQuotesCore: (symbols) => unwrap(client.get(`/cn/stock/quotes/core?symbols=${symbols}`)),
  getStockQuotesActivity: (symbols) => unwrap(client.get(`/cn/stock/quotes/activity?symbols=${symbols}`)),
  getStockQuotesRealtime: (symbols) => unwrap(client.get(`/cn/stock/quotes/realtime?symbols=${symbols}`)),
  getStockFundamentals: (symbols) => unwrap(client.get(`/cn/stock/fundamentals?symbols=${symbols}`)),
  getKline: (params) => unwrap(client.get('/cn/stock/quotes/kline', { params })),
  getSemiAnnualReport: (code) => unwrap(client.get(`/cn/stocks/${code}/semi-annual-report`)),
  getAnnualFinancial: (code) => unwrap(client.get(`/cn/stocks/${code}/annual-financial`)),
  getCapitalFlow: (code) => unwrap(client.get(`/cn/stocks/${code}/capital-flow`)),
  getStockNews: (code, limit = 5, lastTime = 0) =>
    unwrap(client.get(`/cn/stocks/${code}/news?limit=${limit}&lastTime=${lastTime}`)),

  // ===== AI 分析 =====
  getAnalysis: (code) => unwrap(client.get(`/cn/stocks/${code}/analysis`)),
  getAnalysisHistory: (page = 1, pageSize = 20) =>
    unwrap(client.get(`/cn/stocks/analysis/history?page=${page}&pageSize=${pageSize}`)),
  getAgentReport: (stock, time) => unwrap(client.get(`/agent/report/${encodeURIComponent(stock)}/${encodeURIComponent(time)}`)),

  // ===== Kronos AI 价格预测 =====
  getPricePredictionCache: (symbol) => kronos.get('/api/v1/cache', { params: { symbol } }).then((r) => r.data),
  createPricePrediction: ({ symbol, lookback = 256, predLen = 5, sampleCount = 30, mode = 'simple', includeVolume = false } = {}) =>
    kronos
      .post('/api/v1/predict', { symbol, lookback, pred_len: predLen, sample_count: sampleCount, mode, include_volume: includeVolume })
      .then((r) => r.data),
  getPricePredictionTask: (taskId) => kronos.get(`/api/v1/predict/${encodeURIComponent(taskId)}`).then((r) => r.data),

  // ===== 事件传导 (AI 事件) =====
  // 注意：agent 接口成功码为 0
  getEventList: ({ page = 1, pageSize = 10 } = {}) =>
    client.get('/agent/event/list', { params: { page, pageSize } }).then((res) => res.data?.data),
  getEventDetail: (eventId) =>
    client.get(`/agent/event/${encodeURIComponent(eventId)}`).then((res) => res.data?.data),

  // ===== 业绩预测 =====
  getProfitForecast: (params) => unwrap(client.get('/cn/stocks/profit-forecast', { params })),
  searchProfitForecast: (params) => unwrap(client.get('/cn/stocks/profit-forecast/search', { params })),
  getStockProfitForecast: (code) => unwrap(client.get(`/cn/stock/${code}/profit-forecast`)),

  // ===== 评分 =====
  getTenxScore: (code) => unwrap(client.get(`/cn/stocks/${code}/tenx-score`)),
  getTenxScoreHistory: (code, page = 1, pageSize = 20) =>
    unwrap(client.get(`/cn/stocks/${code}/tenx-score/history`, { params: { page, pageSize } })),
  refreshTenxScore: (code, mode) => unwrap(client.post(`/cn/stocks/${code}/tenx-score/refresh${mode ? `?mode=${mode}` : ''}`)),
  tenxVetoCheck: (code) => unwrap(client.get(`/cn/stocks/${code}/tenx-score/veto-check`)),
  getTenxTop: (limit = 30) => unwrap(client.get('/cn/stocks/tenx-score/top', { params: { limit } })),
  tenxBatch: (data) => unwrap(client.post('/cn/stocks/tenx-score/batch', data)),
  getTrendScore: (code) => unwrap(client.get(`/cn/stocks/${code}/trend-score`)),
  getTrendDetail: (code) => unwrap(client.get(`/cn/stocks/${code}/trend-score/detail`)),
  getTrendTop: (limit = 30) => unwrap(client.get('/cn/stocks/trend-score/top', { params: { limit } })),
  refreshTrendScore: (code) => unwrap(client.post(`/cn/stocks/${code}/trend-score/refresh`)),
  trendBatch: (data) => unwrap(client.post('/cn/stocks/trend-score/batch', data)),

  // ===== 板块/热点 =====
  getWindLeaders: (limit = 8) => unwrap(client.get('/cn/wind-leaders', { params: { limit } })),
  refreshWindLeaders: () => unwrap(client.post('/cn/wind-leaders/refresh')),
  getHotKeywords: (hours = 6, limit = 20) =>
    unwrap(client.get('/cn/hot-keywords', { params: { hours, limit } })),
  detectHotKeywords: () => unwrap(client.post('/cn/hot-keywords/detect')),
  getIndustryStocks: (code) => unwrap(client.get(`/kg/industry/${code}/stocks`)),
  getTagLeaders: (tagCode, params = {}) => unwrap(client.get(`/cn/tags/${encodeURIComponent(tagCode)}/leaders`, { params })),
  getIndustryHealth: (code) => unwrap(client.get(`/cn/industry/${encodeURIComponent(code)}/health`)),
  getResearchReports: (code) => unwrap(client.get(`/cn/research/${encodeURIComponent(code)}/reports`)),

  // ===== 机构调研 / 个股情报 =====
  getInstitutionResearch: (params) => unwrap(client.get('/cn/institution-research', { params })),
  getInstitutionResearchHistory: () => unwrap(client.get('/cn/institution-research/history')),
  getInstitutionResearchLatest: () => unwrap(client.get('/cn/institution-research/latest')),
  detectInstitutionResearch: () => unwrap(client.post('/cn/institution-research/detect')),

  // ===== 监控 / 事件 =====
  getMonitorStats: () => unwrap(client.get('/cn/stock-monitors/stats')),
  getMonitorEvents: ({ cycle = 'daily', change_type, limit = 20, offset = 0 } = {}) => {
    const p = new URLSearchParams({ cycle, limit: String(limit), offset: String(offset) })
    if (change_type) p.append('change_type', change_type)
    return unwrap(client.get(`/cn/stock-monitors/events?${p.toString()}`))
  },
  getStockMonitorEvents: (code, { cycle = 'daily', limit = 20 } = {}) =>
    unwrap(client.get(`/cn/stock-monitors/events/${encodeURIComponent(code)}?cycle=${cycle}&limit=${limit}`)),
  getFavoritesNews: ({ cycle = 'daily', change_type, limit = 20, offset = 0 } = {}) => {
    const p = new URLSearchParams({ cycle, limit: String(limit), offset: String(offset) })
    if (change_type) p.append('change_type', change_type)
    return unwrap(client.get(`/cn/favorites/news?${p.toString()}`))
  },

  // ===== 指数 =====
  getIndexQuotes: (symbols) => unwrap(client.get(`/cn/index/quotes?symbols=${symbols}`)),
  getGbIndexQuotes: (symbols) => unwrap(client.get(`/gb/index/quotes?symbols=${symbols}`)),
  getMarketOverview: () => unwrap(client.get('/market/overview')),

  // ===== 用户 =====
  getUserInfo: () => unwrap(client.get('/users/me')),
  getFavorites: () => unwrap(client.get('/users/me/favorites')),
  addFavorite: (data) => unwrap(client.post('/users/me/favorites', data)),
  deleteFavorite: (data) => unwrap(client.post('/users/me/favorites/delete', data)),
  getPushSettings: () => unwrap(client.get('/users/me/settings')),
  getPushSetting: (key) => unwrap(client.get(`/users/me/settings/${encodeURIComponent(key)}`)),
  updatePushSetting: (key, data) => unwrap(client.put(`/users/me/settings/${encodeURIComponent(key)}`, data)),
  getWechatMessage: (msgid) => unwrap(client.get(`/wechat?msgid=${encodeURIComponent(msgid)}`)),
  getWechatScanUrl: () => unwrap(client.get('/auth/wechat/login/scan')),
  pollWechatScan: (state) => unwrap(client.get(`/auth/wechat/login/scan/poll?state=${state}`)),
  sendSmsCode: (data) => unwrap(client.post('/auth/sms/send', data)),
  smsLogin: (data) => unwrap(client.post('/auth/sms/login', data)),
  logout: () => unwrap(client.post('/auth/logout')),

  // ===== 推送历史 =====
  getPushHistory: (params) => unwrap(client.get('/potential-stocks/push-history', { params })),
  getPushRanking: (params) => unwrap(client.get('/potential-stocks/push-ranking', { params })),

  // ===== 更新日志 =====
  getLogTypes: () => unwrap(client.get('/logs/types')),
  getLogs: (params) => unwrap(client.get('/logs', { params })),
  getPublicConfig: () => unwrap(client.get('/config/public')),

  // ===== 知识图谱 =====
  getKgGraph: () => unwrap(client.get('/kg/graph')),
  getKgAiGraph: () => unwrap(client.get('/kg/ai-graph')),
  getKgSubgraph: (params) => unwrap(client.get('/kg/subgraph', { params })),
  getKgConcepts: () => unwrap(client.get('/kg/concepts')),
  refreshKg: () => unwrap(client.post('/kg/refresh')),
}

export default api
