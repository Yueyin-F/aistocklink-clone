const fs = require('fs');
const f = 'C:/Users/28129/Desktop/项目/aistocklink-clone/node_modules/vite/dist/node/chunks/dep-Dm0c1Wj2.js';
let s = fs.readFileSync(f, 'utf8');

// 1) 回退上一次错误补丁
const bad = '  safeRealpathSync = fs__default.realpathSync.native;\n  if (false) {\n';
const iBad = s.indexOf(bad);
if (iBad >= 0) {
  s = s.slice(0, iBad) + s.slice(iBad + bad.length);
  console.log('removed bad insert at', iBad);
}
if (s.endsWith('\n  }')) {
  s = s.slice(0, -4);
  console.log('removed trailing brace');
}

// 2) 正确补丁：单语句 if(false) 包裹 exec
const needle = '  exec("net use", (error, stdout) => {';
const i = s.indexOf(needle);
if (i >= 0) {
  s = s.slice(0, i) + '  safeRealpathSync = fs__default.realpathSync.native;\n  if (false) ' + s.slice(i);
  fs.writeFileSync(f, s);
  console.log('patched correctly');
} else {
  console.log('needle not found');
}
