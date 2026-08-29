const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app.js', 'utf8');
const i = a.indexOf('se=[{path:"/",name:"home",component:W');
// 往前找该模块开头的 import 区（含 W= 定义）
const seg = a.slice(i - 12000, i);
// 找 W= / G= / H= / K= / q= 等定义
const defs = {};
for (const name of ['W', 'G', 'H', 'K', 'q', 'z', 'Q', 'Y', 'J', 'Z', 'ee', 'te', 'oe', 'V', 'X', 're', 'ae', 'ne']) {
  const re = new RegExp('\\b' + name + '=o\\((\\d+)\\)');
  const m = seg.match(re);
  if (m) defs[name] = 'module ' + m[1];
}
console.log(JSON.stringify(defs, null, 2));
// 也找 Promise.all 的 chunk 编号
const lazy = [...a.matchAll(/component:\(\)=>Promise\.all\(\[o\.e\((\d+)\),o\.e\((\d+)\)\]\)\.then\(o\.bind\(o,(\d+)\)\)/g)].map(m => ({ chunks: [m[1], m[2]], module: m[3] }));
console.log('lazy:', JSON.stringify(lazy));
