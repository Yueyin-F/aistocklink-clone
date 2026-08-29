// Cloudflare Worker：静态托管时的 API 反向代理（免费，全球边缘节点）
// 场景：前端部署在 Cloudflare Pages / GitHub Pages / 任意静态托管，
//       由本 Worker 把 /api、/kronos 转发到真实数据源，并处理跨域。
//
// 部署：Cloudflare Dashboard → Workers & Pages → 创建 Worker → 粘贴本代码 → 部署
//       → 触发器 → 自定义域名（如 api.aistock.你的域名.com）
// 前端接入：把 src/api/index.js 的 baseURL 改为 'https://api.aistock.你的域名.com/api'，
//       再执行 npm run build:rollup 重新构建（或通过环境变量注入）。

const API_TARGET = 'https://gupiao-api.yaozhineng.com'
const KRONOS_TARGET = 'https://yingfeng64-kronos-api.hf.space'

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname
    const search = url.search

    let target
    let pathname = path
    if (path.startsWith('/kronos/')) {
      target = KRONOS_TARGET
      pathname = path.slice('/kronos'.length) || '/'
    } else if (path.startsWith('/api/')) {
      target = API_TARGET
      // 目标后端路径本身含 /api 前缀，保持原路径
    } else {
      return new Response('Not Found', { status: 404 })
    }

    const headers = new Headers(request.headers)
    headers.set('Host', new URL(target).host)
    headers.set('Origin', '*')

    try {
      const upstream = await fetch(target + pathname + search, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        // 必须透传，否则 HTTPS 证书校验失败
        cf: { resolveOverride: new URL(target).hostname },
      })
      const respHeaders = new Headers(upstream.headers)
      respHeaders.set('Access-Control-Allow-Origin', '*')
      respHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      respHeaders.set('Access-Control-Allow-Headers', 'Content-Type')
      respHeaders.set('Access-Control-Max-Age', '86400')
      return new Response(upstream.body, { status: upstream.status, headers: respHeaders })
    } catch (e) {
      return new Response(JSON.stringify({ code: 502, message: 'Worker 代理错误: ' + e.message, data: null }), {
        status: 502,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
      })
    }
  },
}
