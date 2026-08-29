// 定向验证：登录页无导航栏 / 页脚无保研字样 / 首页分页存在
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

function makeDom(url) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="app"></div></body></html>', {
    url,
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
  return { dom, w }
}

const errors = []
process.on('unhandledRejection', (e) => errors.push('unhandledRejection: ' + (e?.message || e)))

const { dom, w } = makeDom('http://127.0.0.1:4173/login')
w.addEventListener('error', (e) => errors.push(String(e.message || e.error)))
require('../dist-test/assets/app.cjs')
await new Promise((r) => setTimeout(r, 3000))
const loginHtml = w.document.getElementById('app').innerHTML
console.log('===== /login =====')
console.log('含 用户登录:', loginHtml.includes('用户登录'))
console.log('含 返回首页:', loginHtml.includes('返回首页'))
console.log('含 navbar(不应有):', loginHtml.includes('class="navbar"'))
console.log('含 site-footer(不应有):', loginHtml.includes('site-footer'))
console.log('含 保研作品(不应有):', loginHtml.includes('保研作品'))

// 回到首页验证页脚与分页
w.history.pushState({}, '', 'http://127.0.0.1:4173/')
w.dispatchEvent(new w.PopStateEvent('popstate'))
await new Promise((r) => setTimeout(r, 8000))
const homeHtml = w.document.getElementById('app').innerHTML
console.log('\n===== / 首页 =====')
console.log('含 保研作品(不应有):', homeHtml.includes('保研作品'))
console.log('含 范广乐:', homeHtml.includes('范广乐'))
console.log('含 el-pagination(分页器):', /el-pagination/.test(homeHtml))
console.log('分页器按钮数:', (homeHtml.match(/el-pager/g) || []).length)
console.log('含 查看完整榜单:', homeHtml.includes('查看完整榜单'))

console.log('\n===== JS ERRORS =====')
console.log(errors.length ? [...new Set(errors)].slice(0, 10).join('\n') : '无')
process.exit(0)
