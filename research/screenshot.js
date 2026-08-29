const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\28129\\Desktop\\项目\\shots';
fs.mkdirSync(outDir, { recursive: true });

const pages = [
  { name: 'home', url: 'https://gupiao.yaozhineng.com/' },
  { name: 'search', url: 'https://gupiao.yaozhineng.com/search' },
  { name: 'stock_600519', url: 'https://gupiao.yaozhineng.com/stock/600519' },
  { name: 'forecast', url: 'https://gupiao.yaozhineng.com/forecast' },
  { name: 'tenx', url: 'https://gupiao.yaozhineng.com/tenx' },
  { name: 'trend', url: 'https://gupiao.yaozhineng.com/trend' },
  { name: 'monitor', url: 'https://gupiao.yaozhineng.com/monitor' },
  { name: 'hot_burst', url: 'https://gupiao.yaozhineng.com/hot-burst' },
  { name: 'stock_intel', url: 'https://gupiao.yaozhineng.com/stock-intel' },
  { name: 'update_logs', url: 'https://gupiao.yaozhineng.com/update-logs' },
  { name: 'download', url: 'https://gupiao.yaozhineng.com/download' },
  { name: 'favorites', url: 'https://gupiao.yaozhineng.com/favorites' },
];

function shot(page) {
  return new Promise((resolve) => {
    const out = path.join(outDir, page.name + '.png');
    const args = [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-crash-reporter',
      '--disable-background-networking', '--disable-extensions', '--disable-sync',
      '--single-process', '--hide-scrollbars', '--window-size=1440,2400',
      '--virtual-time-budget=15000', `--screenshot=${out}`, page.url,
    ];
    const child = spawn(chrome, args, { stdio: 'ignore' });
    const timer = setTimeout(() => { try { child.kill(); } catch (e) {} resolve(); }, 90000);
    child.on('exit', () => { clearTimeout(timer); resolve(); });
    child.on('error', (err) => { clearTimeout(timer); console.log(page.name + ': FAILED ' + err.message); resolve(); });
  });
}

(async () => {
  for (const p of pages) await shot(p);
  for (const p of pages) {
    const f = path.join(outDir, p.name + '.png');
    console.log(p.name + ': ' + (fs.existsSync(f) ? fs.statSync(f).size + ' bytes' : 'MISSING'));
  }
  console.log('DONE');
})();
