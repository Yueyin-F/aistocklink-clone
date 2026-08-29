const https = require('https');
function get(url) {
  return new Promise((res) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/plain' }, timeout: 60000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => { console.log('STATUS ' + r.statusCode + ' LEN ' + d.length); console.log(d.slice(0, 8000)); res(); });
    });
    req.on('error', (e) => { console.log('ERR ' + e.message); res(); });
    req.on('timeout', () => { req.destroy(); console.log('TIMEOUT'); res(); });
  });
}
get('https://r.jina.ai/https://gupiao.yaozhineng.com/');
