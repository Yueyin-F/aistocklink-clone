const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
console.log('canvas:', /getContext|canvas/i.test(a));
console.log('chart libs:', /Chart|chart\.js|lightweight|tradingview/i.test(a));
// what does the kline component use? find "kline" module ids
const ids = [...a.matchAll(/\{(\d{3,5}):\(e,t,o\)=>\{[^}]{0,80}kline/gi)].map(m => m[1]);
console.log('kline module ids:', [...new Set(ids)]);
// count total modules
console.log('module count approx:', (a.match(/\{\d{3,5}:\(e,t,o\)=>\{/g) || []).length);
