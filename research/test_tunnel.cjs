const https = require('https');
const url = 'https://9277c2c0c1a74087-223-99-205-222.serveousercontent.com/';
https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 60000 }, (r) => {
  let d = '';
  r.on('data', (c) => (d += c));
  r.on('end', () => {
    console.log('STATUS', r.statusCode);
    console.log('LEN', d.length);
    console.log('IS_APP:', d.includes('股票资讯AI智能分析') || d.includes('app.js') || d.includes('<div id="app">'));
    console.log(d.slice(0, 400));
  });
}).on('error', (e) => { console.log('ERR', e.message); process.exit(1); });
