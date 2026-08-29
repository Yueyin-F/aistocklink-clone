// 生产构建：纯 Rollup（不依赖 esbuild 子进程，适配受限沙箱环境）
import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vueSfc from './vue-sfc-plugin.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BUILD_FORMAT = process.env.BUILD_FORMAT || 'es' // es | cjs（cjs 用于 jsdom 冒烟测试）
const dist = path.join(root, BUILD_FORMAT === 'cjs' ? 'dist-test' : 'dist')

// 清理 dist
fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true })

const plugins = [
  vueSfc(),
  replace({
    preventAssignment: true,
    values: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    },
  }),
  nodeResolve({
    browser: true,
    extensions: ['.mjs', '.js', '.json', '.vue'],
    mainFields: ['module', 'browser', 'main'],
  }),
  commonjs(),
]

const bundle = await rollup({
  input: path.join(root, 'src/main.js'),
  plugins,
  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return
    warn(warning)
  },
})

await bundle.write({
  dir: path.join(dist, 'assets'),
  format: BUILD_FORMAT,
  entryFileNames: BUILD_FORMAT === 'cjs' ? 'app.cjs' : 'app.js',
  chunkFileNames: 'chunk-[name]-[hash].js',
  assetFileNames: 'asset-[name]-[hash][extname]',
  inlineDynamicImports: BUILD_FORMAT === 'cjs',
})

await bundle.close()

// 生成 index.html
const html = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>股票资讯AI智能分析</title>
    <link rel="stylesheet" href="/css/element-plus.css" />
    <link rel="stylesheet" href="/css/main.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/assets/app.js"></script>
  </body>
</html>`
fs.writeFileSync(path.join(dist, 'index.html'), html)

// 复制静态资源
const publicDir = path.join(root, 'public')
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dst, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}
copyDir(publicDir, dist)
fs.mkdirSync(path.join(dist, 'css'), { recursive: true })
fs.copyFileSync(path.join(root, 'src/styles/main.css'), path.join(dist, 'css/main.css'))
fs.copyFileSync(
  path.join(root, 'node_modules/element-plus/dist/index.css'),
  path.join(dist, 'css/element-plus.css')
)

// element-plus 字体
copyDir(path.join(root, 'node_modules/element-plus/dist/fonts'), path.join(dist, 'fonts'))

// ===== Terser 压缩（纯 JS，无子进程；可显著减小包体便于公网演示） =====
if (BUILD_FORMAT === 'es') {
  try {
    const { minify } = await import('terser')
    const assetsDir = path.join(dist, 'assets')
    for (const f of fs.readdirSync(assetsDir)) {
      if (!f.endsWith('.js')) continue
      const file = path.join(assetsDir, f)
      const src = fs.readFileSync(file, 'utf8')
      const out = await minify(src, { compress: true, mangle: true, module: f.endsWith('.mjs') || true })
      if (out && out.code) {
        fs.writeFileSync(file, out.code)
      }
    }
    console.log('MINIFY OK (terser)')
  } catch (e) {
    console.warn('MINIFY SKIPPED:', e.message)
  }
}

console.log('BUILD OK ->', dist)
