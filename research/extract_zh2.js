const fs = require('fs');
let s = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
// find strings used as headings/labels with common page keywords
const words = ['评分', '排名', '行情', '新闻', '板块', '指数', '预测', '自选', '涨停', '资金', '龙头', '热点', '报告', '榜单', 'TOP', '监控', '事件', '推送', '详情', '建议', '结论', '风险', '逻辑', '概览', '快讯', '公告', '资金流向', '估值', '财务', '标签', '行业'];
const strings = [...s.matchAll(/"([^"]{2,60})"/g)].map(m => m[1]);
const hits = strings.filter(x => words.some(w => x.includes(w)) && !x.includes('{') && !x.includes('('));
console.log([...new Set(hits)].join('\n'));
