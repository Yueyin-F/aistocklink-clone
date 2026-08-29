const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
// navbar: find all router-link `to:` values together with adjacent text labels
const re = /to:"(\/[^"]*)"[^;]{0,400}?"([^"]{1,20})"/g;
let m;
const out = [];
while ((m = re.exec(a)) !== null) {
  if (/[\u4e00-\u9fff]/.test(m[2])) out.push(m[1] + ' => ' + m[2]);
}
console.log([...new Set(out)].join('\n'));
