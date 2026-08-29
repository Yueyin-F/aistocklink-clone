const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const i = a.indexOf('quotes/kline');
console.log(a.slice(i - 900, i + 900).replace(/\s+/g, ' '));
