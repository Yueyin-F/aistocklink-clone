const fs = require('fs');
let s = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const strings = [...s.matchAll(/"([^"]{2,100})"/g)].map(m => m[1]);
const zh = strings.filter(x => /[\u4e00-\u9fff]/.test(x) && !/[\{\}\(\)\$\&\|\*]/.test(x));
const uniq = [...new Set(zh)];
// sort by length desc to see headings first
uniq.sort((a, b) => b.length - a.length);
console.log(uniq.join('\n'));
