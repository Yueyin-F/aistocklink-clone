const https = require('https');
const BASE = 'https://gupiao-api.yaozhineng.com';
function get(p) {
  return new Promise((res) => {
    const req = https.get(BASE + p, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        try {
          const j = JSON.parse(d);
          const sectors = j.data?.hot_sectors || [];
          console.log('\n===== ' + p + ' [' + r.statusCode + '] sectors=' + sectors.length + ' =====');
          if (sectors[0]) {
            const s = sectors[0];
            console.log('KEYS:', Object.keys(s).join(','));
            console.log('long_leader:', JSON.stringify(s.long_leader || null));
            console.log('leading_stock_info:', JSON.stringify(s.leading_stock_info || null));
            console.log('main_stocks count:', (s.main_stocks || []).length, 'sample:', JSON.stringify((s.main_stocks || [])[0] || null));
            console.log('upstream count:', (s.upstream_stocks || []).length, 'downstream count:', (s.downstream_stocks || []).length);
            console.log('flow_data:', JSON.stringify(s.flow_data || null)?.slice(0, 400));
            console.log('ai_analysis:', JSON.stringify(s.ai_analysis || null)?.slice(0, 700));
          } else {
            console.log('RAW:', d.slice(0, 800));
          }
        } catch (e) {
          console.log('PARSE FAIL', d.slice(0, 300));
        }
        res();
      });
    });
    req.on('error', (e) => { console.log('ERR', e.message); res(); });
    req.on('timeout', () => { req.destroy(); res(); });
  });
}
(async () => {
  await get('/api/cn/wind-leaders?limit=8');
  await get('/api/cn/institution-research/latest?limit=5');
  await get('/api/cn/stock-monitors/events?cycle=all&limit=8');
})();
