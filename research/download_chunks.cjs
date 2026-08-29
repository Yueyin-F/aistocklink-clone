const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://gupiao.yaozhineng.com';
const outDir = 'C:/Users/28129/Desktop/项目/aistocklink-clone/research/chunks';
fs.mkdirSync(outDir, { recursive: true });

const files = [
  // 板块相关 chunk
  '/201.667dba8d.js',        // Home 依赖
  '/219.3e2b2322.js',        // Home 依赖
  '/226.49ad608a.js',        // Home 依赖
  '/chunk-echarts.740fa5cd.js', // 227
  '/712.f023ecd6.js',        // TagView 依赖
  '/604.c5e95ed7.js',        // eventList 依赖
  '/809.601525ea.js',        // eventDetail 依赖
  '/721.221e0da1.js',        // stockIntel
  '/939.48aa8c0d.js',        // hotBurst
  '/304.97f536e2.js',        // trendScore
  '/333.10b23282.js',        // tenxScore
  '/703.4b165d33.js',        // forecast
  '/981.2f2afd50.js',        // pushHistory
  '/344.5ac3df06.js',        // stockDetail 依赖
  '/740.8fbbf0b5.js',        // stockDetail 依赖
  '/572.d57ac8a7.js',        // login 依赖
  '/247.41749f9d.js',        // profile 依赖
  '/743.aa58e2e4.js',        // search 依赖
  '/182.88dcbdf9.js',        // favorites 依赖
  '/209.b81587aa.js',        // wechat msg 依赖
  '/928.1ee46291.js',        // update-logs 依赖
  '/605.ec0e812c.js',        // download 依赖
  '/67.5f0cf534.js',         // download 依赖
  '/47.3f9c5632.js',
  '/92.7949128d.js',         // trend report
  // 233 候选
  '/233.js',
  '/chunk-elementPlus.ae81fda2.js',
];

function get(url, dest) {
  return new Promise((res) => {
    const req = https.get(BASE + url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume();
        return get(new URL(r.headers.location, BASE + url).href.replace(BASE, ''), dest).then(res);
      }
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => {
        const b = Buffer.concat(chunks);
        if (r.statusCode === 200 && b.length > 500) {
          fs.writeFileSync(dest, b);
          console.log(path.basename(url) + ': ' + r.statusCode + ' ' + b.length + ' bytes');
        } else {
          console.log(path.basename(url) + ': ' + r.statusCode + ' (' + b.length + 'B) SKIP');
        }
        res();
      });
    });
    req.on('error', (e) => { console.log(url + ' ERR ' + e.message); res(); });
    req.on('timeout', () => { console.log(url + ' TIMEOUT'); req.destroy(); res(); });
  });
}

(async () => {
  for (const f of files) {
    await get(f, path.join(outDir, path.basename(f)));
  }
})();
