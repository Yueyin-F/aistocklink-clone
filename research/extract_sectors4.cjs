const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app.js', 'utf8');
let idx = a.indexOf('.getWindLeaders(');
console.log('first call at', idx);
if (idx > 0) console.log(a.slice(idx - 1500, idx + 1500).replace(/\s+/g, ' '));
// 找第二个调用
if (idx > 0) {
  const idx2 = a.indexOf('.getWindLeaders(', idx + 1);
  console.log('\n\nsecond call at', idx2);
  if (idx2 > 0) console.log(a.slice(idx2 - 800, idx2 + 800).replace(/\s+/g, ' '));
}
