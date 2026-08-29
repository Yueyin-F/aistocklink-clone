const https = require('https');
const BASE = 'yingfeng64-kronos-api.hf.space';
const body = JSON.stringify({ symbol: '600519', lookback: 128, pred_len: 5, sample_count: 10, mode: 'simple', include_volume: false });
const req = https.request({
  hostname: BASE,
  path: '/api/v1/predict',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0', 'Content-Length': Buffer.byteLength(body) },
  timeout: 45000,
}, (r) => {
  let d = '';
  r.on('data', (c) => (d += c));
  r.on('end', () => {
    console.log('status', r.statusCode);
    console.log(d.slice(0, 2000));
  });
});
req.on('error', (e) => console.log('ERR', e.message));
req.on('timeout', () => { console.log('TIMEOUT'); req.destroy(); });
req.write(body);
req.end();
