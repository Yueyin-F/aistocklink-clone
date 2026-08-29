const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app.js', 'utf8');
const i = a.indexOf('o.u=e=>');
console.log(a.slice(i, i + 1600));
