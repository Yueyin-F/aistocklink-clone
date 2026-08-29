const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/chunks/919.5a6b21ff.css', 'utf8');
// 列出所有 scopeId 及出现次数
const scopes = {};
for (const m of a.matchAll(/data-v-([0-9a-f]{8})/g)) {
  scopes[m[1]] = (scopes[m[1]] || 0) + 1;
}
console.log('SCOPES:', JSON.stringify(scopes, null, 2));
console.log('total length:', a.length);
