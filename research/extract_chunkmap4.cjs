const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app.js', 'utf8');
for (const k of ['elementPlus', 'ae81fda2', 'chunk-', 'o.e=e=>']) {
  let idx = a.indexOf(k);
  let count = 0;
  while (idx >= 0 && count < 4) {
    console.log('\n===== "' + k + '" @' + idx + ' =====');
    console.log(a.slice(Math.max(0, idx - 80), idx + 260).replace(/\s+/g, ' ').slice(0, 380));
    idx = a.indexOf(k, idx + 1);
    count++;
  }
}
