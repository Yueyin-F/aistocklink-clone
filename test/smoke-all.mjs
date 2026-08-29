// jsdom 全页面冒烟测试：逐页点击导航，检查渲染与 JS 错误
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
global.requestAnimationFrame = w.requestAnimationFrame.bind(w)
global.cancelAnimationFrame = w.cancelAnimationFrame.bind(w)
global.localStorage = w.localStorage
global.sessionStorage = w.sessionStorage
global.getSelection = () => ({})
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
global.MutationObserver = w.MutationObserver
global.DOMParser = w.DOMParser
global.Image = w.Image
global.URL = w.URL
global.AbortController = w.AbortController
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 通过 history API 直接导航（等效于路由跳转）
async function nav(path, waitMs = 4000) {
  w.history.pushState({}, '', path)
  w.dispatchEvent(new w.PopStateEvent('popstate'))
  await sleep(waitMs)
  const html = w.document.getElementById('app').innerHTML
  return html
}

const pages = [
  ['/search', '股票搜索'],
  ['/forecast', '业绩预测'],
  ['/tenx', '十倍股评分'],
  ['/trend', '趋势股评分'],
  ['/trend/report?stock=600519&time=2026-08-25', '趋势股评分报告'],
  ['/stock/600519', '贵州茅台'],
  ['/hot-burst', '机构调研推荐热门股'],
  ['/stock-intel', '自选股情报'],
  ['/event', '事件传导'],
  ['/tags/BK0475', '板块龙头'],
  ['/compare', '个股对比'],
  ['/update-logs', '更新日志'],
  ['/download', '下载 App'],
  ['/login', '用户登录'],
  ['/', '首页'],
]

await sleep(7000) // 等首页数据（含风口龙头/热门股/盈利榜）
{
  const home = w.document.getElementById('app').innerHTML
  console.log('===== 首页专项检查 =====')
  for (const k of ['市场资讯', '头条新闻', '国内资讯', '外围资讯', '市场概览', '长线风口龙头', '风口概念', '机构调研推荐热门股', '我的自选股', '盈利预测更新榜', '查看历史表现', '个股对比']) {
    console.log(`home contains "${k}":`, home.includes(k))
  }
}
let totalLen = 0
for (const [path, label] of pages) {
  try {
    const html = await nav(path, label.includes('详情') ? 5000 : 3500)
    totalLen += html.length
    const ok = html.includes(label) || html.length > 500
    console.log(`[${ok ? 'OK' : '??'}] ${path} -> ${html.length} chars | has "${label}": ${html.includes(label)}`)
    if (html.length < 300) console.log('   HTML:', html.slice(0, 300))
  } catch (e) {
    console.log(`[ERR] ${path} -> ${e.message}`)
  }
}

console.log('===== total rendered chars:', totalLen)
if (errors.length) {
  console.log('===== JS ERRORS (' + errors.length + ') =====')
  console.log([...new Set(errors)].slice(0, 25).join('\n'))
} else {
  console.log('===== NO JS ERRORS =====')
}
