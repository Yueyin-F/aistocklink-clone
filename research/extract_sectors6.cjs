const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app.js', 'utf8');
let idx = a.indexOf('getWindLeaders');
let count = 0;
while (idx >= 0 && count < 10) {
  console.log('\n===== @' + idx + ' =====');
  console.log(a.slice(Math.max(0, idx - 60), idx + 160).replace(/\s+/g, ' '));
  idx = a.indexOf('getWindLeaders', idx + 1);
  count++;
}
