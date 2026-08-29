const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app.js', 'utf8');
for (const k of ['hot_sectors', 'getWindLeaders', 'windLeaders', 'leading_stock']) {
  let idx = a.indexOf(k);
  const positions = [];
  while (idx >= 0 && positions.length < 3) {
    positions.push(idx);
    idx = a.indexOf(k, idx + 1);
  }
  console.log(`\n===== "${k}" =====`);
  for (const p of positions) {
    console.log('...' + a.slice(p - 80, p + 700).replace(/\s+/g, ' ').slice(0, 900));
  }
}
