const https = require('https');
const BASE = 'https://yingfeng64-kronos-api.hf.space';
function get(p) {
  return new Promise((res) => {
    const req = https.get(BASE + p, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        console.log('\n===== ' + p + ' [' + r.statusCode + '] =====');
        console.log(d.slice(0, 1200));
        res();
      });
    });
    req.on('error', (e) => { console.log('ERR', p, e.message); res(); });
    req.on('timeout', () => { console.log('TIMEOUT', p); req.destroy(); res(); });
  });
}
(async () => {
  await get('/api/v1/cache?symbol=600519');
  await get('/api/v1/cache?symbol=000001');
})();
