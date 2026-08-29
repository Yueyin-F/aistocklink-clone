const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app.js', 'utf8');
// 找消费 getWindLeaders 的 store action
const re = /[^;]{0,600}getWindLeaders[^;]{0,1200}/g;
let m;
let n = 0;
while ((m = re.exec(a)) !== null && n < 3) {
  console.log('\n===== match ' + n + ' =====');
  console.log(m[0].replace(/\s+/g, ' ').slice(0, 1400));
  n++;
}
