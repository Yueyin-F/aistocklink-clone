const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
// find the navbar component's render: locate 'TheNavbar' definition region
const idx = a.indexOf('TheNavbar');
console.log('TheNavbar def at', idx);
// find nav-links section
const i2 = a.indexOf('nav-links');
console.log('nav-links at', i2);
console.log(a.slice(i2 - 300, i2 + 3000));
