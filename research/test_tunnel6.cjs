const https = require('https');
const urls = [
  'https://a3f9c34fbcf71932-223-99-205-222.serveousercontent.com/',
  'https://c763152ea4f55c.lhr.life/',
];
function test(u, tries) {
  return new Promise((res) => {
    let done = 0, ok = 0;
    for (let i = 0; i < tries; i++) {
      https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 25000 }, (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => {
          done++;
          if (r.statusCode === 200 && d.includes('股票资讯AI智能分析')) ok++;
          if (done === tries) { console.log(u, `-> ${ok}/${tries} 成功`); res(); }
        });
      }).on('error', (e) => {
        done++;
        if (done === tries) { console.log(u, `-> ${ok}/${tries} 成功 (ERR ${e.message.slice(0, 40)})`); res(); }
      });
    }
  });
}
(async () => {
  await test(urls[0], 3);
  await test(urls[1], 3);
  // API 数据经隧道
  await new Promise((res) => {
    https.get('https://c763152ea4f55c.lhr.life/api/news/headlines', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => { console.log('localhost.run API:', r.statusCode, d.slice(0, 60)); res(); });
    }).on('error', (e) => { console.log('localhost.run API ERR', e.message); res(); });
  });
})();
