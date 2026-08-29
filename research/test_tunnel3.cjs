const https = require('https');
const base = 'https://9277c2c0c1a74087-223-99-205-222.serveousercontent.com';
function get(p, timeout = 90000) {
  return new Promise((res) => {
    const req = https.get(base + p, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        console.log(p, '->', r.statusCode, d.length, 'B');
        res();
      });
      r.on('error', (e) => { console.log(p, 'STREAM ERR', e.message); res(); });
    });
    req.on('error', (e) => { console.log(p, 'REQ ERR', e.message); res(); });
    req.on('timeout', () => { console.log(p, 'TIMEOUT'); req.destroy(); res(); });
  });
}
(async () => {
  await get('/assets/app.js', 120000);
  await get('/stock/600519');
  await get('/kronos/api/v1/cache?symbol=600519');
  console.log('DONE');
})();
