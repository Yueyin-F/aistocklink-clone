import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import mockPlugin from './mock/plugin.mjs'

// 真实后端
const API_TARGET = process.env.API_TARGET || 'https://gupiao-api.yaozhineng.com'
// AI 预测 (Kronos) 后端
const KRONOS_TARGET = process.env.KRONOS_TARGET || 'https://yingfeng64-kronos-api.hf.space'

export default defineConfig({
  plugins: [vue(), mockPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/kronos': {
        target: KRONOS_TARGET,
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/kronos/, ''),
        timeout: 60000,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    minify: false,
    cssMinify: false,
  },
})
