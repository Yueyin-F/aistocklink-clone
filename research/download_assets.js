const https = require('https');
const fs = require('fs');
const path = require('path');

const base = 'https://gupiao.yaozhineng.com';
const files = [
  '/img/logo.c2355390.png',
  '/img/jnu-logo.4e96132a.svg',
  '/img/default-avatar.e709af70.svg',
  '/img/menu.3035aacc.svg',
  '/favicon.ico',
];
const outDir = 'C:/Users/28129/Desktop/项目/aistocklink-clone/public/img';
fs.mkdirSync(outDir, { recursive: true });

function get(url, dest) {
  return new Promise((res) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume();
        get(new URL(r.headers.location, url).href, dest).then(res);
        return;
      }
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => {
        const b = Buffer.concat(chunks);
        fs.writeFileSync(dest, b);
        console.log(dest.split('/').pop() + ': ' + r.statusCode + ' ' + b.length + ' bytes');
        res();
      });
    });
    req.on('error', (e) => { console.log(url + ' ERR ' + e.message); res(); });
  });
}

(async () => {
  for (const f of files) {
    const name = path.basename(f);
    const dest = name === 'favicon.ico' ? 'C:/Users/28129/Desktop/项目/aistocklink-clone/public/favicon.ico' : path.join(outDir, name);
    await get(base + f, dest);
  }
})();
