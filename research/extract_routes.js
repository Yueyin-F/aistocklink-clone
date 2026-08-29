const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const i = a.indexOf('{path:"/",');
const j = a.indexOf('],ie=');
console.log(a.slice(i, j).replace(/\s+/g, ' '));
