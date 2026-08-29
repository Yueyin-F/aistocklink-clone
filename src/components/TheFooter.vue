<template>
  <footer class="site-footer">
    <div class="container">
      <p>© 2025 - 2026 范广乐 · AI StockLink 复现项目</p>
      <div class="footer-links">
        <router-link to="/update-logs" class="footer-link">更新日志</router-link>
        <span class="divider">|</span>
        <router-link to="/download" class="footer-link">下载 App</router-link>
        <span class="divider">|</span>
        <a href="https://gupiao.yaozhineng.com" target="_blank" rel="noopener noreferrer">原站参考</a>
      </div>
      <div class="beian-info">
        <span class="dev-badge">范</span>
        <span class="team-info">开发者：范广乐</span>
        <span class="sep">|</span>
        <span>项目复现 · 仅用于学习交流</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #fff;
  border-top: 1px solid var(--border-color);
  padding: 24px 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-tertiary);
}

.site-footer p {
  margin-bottom: 8px;
}

.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.footer-links a {
  color: var(--text-secondary);
}

.footer-links a:hover {
  color: var(--primary-color);
}

.divider {
  color: var(--border-color);
}

.beian-info {
  display: flex;
  justify-content: center;
  align-items: center;
}

.dev-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  color: #fff;
  font-size: 0.75rem;
  margin-right: 6px;
}

.beian-info .sep {
  margin: 0 8px;
  color: var(--text-tertiary);
}
</style>
