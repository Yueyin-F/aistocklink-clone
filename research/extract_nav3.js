const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const i2 = a.indexOf('nav-links');
console.log(a.slice(i2 + 3000, i2 + 5200));
