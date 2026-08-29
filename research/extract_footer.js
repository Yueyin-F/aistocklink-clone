const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const idx = a.indexOf('TheFooter');
console.log('TheFooter at', idx);
// find footer render section - search for jnu-logo usage
const j = a.indexOf('jnu-logo');
console.log(a.slice(j - 1500, j + 600));
