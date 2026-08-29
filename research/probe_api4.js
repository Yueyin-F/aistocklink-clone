const https = require('https');
const BASE = 'https://gupiao-api.yaozhineng.com';
const paths = [
  '/api/cn/stock/quotes/kline?symbol=600519&klt=101&fqt=1&limit=30',
  '/api/cn/stock/quotes/kline?symbol=600519&klt=101&fqt=1&limit=30&startDate=20260101',
  '/api/cn/stocks/600519/capital-flow',
  '/api/cn/stocks/600519/semi-annual-report',
];
function get(p) {
  return new Promise((res) => {
    const req = https.get(BASE + p, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        console.log('\n===== ' + p + ' [' + r.statusCode + '] =====');
        console.log(d.slice(0, 600));
        res();
      });
    });
    req.on('error', (e) => { console.log('\n===== ' + p + ' ERROR =====\n' + e.message); res(); });
    req.on('timeout', () => { console.log('\n===== ' + p + ' TIMEOUT ====='); req.destroy(); res(); });
  });
}
(async () => { for (const p of paths) await get(p); })();
