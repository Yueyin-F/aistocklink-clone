const https = require('https');
const base = 'https://9277c2c0c1a74087-223-99-205-222.serveousercontent.com';
function get(p) {
  return new Promise((res) => {
    https.get(base + p, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 60000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        console.log(p, '->', r.statusCode, d.length, 'B |', d.slice(0, 80).replace(/\n/g, ' '));
        res();
      });
    }).on('error', (e) => { console.log(p, 'ERR', e.message); res(); });
  });
}
(async () => {
  await get('/api/news/headlines');
  await get('/api/cn/index/quotes?symbols=000001,399001,399006');
  await get('/assets/app.js');
  await get('/stock/600519');
  await get('/kronos/api/v1/cache?symbol=600519');
})();
