const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
// components are defined like: var ae=..., var ne=...; search for eventList string
const i = a.indexOf('eventList');
console.log('eventList at', i);
console.log(a.slice(i - 200, i + 1200).replace(/\s+/g, ' '));
