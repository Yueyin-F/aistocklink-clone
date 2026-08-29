const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/chunks/919.731c68bf.js', 'utf8');
// 该 chunk 的模块入口: 919(...)
const i = a.indexOf('919(');
console.log('module 919 at', i, 'len', a.length);
// 提取所有中文字符串
const zh = [...a.matchAll(/"([^"]{2,120})"/g)].map(m => m[1]).filter(x => /[\u4e00-\u9fff]/.test(x) && !/[\{\}\(\)\$\&\|]/.test(x));
console.log([...new Set(zh)].join('\n'));
