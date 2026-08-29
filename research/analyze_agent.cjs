const fs = require('fs');
for (const f of ['722.c4a18c17.js', '544.9e6a07fc.js']) {
  const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/chunks/' + f, 'utf8');
  console.log('\n########## ' + f + ' ##########');
  let idx = a.indexOf('/api/agent');
  while (idx >= 0) {
    console.log('...' + a.slice(Math.max(0, idx - 300), idx + 400).replace(/\s+/g, ' '));
    idx = a.indexOf('/api/agent', idx + 1);
  }
}
