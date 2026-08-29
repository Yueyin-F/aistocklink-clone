const https = require('https');
const BASE = 'https://gupiao-api.yaozhineng.com';
const paths = [
  '/api/cn/tags/创新药/leaders?limit=5&cycle=weekly',
  '/api/kg/concepts',
  '/api/potential-stocks/push-ranking?limit=5',
  '/api/potential-stocks/push-history?limit=5',
  '/api/logs/types',
  '/api/logs?page=1&per_page=3',
  '/api/config/public',
  '/api/news/hk',
  '/api/news/gb',
  '/api/cn/stock/quotes/realtime?symbols=600519',
  '/api/cn/stock/fundamentals?symbols=600519',
];
function get(p) {
  return new Promise((res) => {
    const req = https.get(BASE + p, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        console.log('\n===== ' + p + ' [' + r.statusCode + '] =====');
        console.log(d.slice(0, 700));
        res();
      });
    });
    req.on('error', (e) => { console.log('\n===== ' + p + ' ERROR =====\n' + e.message); res(); });
    req.on('timeout', () => { console.log('\n===== ' + p + ' TIMEOUT ====='); req.destroy(); res(); });
  });
}
(async () => { for (const p of paths) await get(p); })();
