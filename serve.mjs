// 本地静态服务器 + API 反向代理（纯 Node，无子进程）
// 用法: node serve.mjs [port]
import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(__dirname, 'dist')
const port = Number(process.env.PORT || process.argv[2] || 4173)

const API_TARGET = process.env.API_TARGET || 'https://gupiao-api.yaozhineng.com'
const KRONOS_TARGET = process.env.KRONOS_TARGET || 'https://yingfeng64-kronos-api.hf.space'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

// 可压缩的类型
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.md'])

// 静态文件服务（支持 gzip）
function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (urlPath === '/') urlPath = '/index.html'
  // SPA 回退
  let filePath = path.join(dist, urlPath)
  if (!filePath.startsWith(dist)) {
    res.writeHead(403).end('Forbidden')
    return true
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(dist, 'index.html')
  }
  const ext = path.extname(filePath).toLowerCase()
  const acceptsGzip = /gzip/i.test(req.headers['accept-encoding'] || '')
  const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' }
  if (acceptsGzip && COMPRESSIBLE.has(ext)) {
    headers['Content-Encoding'] = 'gzip'
    res.writeHead(200, headers)
    fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res)
  } else {
    res.writeHead(200, headers)
    fs.createReadStream(filePath).pipe(res)
  }
  return true
}

// 代理请求
// stripPrefix: 是否剥除前缀（/api 目标后端路径本身含 /api 前缀，不剥；/kronos 需剥）
function proxy(req, res, target, prefix, stripPrefix = false) {
  const u = new URL(target)
  let pathname = req.url || '/'
  if (stripPrefix && pathname.startsWith(prefix)) {
    pathname = pathname.slice(prefix.length) || '/'
  }
  const options = {
    hostname: u.hostname,
    port: u.port || 443,
    path: pathname || '/',
    method: req.method,
    headers: { ...req.headers, host: u.host, 'accept-encoding': 'identity' },
  }
  const client = u.protocol === 'https:' ? https : http
  let aborted = false
  const preq = client.request(options, (pres) => {
    res.writeHead(pres.statusCode || 502, pres.headers)
    pres.pipe(res)
  })
  preq.on('error', (e) => {
    if (aborted) return
    aborted = true
    if (res.headersSent) {
      res.destroy()
    } else {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ code: 502, message: '代理错误: ' + e.message, data: null }))
    }
  })
  req.on('aborted', () => {
    aborted = true
    preq.destroy()
  })
  res.on('close', () => {
    if (!res.writableEnded) preq.destroy()
  })
  preq.setTimeout(60000, () => preq.destroy(new Error('proxy timeout')))
  req.pipe(preq)
}

// mock 兜底
const mocks = {
  '/api/market/overview': () => ({
    code: 200,
    message: 'success (mock)',
    data: {
      指数: [
        { 名称: '上证指数', 代码: '000001', 最新价: 3912.52, 涨跌幅: 0.59, 涨跌额: 23.08 },
        { 名称: '深证成指', 代码: '399001', 最新价: 13841.33, 涨跌幅: 0.69, 涨跌额: 95.46 },
        { 名称: '创业板指', 代码: '399006', 最新价: 3414.88, 涨跌幅: 0.51, 涨跌额: 17.36 },
      ],
      涨跌家数: { 上涨: 3126, 下跌: 1844, 平盘: 132 },
      两市成交额: '1.81万亿',
      更新时间: new Date().toLocaleString('zh-CN'),
    },
  }),
}

// 单个请求的异常不应拖垮整个服务（本地开发服务器）
process.on('uncaughtException', (e) => {
  console.error('[serve] 未捕获异常(已忽略):', e.message)
})

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0]
  // mock
  for (const [prefix, fn] of Object.entries(mocks)) {
    if (url.startsWith(prefix)) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify(fn()))
      return
    }
  }
  // API 代理
  if (url.startsWith('/api/')) return proxy(req, res, API_TARGET, '/api')
  if (url.startsWith('/kronos/')) return proxy(req, res, KRONOS_TARGET, '/kronos', true)
  // 静态
  serveStatic(req, res)
})

server.listen(port, () => {
  console.log('aistocklink-clone 服务已启动: http://127.0.0.1:' + port)
  console.log('API 代理: ' + API_TARGET)
})
