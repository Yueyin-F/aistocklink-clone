const fs = require('fs');
const a = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
for (const key of ['头条新闻', '板块龙头', '热点关键词', '市场概览', '国内资讯', '外围资讯']) {
  const i = a.indexOf(key);
  if (i >= 0) {
    console.log('\n===== ' + key + ' @' + i + ' =====');
    console.log(a.slice(Math.max(0, i - 200), i + 200).replace(/\s+/g, ' '));
  } else {
    console.log('\n===== ' + key + ' NOT FOUND =====');
  }
}
