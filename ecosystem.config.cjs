// PM2 进程配置：pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'aistocklink',
      script: 'serve.mjs',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4173,
        // 数据源（默认已内置，可按需覆盖）
        // API_TARGET: 'https://gupiao-api.yaozhineng.com',
        // KRONOS_TARGET: 'https://yingfeng64-kronos-api.hf.space',
      },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      time: true,
    },
  ],
}
