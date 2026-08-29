const https = require('https');
const fs = require('fs');
function get(url) {
  return new Promise((res) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }, timeout: 30000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => { console.log(r.statusCode, url); console.log(d.slice(0, 1500)); res(); });
    }).on('error', (e) => { console.log('ERR', e.message); res(); });
  });
}
(async () => {
  await get('https://gupiao.yaozhineng.com/');
  await get('https://gupiao.yaozhineng.com/index.html');
})();
