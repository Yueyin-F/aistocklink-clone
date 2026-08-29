<script setup>
// 静态展示页
</script>

<template>
  <div class="container download-page">
    <div class="card download-hero">
      <h1 class="hero-title">股票资讯AI智能分析</h1>
      <p class="hero-desc">AI 驱动的股票资讯智能分析平台 · 网页版 / 微信推送 / 企业版</p>
      <div class="hero-btns">
        <el-button type="primary" size="large" tag="a" href="https://gupiao.yaozhineng.com/" target="_blank">
          立即使用网页版
        </el-button>
      </div>
    </div>

    <div class="feature-grid">
      <div class="card feature">
        <h3>📰 AI 资讯分析</h3>
        <p>财联社头条、国内、外围资讯聚合，AI 智能摘要与事件分析。</p>
      </div>
      <div class="card feature">
        <h3>📈 智能评分</h3>
        <p>十倍股评分、趋势股评分，多维指标综合量化个股投资价值。</p>
      </div>
      <div class="card feature">
        <h3>🔔 微信推送</h3>
        <p>自选股监控与热点事件实时推送，重要机会不错过。</p>
      </div>
      <div class="card feature">
        <h3>🧠 业绩预测</h3>
        <p>机构盈利预测聚合，净利润同比、EPS 预测一目了然。</p>
      </div>
    </div>

    <div class="card">
      <div class="section-title">更多接入方式</div>
      <p class="muted">本项目为学习复现作品，支持扩展飞书 / 微信推送等渠道接入。</p>
      <div class="feishu-row">
        <el-button tag="a" href="https://gupiao.yaozhineng.com/" target="_blank">参考原站</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.download-hero {
  text-align: center;
  padding: 48px 20px;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
}

.hero-title {
  font-size: 2rem;
  margin-bottom: 10px;
  color: var(--primary-color);
}

.hero-desc {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.feature h3 {
  margin-bottom: 10px;
}

.feature p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.7;
}

.feishu-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.feishu-qr {
  width: 140px;
  height: 140px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}
</style>
