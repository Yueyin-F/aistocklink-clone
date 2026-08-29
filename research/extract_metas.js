const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const metas = [...a.matchAll(/meta:\{title:"([^"]+)"\}/g)].map(m => m[1]);
console.log('METAS:', [...new Set(metas)].join('\n'));
// home component: find the first route {path:"/", ...}
const i = a.indexOf('{path:"/",');
console.log('\nHOME ROUTE:\n', a.slice(i, i + 400));
