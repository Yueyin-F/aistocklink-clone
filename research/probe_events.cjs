const https = require('https');
const BASE = 'https://gupiao-api.yaozhineng.com';
function get(p) {
  return new Promise((res) => {
    const req = https.get(BASE + p, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        console.log('\n===== ' + p + ' [' + r.statusCode + '] =====');
        console.log(d.slice(0, 1500));
        res();
      });
    });
    req.on('error', (e) => { console.log('ERR', e.message); res(); });
    req.on('timeout', () => { req.destroy(); res(); });
  });
}
(async () => {
  await get('/api/agent/event/list?page=1&pageSize=3');
  await get('/api/agent/event/list?page=1&pageSize=1');
})();
