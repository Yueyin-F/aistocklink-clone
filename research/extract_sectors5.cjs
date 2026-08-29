const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app.js', 'utf8');
// getWindLeaders 的调用形态可能是 Rx.getWindLeaders 或 e.Rx.getWindLeaders 等，直接搜 getWindLeaders(
let idx = a.indexOf('getWindLeaders(');
let count = 0;
while (idx >= 0 && count < 5) {
  console.log('\n===== occurrence ' + count + ' @' + idx + ' =====');
  console.log(a.slice(Math.max(0, idx - 1200), idx + 900).replace(/\s+/g, ' ').slice(0, 2000));
  idx = a.indexOf('getWindLeaders(', idx + 1);
  count++;
}
