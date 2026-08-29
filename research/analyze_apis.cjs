const fs = require('fs');
for (const f of ['52.d6d88923.js', '722.c4a18c17.js', '544.9e6a07fc.js']) {
  const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/chunks/' + f, 'utf8');
  console.log('\n########## ' + f + ' ##########');
  const re = /[`"][^`"]*api[^`"]{0,140}[`"]/g;
  let m, n = 0;
  while ((m = re.exec(a)) !== null && n < 8) {
    if (m[0].includes('/')) { console.log(m[0]); n++; }
  }
  // getTagLeaders 调用上下文
  const i = a.indexOf('getTagLeaders');
  if (i >= 0) console.log('CTX:', a.slice(Math.max(0, i - 200), i + 200).replace(/\s+/g, ' '));
}
