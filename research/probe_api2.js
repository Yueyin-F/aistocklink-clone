const https = require('https');
const BASE = 'https://gupiao-api.yaozhineng.com';
const paths = [
  '/api/cn/stock/infos?symbols=600519,000001',
  '/api/cn/stock/quotes/core?symbols=600519,000001',
  '/api/cn/stock/quotes/activity?symbols=600519',
  '/api/cn/stocks/profit-forecast?page=1&limit=10',
  '/api/cn/stocks/tenx-score/top?limit=5',
  '/api/cn/stocks/trend-score/top?limit=5',
  '/api/cn/hot-keywords?hours=6&limit=10',
  '/api/cn/wind-leaders?limit=5',
  '/api/market/overview',
  '/api/cn/index/quotes?symbols=000001,399001,399006',
];
function get(p) {
  return new Promise((res) => {
    const req = https.get(BASE + p, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, timeout: 25000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        console.log('\n===== ' + p + ' [' + r.statusCode + '] =====');
        console.log(d.slice(0, 1200));
        res();
      });
    });
    req.on('error', (e) => { console.log('\n===== ' + p + ' ERROR =====\n' + e.message); res(); });
    req.on('timeout', () => { console.log('\n===== ' + p + ' TIMEOUT ====='); req.destroy(); res(); });
  });
}
(async () => { for (const p of paths) await get(p); })();
