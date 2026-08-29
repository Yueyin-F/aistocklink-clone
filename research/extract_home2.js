const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const i = a.indexOf('{path:"/",name:"home",component:W');
// W is defined somewhere before; find "var W="
const wi = a.lastIndexOf('var W=', i);
console.log('var W= at', wi);
console.log(a.slice(wi, wi + 300));
// find HomeView render: search for 头条新闻 usage in render context (h3 etc.)
const hi = a.indexOf('头条新闻');
// look backwards for the component def containing it
const seg = a.slice(hi - 8000, hi);
const last = seg.lastIndexOf('const ');
console.log('\n--- context before 头条新闻 ---\n');
console.log(a.slice(hi - 6000, hi - 3500));
