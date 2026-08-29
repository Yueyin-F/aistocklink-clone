const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const j = a.indexOf('jnu-logo');
console.log(a.slice(j + 600, j + 1800));
