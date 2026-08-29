const fs = require('fs');
let s = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const strings = [...s.matchAll(/"([^"]{2,80})"/g)].map(m => m[1]);
const zh = strings.filter(x => /[\u4e00-\u9fff]/.test(x) && !x.includes('{') && !x.includes('(') && !x.includes('$') && !x.includes('&&'));
console.log([...new Set(zh)].join('\n'));
