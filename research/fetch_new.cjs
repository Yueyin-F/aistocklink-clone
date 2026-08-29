const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://gupiao.yaozhineng.com';
const outDir = 'C:/Users/28129/Desktop/项目/aistocklink-clone/research';
const files = ['/app.e4908cf6.js', '/css/app.2e0292e0.css'];

function get(url, dest) {
  return new Promise((res) => {
    https.get(BASE + url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }, timeout: 60000 }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => {
        const b = Buffer.concat(chunks);
        fs.writeFileSync(dest, b);
        console.log(url, r.statusCode, b.length);
        res();
      });
    }).on('error', (e) => { console.log('ERR', url, e.message); res(); });
  });
}

(async () => {
  await get(files[0], path.join(outDir, 'site_app_new.js'));
  await get(files[1], path.join(outDir, 'site_app_new.css'));
  // 提取 chunk map
  const a = fs.readFileSync(path.join(outDir, 'site_app_new.js'), 'utf8');
  const i = a.indexOf('o.u=e=>');
  if (i >= 0) {
    const m = a.slice(i, i + 1200).match(/\+"\.(\{[\s\S]*?)\}\[e\]\+"\.js"/);
    console.log('\nCHUNK MAP:\n' + (m ? m[1] : a.slice(i, i + 1000)));
  }
  // 提取路由组件引用
  const seg = a.slice(a.indexOf('se=[{path:"/"'), a.indexOf('{path:"/"') + 2500);
  console.log('\nROUTES (truncated):\n' + seg.replace(/\s+/g, ' ').slice(0, 1600));
})();
