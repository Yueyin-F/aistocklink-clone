const fs = require('fs');
let a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/chunks/919.731c68bf.js', 'utf8');
// 提取 module 919 主体（从 "919(" 到下一个 ",数字:(" 之前）
const start = a.indexOf('919(');
const body = a.slice(start);
// 粗略美化
let b = body
  .replace(/;/g, ';\n')
  .replace(/\{/g, '{\n')
  .replace(/\}/g, '\n}')
  .replace(/\),\(/g, '),\n(');
fs.writeFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/home919.pretty.js', b);
console.log('written', b.length);
