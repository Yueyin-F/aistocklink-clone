const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://gupiao.yaozhineng.com';
const outDir = 'C:/Users/28129/Desktop/项目/aistocklink-clone/research/chunks';
fs.mkdirSync(outDir, { recursive: true });

const files = [
  '/chunk-elementPlus.65ebf8be.js',
  '/553.b07ded62.js', '/596.834e0990.js', '/919.731c68bf.js',   // home
  '/52.d6d88923.js',                                            // TagView
  '/722.c4a18c17.js',                                           // eventList
  '/544.9e6a07fc.js',                                           // eventDetail
  '/219.77d08a02.js',                                           // hotBurst
  '/490.81ca643f.js',                                           // stockIntel
  '/85.4f084124.js',                                            // trendScore dep
  '/517.b03b2235.js',                                           // tenx
  '/228.4c02953b.js',                                           // pushHistory
  '/313.658759c0.js', '/368.7279b441.js',                       // stockDetail
  '/657.eca1463a.js',                                           // forecast
  '/chunk-echarts.6ef4fa2e.js',                                 // 227
  // CSS
  '/css/919.5a6b21ff.css', '/css/52.b7d1d075.css', '/css/722.a412148c.css',
  '/css/544.33c731a8.css', '/css/219.28ef3a78.css', '/css/490.1fa55c71.css',
  '/css/85.a814edfa.css', '/css/517.4c346c7c.css', '/css/228.f1e1a526.css',
  '/css/368.7cc4aab5.css', '/css/657.d987f5b9.css', '/css/50.473f1ea5.css',
];

function get(url, dest) {
  return new Promise((res) => {
    const req = https.get(BASE + url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }, timeout: 60000 }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => {
        const b = Buffer.concat(chunks);
        if (r.statusCode === 200 && b.length > 500) {
          fs.writeFileSync(dest, b);
          console.log(path.basename(url) + ': ' + b.length + ' bytes');
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
