const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
// find what "chart" matches
const m = a.match(/.{80}[Cc]hart.{80}/g) || [];
console.log(m.slice(0, 10).join('\n=====\n'));
