// 公网 E2E：jsdom 挂载在 serveo 公网地址上，验证 页面+数据 全链路
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const BASE = 'https://9277c2c0c1a74087-223-99-205-222.serveousercontent.com/'

const dom = new JSDOM(`<!doctype html><html><head></head><body><div id="app"></div></body></html>`, {
  url: BASE,
  pretendToBeVisual: true,
  runScripts: 'outside-only',
})

const w = dom.window
global.window = w
global.document = w.document
Object.defineProperty(global, 'navigator', { value: w.navigator, configurable: true })
global.location = w.location
global.history = w.history
global.getComputedStyle = w.getComputedStyle.bind(w)
for (const k of ['HTMLElement', 'HTMLDivElement', 'HTMLCanvasElement', 'SVGElement', 'SVGSVGElement', 'Element', 'Node', 'Text', 'Comment', 'DocumentFragment', 'EventTarget', 'CustomEvent', 'Event', 'MouseEvent', 'KeyboardEvent', 'XMLHttpRequest', 'MutationObserver', 'DOMParser', 'Image', 'URL', 'AbortController']) global[k] = w[k]
global.customElements = w.customElements
global.requestAnimationFrame = w.requestAnimationFrame.bind(w)
global.cancelAnimationFrame = w.cancelAnimationFrame.bind(w)
global.localStorage = w.localStorage
global.sessionStorage = w.sessionStorage
global.getSelection = () => ({})
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
w.scrollTo = () => {}
global.scrollTo = () => {}
w.HTMLCanvasElement.prototype.getContext = function () {
  return {
    canvas: this, fillRect() {}, clearRect() {}, getImageData() { return { data: [] } },
    putImageData() {}, createImageData() { return { data: [] } },
    setTransform() {}, drawImage() {}, save() {}, fillText() {}, restore() {},
    beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {}, fill() {},
    arc() {}, rect() {}, scale() {}, translate() {}, rotate() {},
    measureText() { return { width: 0 } },
    createLinearGradient() { return { addColorStop() {} } }, createRadialGradient() { return { addColorStop() {} } },
    clip() {}, bezierCurveTo() {}, quadraticCurveTo() {}, setLineDash() {},
    getContextAttributes() { return {} },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 } },
  }
}

const errors = []
w.addEventListener('error', (e) => errors.push(String(e.message || e.error)))
process.on('unhandledRejection', (e) => errors.push('unhandledRejection: ' + (e?.message || e)))

require('../dist-test/assets/app.cjs')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function nav(path, waitMs = 4000) {
  w.history.pushState({}, '', path)
  w.dispatchEvent(new w.PopStateEvent('popstate'))
  await sleep(waitMs)
  return w.document.getElementById('app').innerHTML
}

await sleep(8000)
{
  const home = w.document.getElementById('app').innerHTML
  console.log('===== 公网首页专项 =====')
  for (const k of ['市场资讯', '头条新闻', '市场概览', '长线风口龙头', '机构调研推荐热门股', '盈利预测更新榜', '我的自选股']) {
    console.log(`home contains "${k}":`, home.includes(k))
  }
}

const pages = [
  ['/stock/600519', '贵州茅台'],
  ['/forecast', '业绩预测'],
  ['/trend', '趋势股评分'],
  ['/event', '事件传导'],
  ['/compare', '个股对比'],
  ['/', '首页'],
]
for (const [path, label] of pages) {
  const html = await nav(path, 4000)
  console.log(`[${html.includes(label) ? 'OK' : '??'}] ${path} -> ${html.length} chars | "${label}": ${html.includes(label)}`)
}

console.log('===== 公网 E2E 结果 =====')
console.log(errors.length ? 'JS ERRORS:\n' + [...new Set(errors)].slice(0, 15).join('\n') : 'NO JS ERRORS')
process.exit(0)
