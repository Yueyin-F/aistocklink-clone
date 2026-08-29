// 尝试多个 cloudflared 镜像下载（GitHub 官方源被网络屏蔽时的备用通道）
const https = require('https');
const fs = require('fs');
const dest = 'C:/Users/28129/Desktop/项目/cloudflared.exe';

const sources = [
  'https://ghproxy.com/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe',
  'https://mirror.ghproxy.com/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe',
  'https://ghfast.top/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe',
  'https://github.moeyy.xyz/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe',
];

function trySource(i) {
  if (i >= sources.length) {
    console.log('ALL_MIRRORS_FAILED');
    process.exit(2);
  }
  const url = sources[i];
  console.log(`[${i + 1}/${sources.length}] ${url.slice(0, 80)}...`);
  const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 90000 }, (r) => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
      console.log('  redirect:', r.headers.location.slice(0, 90));
      r.resume();
      const loc = r.headers.location;
      https.get(loc, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 90000 }, (r2) => {
        if (r2.statusCode !== 200) { console.log('  status', r2.statusCode); r2.resume(); return trySource(i + 1); }
        let len = 0;
        const ws = fs.createWriteStream(dest);
        r2.on('data', (c) => (len += c.length));
        r2.pipe(ws);
        ws.on('finish', () => { console.log('OK downloaded', len, 'bytes'); fs.chmodSync(dest, 0o755); process.exit(0); });
      }).on('error', (e) => { console.log('  ERR2', e.message); trySource(i + 1); });
      return;
    }
    if (r.statusCode !== 200) { console.log('  status', r.statusCode); r.resume(); return trySource(i + 1); }
    let len = 0;
    const ws = fs.createWriteStream(dest);
    r.on('data', (c) => (len += c.length));
    r.pipe(ws);
    ws.on('finish', () => { console.log('OK downloaded', len, 'bytes'); fs.chmodSync(dest, 0o755); process.exit(0); });
  });
  req.on('error', (e) => { console.log('  ERR', e.message); trySource(i + 1); });
  req.on('timeout', () => { console.log('  TIMEOUT'); req.destroy(); trySource(i + 1); });
}

trySource(0);
