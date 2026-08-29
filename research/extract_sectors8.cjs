const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app.js', 'utf8');
for (const name of ['W', 'q', 'z', 'Q', 'Y', 'J', 'Z', 'ee', 'te', 'oe', 'V', 'X', 're', 'ae', 'ne', 'G', 'H', 'K']) {
  const patterns = ['const ' + name + '=', 'var ' + name + '=', ',' + name + '=', ';' + name + '='];
  for (const p of patterns) {
    let idx = a.indexOf(p);
    if (idx >= 0 && idx < 30000) {
      console.log(name, '->', p, '@', idx);
      break;
    }
  }
}
