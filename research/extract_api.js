const fs = require('fs');
let s = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
// find all API path strings used with get/post: d.get(`/api/...`) etc
const calls = [...s.matchAll(/\.(?:get|post|put|delete)\((`[^`]{3,160}`|"[^"]{3,160}")/g)].map(m => m[1]);
const uniq = [...new Set(calls)];
console.log(uniq.join('\n'));
