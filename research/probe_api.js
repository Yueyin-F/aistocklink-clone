const https = require('https');
const BASE = 'https://gupiao-api.yaozhineng.com';
const paths = [
  '/api/news/headlines',
  '/api/market/overview',
  '/api/news/cn',
  '/api/cn/stocks/000001/analysis',
  '/api/cn/stocks/600519/tenx-score',
  '/api/cn/stocks/600519/trend-score',
];
function get(p) {
  return new Promise((res) => {
    const req = https.get(BASE + p, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, timeout: 20000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        console.log('\n===== ' + p + ' [' + r.statusCode + '] =====');
        console.log(d.slice(0, 1500));
        res();
      });
    });
    req.on('error', (e) => { console.log('\n===== ' + p + ' ERROR =====\n' + e.message); res(); });
    req.on('timeout', () => { console.log('\n===== ' + p + ' TIMEOUT ====='); req.destroy(); res(); });
  });
}
(async () => {
  for (const p of paths) await get(p);
})();
