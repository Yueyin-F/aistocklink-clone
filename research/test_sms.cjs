// 实测短信验证码接口（经本地代理 → 原站后端）
const http = require('http')
function post(path, body) {
  return new Promise((res) => {
    const data = JSON.stringify(body)
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 4173,
        path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        timeout: 20000,
      },
      (r) => {
        let d = ''
        r.on('data', (c) => (d += c))
        r.on('end', () => {
          console.log('\nPOST', path, '->', r.statusCode)
          console.log('响应:', d.slice(0, 400))
          res()
        })
      }
    )
    req.on('error', (e) => { console.log('\nPOST', path, 'ERR', e.message); res() })
    req.on('timeout', () => { console.log('\nPOST', path, 'TIMEOUT'); req.destroy(); res() })
    req.write(data)
    req.end()
  })
}
;(async () => {
  // 常见测试号与格式试探
  await post('/api/auth/sms/send', { phone: '13800138000' })
  await post('/api/auth/sms/send', { phone: '13800138000', scene: 'login' })
  await post('/api/auth/sms/send', { mobile: '13800138000' })
})()
