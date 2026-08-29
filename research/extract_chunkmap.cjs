const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/aistocklink-clone/research/site_app.js', 'utf8');
const i = a.indexOf('o.u=e=>');
const seg = a.slice(i, i + 3000);
const m = seg.match(/o\.u=e=>\(227===e\?"chunk-echarts":e\)\+"\.(?:\{|3)"[\s\S]*?(?=,o\.[a-z]+=|,o\.[a-z]+\()/);
if (m) {
  console.log(m[0].slice(0, 2500));
} else {
  console.log(seg.slice(0, 2500));
}
