const https = require('https');
const BASE = 'https://gupiao-api.yaozhineng.com';
const paths = [
  '/api/cn/stock/quotes/kline?symbol=600519&period=day&limit=10',
  '/api/cn/stocks/600519/news?limit=3&lastTime=0',
  '/api/cn/stocks/600519/capital-flow',
  '/api/cn/stocks/600519/semi-annual-report',
  '/api/cn/stocks/600519/annual-financial',
  '/api/cn/stock/600519/profit-forecast',
  '/api/cn/stocks/600519/analysis/history?page=1&pageSize=3',
  '/api/cn/wind-leaders?limit=1',
  '/api/cn/hot-keywords?hours=6&limit=3',
  '/api/cn/institution-research/latest',
  '/api/cn/stock-monitors/stats',
  '/api/cn/stock-monitors/events?cycle=daily&limit=3',
  '/api/cn/stocks?keyword=茅台&pageSize=3',
];
function get(p) {
  return new Promise((res) => {
    const req = https.get(BASE + p, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 25000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        console.log('\n===== ' + p + ' [' + r.statusCode + '] =====');
        console.log(d.slice(0, 900));
        res();
      });
    });
    req.on('error', (e) => { console.log('\n===== ' + p + ' ERROR =====\n' + e.message); res(); });
    req.on('timeout', () => { console.log('\n===== ' + p + ' TIMEOUT ====='); req.destroy(); res(); });
  });
}
(async () => { for (const p of paths) await get(p); })();
