// 下载 cloudflared（带重试；失败则提示备用方案）
const https = require('https');
const fs = require('fs');
const dest = 'C:/Users/28129/Desktop/项目/cloudflared.exe';

function attempt(tryNo) {
  const url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
  console.log(`尝试 ${tryNo}/3: ${url}`);
  const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' }, timeout: 180000 }, (r) => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
      console.log('-> redirect', r.headers.location.slice(0, 100));
      r.resume();
      const rurl = r.headers.location;
      https.get(rurl, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' }, timeout: 180000 }, (r2) => {
        if (r2.statusCode !== 200) {
          console.log('status', r2.statusCode);
          r2.resume();
          return retry(tryNo);
        }
        const ws = fs.createWriteStream(dest);
        let len = 0;
        r2.on('data', (c) => (len += c.length));
        r2.pipe(ws);
        ws.on('finish', () => {
          console.log('OK downloaded', len, 'bytes');
          fs.chmodSync(dest, 0o755);
          process.exit(0);
        });
      }).on('error', (e) => { console.log('ERR2', e.message); retry(tryNo); });
      return;
    }
    if (r.statusCode !== 200) {
      console.log('status', r.statusCode);
      r.resume();
      return retry(tryNo);
    }
    const ws = fs.createWriteStream(dest);
    let len = 0;
    r.on('data', (c) => (len += c.length));
    r.pipe(ws);
    ws.on('finish', () => {
      console.log('OK downloaded', len, 'bytes');
      fs.chmodSync(dest, 0o755);
      process.exit(0);
    });
  });
  req.on('error', (e) => { console.log('ERR', e.message); retry(tryNo); });
  req.on('timeout', () => { console.log('TIMEOUT'); req.destroy(); retry(tryNo); });
}

function retry(tryNo) {
  if (tryNo < 3) {
    setTimeout(() => attempt(tryNo + 1), 3000);
  } else {
    console.log('FAILED_ALL: 请改用备用方案 localtunnel / serveo（见部署方案.md 方案 E）');
    process.exit(2);
  }
}

attempt(1);
