const fs = require('fs');
let s = fs.readFileSync('C:/Users/28129/Desktop/项目/site_app.js', 'utf8');
const paths = [...s.matchAll(/path:\s*"([^"]+)"/g)].map(m => m[1]);
console.log('PATHS:', [...new Set(paths)].join(' | '));
const names = [...s.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);
console.log('NAMES:', [...new Set(names)].join(' | '));
const comps = [...s.matchAll(/component:\s*\(\)\s*=>\s*([A-Za-z0-9_$.]+)\(/g)].map(m => m[1]);
console.log('COMPONENTS:', [...new Set(comps)].join(' | '));
