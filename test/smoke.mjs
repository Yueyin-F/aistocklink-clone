// jsdom 冒烟测试：加载 CJS 构建产物，验证应用可挂载、首页渲染
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const BASE = 'http://127.0.0.1:4173/'

const dom = new JSDOM(`<!doctype html><html><head></head><body><div id="app"></div></body></html>`, {
  url: BASE,
  pretendToBeVisual: true,
  runScripts: 'outside-only',
})

const w = dom.window
// 补齐浏览器全局
global.window = w
global.document = w.document
Object.defineProperty(global, 'navigator', { value: w.navigator, configurable: true })
global.location = w.location
global.history = w.history
global.getComputedStyle = w.getComputedStyle.bind(w)
global.HTMLElement = w.HTMLElement
global.HTMLDivElement = w.HTMLDivElement
global.HTMLCanvasElement = w.HTMLCanvasElement
global.SVGElement = w.SVGElement
global.SVGSVGElement = w.SVGSVGElement
global.SVGGraphicsElement = w.SVGGraphicsElement
global.Element = w.Element
global.Node = w.Node
global.Text = w.Text
global.Comment = w.Comment
global.DocumentFragment = w.DocumentFragment
global.EventTarget = w.EventTarget
global.customElements = w.customElements
global.CustomEvent = w.CustomEvent
global.Event = w.Event
global.MouseEvent = w.MouseEvent
global.KeyboardEvent = w.KeyboardEvent
global.XMLHttpRequest = w.XMLHttpRequest
// 保留 Node 原生 performance（jsdom 的 performance 会递归）
global.requestAnimationFrame = w.requestAnimationFrame.bind(w)
global.cancelAnimationFrame = w.cancelAnimationFrame.bind(w)
global.localStorage = w.localStorage
global.sessionStorage = w.sessionStorage
global.getSelection = () => ({})
w.scrollTo = () => {}
global.scrollTo = () => {}
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
global.MutationObserver = w.MutationObserver
global.DOMParser = w.DOMParser
global.Image = w.Image
global.URL = w.URL
global.AbortController = w.AbortController

// canvas 桩（echarts 用）
w.HTMLCanvasElement.prototype.getContext = function () {
  return {
    canvas: this,
    fillRect() {}, clearRect() {}, getImageData() { return { data: [] } },
    putImageData() {}, createImageData() { return { data: [] } },
    setTransform() {}, drawImage() {}, save() {}, fillText() {}, restore() {},
    beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {}, fill() {},
    arc() {}, rect() {}, scale() {}, translate() {}, rotate() {}, measureText() { return { width: 0 } },
    createLinearGradient() { return { addColorStop() {} } }, createRadialGradient() { return { addColorStop() {} } },
    clip() {}, bezierCurveTo() {}, quadraticCurveTo() {}, setLineDash() {}, getContextAttributes() { return {} },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 } },
  }
}

const errors = []
w.addEventListener('error', (e) => errors.push(String(e.message || e.error)))
process.on('unhandledRejection', (e) => errors.push('unhandledRejection: ' + (e?.message || e)))

// 加载 CJS 构建
try {
  require('../dist-test/assets/app.cjs')
} catch (e) {
  console.error('LOAD FAILED:', e)
  process.exit(1)
}

// 等待渲染与数据加载
await new Promise((r) => setTimeout(r, 8000))

const app = w.document.getElementById('app')
const html = app ? app.innerHTML : '(no #app)'
console.log('===== RENDERED HTML (first 3000 chars) =====')
console.log(html.slice(0, 3000))
console.log('===== length:', html.length)

// 检查首页关键内容
const checks = ['市场概览', '头条新闻', '板块龙头', '热点关键词', '首页', '搜索股票']
for (const c of checks) {
  console.log(`contains "${c}":`, html.includes(c))
}

if (errors.length) {
  console.log('===== ERRORS =====')
  console.log([...new Set(errors)].slice(0, 20).join('\n'))
} else {
  console.log('===== NO JS ERRORS =====')
}
