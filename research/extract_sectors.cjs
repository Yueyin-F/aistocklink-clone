const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app.js', 'utf8');
const keys = ['热度', '龙头股', '产业链', '环节', '风口', '热度传导', '短线', '长线', '持续性', '风险提示', '板块涨幅', '上榜', '频次', 'related_industries', 'industry_data', 'main_stocks', 'heat_transfer'];
for (const k of keys) {
  let count = 0;
  let idx = a.indexOf(k);
  const positions = [];
  while (idx >= 0 && count < 4) {
    positions.push(idx);
    idx = a.indexOf(k, idx + 1);
    count++;
  }
  console.log(`\n===== "${k}" (first ${positions.length}) =====`);
  for (const p of positions) {
    console.log('...' + a.slice(p - 100, p + 150).replace(/\s+/g, ' '));
  }
}
