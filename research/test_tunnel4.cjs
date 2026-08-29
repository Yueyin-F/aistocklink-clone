// 复测：本地 gzip 大小 + 公网隧道大文件传输
const http = require('http');
const https = require('https');

function local(p) {
  return new Promise((res) => {
    http.get('http://127.0.0.1:4173' + p, { headers: { 'Accept-Encoding': 'gzip' } }, (r) => {
      let len = 0;
      r.on('data', (c) => (len += c.length));
      r.on('end', () => {
        console.log('本地', p, '->', r.statusCode, '编码:', r.headers['content-encoding'] || '无', '传输', len, 'B');
        res();
      });
    }).on('error', (e) => { console.log('本地ERR', p, e.message); res(); });
  });
}

const base = 'https://9277c2c0c1a74087-223-99-205-222.serveousercontent.com';
function tunnel(p, timeout = 120000) {
  return new Promise((res) => {
    const req = https.get(base + p, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Encoding': 'gzip, deflate' }, timeout }, (r) => {
      let len = 0;
      r.on('data', (c) => (len += c.length));
      r.on('end', () => {
        console.log('隧道', p, '->', r.statusCode, '编码:', r.headers['content-encoding'] || '无', '传输', len, 'B');
        res();
      });
      r.on('error', (e) => { console.log('隧道STREAM', p, e.message); res(); });
    });
    req.on('error', (e) => { console.log('隧道REQ', p, e.message); res(); });
    req.on('timeout', () => { console.log('隧道TIMEOUT', p); req.destroy(); res(); });
  });
}

(async () => {
  await local('/assets/app.js');
  await local('/assets/chunk-index-DR3rYEM4.js');
  await local('/api/news/headlines');
  console.log('--- 公网隧道 ---');
  await tunnel('/assets/app.js');
  await tunnel('/assets/chunk-index-DR3rYEM4.js');
  await tunnel('/');
  console.log('DONE');
})();
