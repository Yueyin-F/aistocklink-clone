// 事件详情页专项验证
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="app"></div></body></html>', {
  url: 'http://127.0.0.1:4173/event/evt_13e8b110',
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
    canvas: this,
    fillRect() {}, clearRect() {}, getImageData() { return { data: [] } },
    putImageData() {}, createImageData() { return { data: [] } },
    setTransform() {}, drawImage() {}, save() {}, fillText() {}, restore() {},
    beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {}, fill() {},
    arc() {}, rect() {}, scale() {}, translate() {}, rotate() {},
    measureText() { return { width: 0 } },
    createLinearGradient() { return { addColorStop() {} } },
    createRadialGradient() { return { addColorStop() {} } },
    clip() {}, bezierCurveTo() {}, quadraticCurveTo() {}, setLineDash() {},
    getContextAttributes() { return {} },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 } },
  }
}
const errors = []
w.addEventListener('error', (e) => errors.push(String(e.message || e.error)))
process.on('unhandledRejection', (e) => errors.push('unhandledRejection: ' + (e?.message || e)))

require('../dist-test/assets/app.cjs')
await new Promise((r) => setTimeout(r, 6000))
const html = w.document.getElementById('app').innerHTML
console.log('===== /event/evt_13e8b110 渲染', html.length, 'chars =====')
for (const k of ['AI事件分析', '关键点', '存在机会', '风险提示', '传导链', '历史类似事件', '整体偏积极', '返回列表', '范广乐']) {
  console.log(`contains "${k}":`, html.includes(k))
}
console.log('===== 片段 =====')
console.log(html.slice(0, 800))
if (errors.length) {
  console.log('===== JS ERRORS =====')
  console.log([...new Set(errors)].slice(0, 15).join('\n'))
} else {
  console.log('===== NO JS ERRORS =====')
}
