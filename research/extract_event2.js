const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
// find var ae= (eventList) and var ne= (eventDetail)
let i = a.indexOf('var ae=');
if (i < 0) i = a.indexOf('ae={name:"eventList"');
console.log('ae at', i);
if (i >= 0) console.log(a.slice(i, i + 2500).replace(/\s+/g, ' '));
