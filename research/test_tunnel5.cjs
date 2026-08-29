const https = require('https');
const base = 'https://cd517ac187835d3f-223-99-205-222.serveousercontent.com';
function get(p, timeout = 90000) {
  return new Promise((res) => {
    const req = https.get(base + p, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Encoding': 'gzip' }, timeout }, (r) => {
      let len = 0;
      r.on('data', (c) => (len += c.length));
      r.on('end', () => {
        console.log(p, '->', r.statusCode, len, 'B', r.headers['content-encoding'] ? '(gzip)' : '');
        res();
      });
      r.on('error', (e) => { console.log(p, 'STREAM ERR', e.message); res(); });
    });
    req.on('error', (e) => { console.log(p, 'REQ ERR', e.message); res(); });
    req.on('timeout', () => { console.log(p, 'TIMEOUT'); req.destroy(); res(); });
  });
}
(async () => {
  await get('/');
  await get('/api/news/headlines');
  await get('/api/cn/wind-leaders?limit=4');
  await get('/api/cn/index/quotes?symbols=000001,399001,399006');
  await get('/assets/app.js');
  await get('/assets/chunk-index-DR3rYEM4.js');
  await get('/kronos/api/v1/cache?symbol=600519');
  console.log('ALL DONE');
})();
