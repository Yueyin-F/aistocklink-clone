const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const i = a.indexOf('BK+4位数字');
console.log(a.slice(Math.max(0, i - 2500), i + 500).replace(/\s+/g, ' '));
