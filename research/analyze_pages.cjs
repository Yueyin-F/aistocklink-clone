const fs = require('fs');
for (const f of ['52.d6d88923.js', '722.c4a18c17.js', '544.9e6a07fc.js']) {
  const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/chunks/' + f, 'utf8');
  const zh = [...a.matchAll(/"([^"]{2,60})"/g)].map(m => m[1]).filter(x => /[\u4e00-\u9fff]/.test(x) && !/[\{\}\(\)\$\&]/.test(x));
  console.log('\n########## ' + f + ' ##########');
  console.log([...new Set(zh)].join(' | '));
  // API 调用
  const apis = [...a.matchAll(/`([^`]*\/api\/[^`]{3,120})`|"([^"]*\/api\/[^"]{3,120})"/g)].map(m => m[1] || m[2]);
  console.log('APIS:', [...new Set(apis)].join('\n'));
}
