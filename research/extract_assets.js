const fs = require('fs');
const v = fs.readFileSync('C:/Users/28129/Desktop/项目/site_vendors.js', 'utf8');
console.log('echarts:', /echarts/i.test(v), '| klinecharts:', /klinecharts/i.test(v), '| dayjs:', /dayjs/i.test(v), '| axios:', /axios/i.test(v), '| pinia:', /pinia/i.test(v), '| vue-router:', /vue-router/i.test(v), '| marked:', /marked/i.test(v));
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const imgs = [...a.matchAll(/"[^"]*\.(png|svg|jpg|jpeg|webp|gif)"|`[^`]*\.(png|svg|jpg|jpeg|webp|gif)`/gi)].map(m => m[0]);
console.log([...new Set(imgs)].join('\n'));
const fonts = [...a.matchAll(/fonts?[^"]{0,60}/gi)].map(m => m[0]).filter(x => x.length < 80);
console.log('FONTS:', [...new Set(fonts)].join('\n'));
