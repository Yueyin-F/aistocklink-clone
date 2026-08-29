const https = require('https');
const BASE = 'yingfeng64-kronos-api.hf.space';
const taskId = process.argv[2] || '0ba66f03-3e51-4a09-afb3-5782ccd2dac1';
function poll() {
  https.get({ hostname: BASE, path: `/api/v1/predict/${taskId}`, headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }, (r) => {
    let d = '';
    r.on('data', (c) => (d += c));
    r.on('end', () => {
      console.log('status', r.statusCode);
      console.log(d.slice(0, 2500));
      const j = JSON.parse(d);
      if (j.status === 'pending' || j.state === 'pending') {
        console.log('... still pending, retry in 6s');
        setTimeout(poll, 6000);
      }
    });
  }).on('error', (e) => { console.log('ERR', e.message); });
}
poll();
