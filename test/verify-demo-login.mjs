// 演示登录流程验证：登录页有演示按钮 → 点击后进入首页并显示已登录 → 可加自选股
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="app"></div></body></html>', {
  url: 'http://127.0.0.1:4173/login',
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
await sleep(2500)

// 1. 登录页有演示按钮
const loginHtml = w.document.getElementById('app').innerHTML
console.log('登录页含"演示账号登录":', loginHtml.includes('演示账号登录'))
console.log('登录页含短信提示(原站未配置):', loginHtml.includes('短信服务为原站后端提供'))

// 2. 找到按钮并点击（触发 vue 事件需要真实 click）
const btn = [...w.document.querySelectorAll('button')].find((b) => b.textContent.includes('演示账号登录'))
if (btn) {
  btn.dispatchEvent(new w.MouseEvent('click', { bubbles: true }))
  console.log('已点击演示登录按钮')
}
await sleep(3000)

// 3. 应跳转首页且已登录（导航栏显示用户）
const html = w.document.getElementById('app').innerHTML
console.log('登录后 URL:', w.location.href)
console.log('导航栏含"演示用户":', html.includes('演示用户'))
console.log('导航栏含"退出登录":', html.includes('退出登录'))
console.log('导航栏含"我的自选股":', html.includes('我的自选股'))

// 4. 自选股页可直接访问
w.history.pushState({}, '', '/favorites')
w.dispatchEvent(new w.PopStateEvent('popstate'))
await sleep(2500)
const favHtml = w.document.getElementById('app').innerHTML
console.log('自选股页渲染:', favHtml.includes('我的自选股'), '| 未跳登录页:', !favHtml.includes('用户登录'))

console.log('===== JS ERRORS =====')
console.log(errors.length ? [...new Set(errors)].slice(0, 10).join('\n') : '无')
process.exit(0)
