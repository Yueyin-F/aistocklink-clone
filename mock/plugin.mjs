// Vite 开发插件：对真实后端不存在的接口提供本地 mock 兜底
const mocks = {
  '/api/market/overview': () => ({
    code: 200,
    message: 'success (mock)',
    data: {
      指数: [
        { 名称: '上证指数', 代码: '000001', 最新价: 3912.52, 涨跌幅: 0.59, 涨跌额: 23.08 },
        { 名称: '深证成指', 代码: '399001', 最新价: 13841.33, 涨跌幅: 0.69, 涨跌额: 95.46 },
        { 名称: '创业板指', 代码: '399006', 最新价: 3414.88, 涨跌幅: 0.51, 涨跌额: 17.36 },
      ],
      涨跌家数: { 上涨: 3126, 下跌: 1844, 平盘: 132 },
      两市成交额: '1.81万亿',
      更新时间: new Date().toLocaleString('zh-CN'),
    },
  }),
  '/api/cn/stocks/tenx-score/top': () => ({
    code: 200,
    message: 'success (mock)',
    data: [
      { symbol: '688498', name: '源杰科技', industry: '半导体', score: 83, label: 'A', expectedMultiple: '3-5倍', scoreDate: '2026-08-25T16:00:00.000Z', description: '十倍股候选：赛道景气度高，业绩兑现确定性较强。' },
      { symbol: '603268', name: '松发股份', industry: '船舶', score: 79, label: 'A', expectedMultiple: '3-5倍', scoreDate: '2026-08-25T16:00:00.000Z', description: '十倍股候选：技术面强势，基本面优秀。' },
      { symbol: '001337', name: '四川黄金', industry: '黄金', score: 79, label: 'A', expectedMultiple: '3-5倍', scoreDate: '2026-08-25T16:00:00.000Z', description: '十倍股候选：赛道景气度高，消息面催化强劲。' },
    ],
  }),
}

function send(res, obj, status = 200) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(obj))
}

export default function mockPlugin() {
  return {
    name: 'local-mock-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0]
        for (const [prefix, fn] of Object.entries(mocks)) {
          if (url.startsWith(prefix)) {
            return send(res, fn())
          }
        }
        next()
      })
    },
  }
}
