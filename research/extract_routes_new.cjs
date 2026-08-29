const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app_new.js', 'utf8');
const i = a.indexOf('se=[{path:"/",name:"home",component:W');
// 组件定义段在 routes 之前
const seg = a.slice(Math.max(0, i - 2000), i);
const names = ['W', 'G', 'H', 'K', 'q', 'z', 'Q', 'Y', 'J', 'Z', 'ee', 'te', 'oe', 'V', 'X', 're', 'ae', 'ne'];
const defs = {};
for (const name of names) {
  const re = new RegExp(',' + name + '=([^;]{0,120})');
  const m = seg.match(re);
  if (m) defs[name] = m[1];
}
console.log(JSON.stringify(defs, null, 2));
// TagView lazy
const lazy = a.match(/component:\(\)=>Promise\.all\(\[o\.e\((\d+)\),o\.e\((\d+)\)\]\)\.then\(o\.bind\(o,(\d+)\)\)/);
console.log('lazy TagView:', lazy);
