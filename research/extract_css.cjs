const fs = require('fs');
const css = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/chunks/919.5a6b21ff.css', 'utf8');
// 按 } 拆分规则
const rules = css.split('}').map(r => r.trim()).filter(Boolean);
const targets = {
  'home': 'data-v-55aa23e0',
  'wind': 'data-v-13ddd165',
  'market': 'data-v-277b46c1',
  'hotburst': 'data-v-506ee230',
  'news': 'data-v-29f72cd1',
  'stockcard': 'data-v-32f79ad4',
};
let out = [];
for (const [name, scope] of Object.entries(targets)) {
  out.push('\n\n########## ' + name + ' (' + scope + ') ##########');
  for (const r of rules) {
    if (r.includes(scope)) {
      out.push(r.replace(/\s+/g, ' ').trim() + '}');
    }
  }
}
fs.writeFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/home_css_ref.txt', out.join('\n'));
console.log('written', out.length, 'rules');
