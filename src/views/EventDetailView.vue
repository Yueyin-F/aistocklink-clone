<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import api from '../api'

const route = useRoute()
const router = useRouter()
const event = ref(null)
const loading = ref(true)
const error = ref('')

// 兼容两种结构：分析数据可能挂在根级或 content 内
function analysisOf(ev) {
  return ev?.content?.analysis_reports || ev?.analysis_reports || null
}
function transmissionOf(ev) {
  return ev?.content?.event_transmission || ev?.event_transmission || null
}
const analysisReports = computed(() => analysisOf(event.value))
const transmission = computed(() => transmissionOf(event.value))

const ratingText = (r) => ({ positive: '整体偏积极', negative: '整体偏谨慎', neutral: '整体中性' }[r] || r)
const ratingType = (r) => ({ positive: 'success', negative: 'warning', neutral: 'info' }[r] || 'info')
const dirText = (d) => (d === 'bullish' || d === 'positive' ? '利好' : d === 'bearish' || d === 'negative' ? '利空' : '中性')
const dirClass = (d) => (d === 'bullish' || d === 'positive' ? 'pos' : d === 'bearish' || d === 'negative' ? 'neg' : 'neutral')

function fmtTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '--'
}

function fmtPct(v) {
  if (v == null) return '--'
  return (v >= 0 ? '+' : '') + v + '%'
}

onMounted(async () => {
  const id = route.params.id
  if (!id) {
    error.value = '事件ID不能为空'
    loading.value = false
    return
  }
  try {
    event.value = await api.getEventDetail(id)
    if (!event.value) error.value = '事件不存在'
  } catch (e) {
    error.value = '加载失败，请重试'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container event-detail-page">
    <div class="card" v-loading="loading">
      <div class="section-title">
        AI事件分析
        <el-button size="small" style="margin-left: auto" @click="router.push('/event')">返回列表</el-button>
      </div>

      <el-alert v-if="error && !event" :title="error" type="warning" :closable="false" />

      <template v-if="event">
        <!-- 事件头 -->
        <template v-if="event.content">
          <h2 class="ev-title">{{ event.content.title }}</h2>
          <div class="ev-meta">
            <el-tag size="small" type="primary" effect="plain">{{ event.content.event_type }}</el-tag>
            <span class="muted">发布时间：{{ fmtTime(event.content.publishTime) }}</span>
            <span class="muted">来源：{{ event.content.source_name || '来源暂不可验证' }}</span>
            <a v-if="event.content.source" :href="event.content.source" target="_blank" class="src-link">查看原文 ↗</a>
          </div>
        </template>

        <!-- 投资研判 -->
        <template v-if="analysisReports?.event_investment">
          <div class="analysis-block">
            <div class="block-head">
              <h3>AI 投资研判</h3>
              <el-tag :type="ratingType(analysisReports.event_investment.rating)" effect="dark">
                {{ ratingText(analysisReports.event_investment.rating) }}
              </el-tag>
            </div>
            <div v-if="(analysisReports.event_investment.keyPoints || []).length" class="sub-block">
              <h4>关键点</h4>
              <ul class="bullet-list">
                <li v-for="(k, i) in analysisReports.event_investment.keyPoints" :key="i">{{ k }}</li>
              </ul>
            </div>
            <div v-if="(analysisReports.event_investment.opportunities || []).length" class="sub-block">
              <h4>存在机会</h4>
              <ul class="bullet-list opp">
                <li v-for="(o, i) in analysisReports.event_investment.opportunities" :key="i">{{ o }}</li>
              </ul>
            </div>
            <div v-if="(analysisReports.event_investment.risks || []).length" class="sub-block">
              <h4>风险提示</h4>
              <ul class="bullet-list risk">
                <li v-for="(r, i) in analysisReports.event_investment.risks" :key="i">{{ r }}</li>
              </ul>
            </div>
            <div v-if="analysisReports.event_investment.conclusion" class="conclusion">
              结论：{{ analysisReports.event_investment.conclusion }}
            </div>
          </div>
        </template>

        <!-- 传导链 -->
        <template v-if="transmission">
          <div class="analysis-block">
            <h3>核心变化与传导链</h3>
            <p v-if="transmission.mechanism" class="mechanism">{{ transmission.mechanism }}</p>
            <div v-if="transmission.coreIndustry" class="core-industry">
              <el-tag size="small" type="danger" effect="dark">核心行业</el-tag>
              <b>{{ transmission.coreIndustry.name }}</b>
              <span class="muted">{{ transmission.coreIndustry.impact }}</span>
            </div>
            <el-table :data="transmission.chain || []" size="small" stripe>
              <el-table-column prop="level" label="层级" width="70">
                <template #default="{ row }">L{{ row.level }}</template>
              </el-table-column>
              <el-table-column prop="industry" label="行业" min-width="110">
                <template #default="{ row }">
                  <b>{{ row.industry }}</b>
                  <span class="muted">（{{ row.relation }}）</span>
                </template>
              </el-table-column>
              <el-table-column label="方向" width="90">
                <template #default="{ row }">
                  <span class="dir-tag" :class="dirClass(row.direction)">{{ dirText(row.direction) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="强度" width="120">
                <template #default="{ row }">
                  <el-progress :percentage="Math.round((row.impactStrength || 0) * 100)" :stroke-width="8" :color="row.direction === 'bullish' ? '#f56c6c' : '#67c23a'" />
                </template>
              </el-table-column>
              <el-table-column prop="reason" label="传导逻辑" min-width="220" show-overflow-tooltip />
            </el-table>
            <div v-if="(transmission.variables || []).length" class="variables">
              <h4>关键变量</h4>
              <div class="var-list">
                <div v-for="v in transmission.variables" :key="v.name" class="var-item">
                  <span class="var-name">{{ v.name }}</span>
                  <span class="var-dir" :class="dirClass(v.direction)">{{ dirText(v.direction) }}</span>
                  <span class="var-strength">强度 {{ Math.round((v.strength || 0) * 100) }}</span>
                  <span class="muted var-exp">{{ v.explanation }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 历史类似事件 -->
        <template v-if="(analysisReports?.event_history || []).length">
          <div class="analysis-block">
            <h3>历史类似事件</h3>
            <div class="history-grid">
              <div v-for="h in analysisReports.event_history" :key="h.historyId || h.year" class="history-card">
                <div class="h-head">
                  <el-tag size="small" type="info" effect="plain">{{ h.year }}</el-tag>
                  <el-tag size="small" :type="h.sentiment === 'bullish' ? 'danger' : 'success'" effect="plain">{{ h.sentiment === 'bullish' ? '偏多' : '偏空' }}</el-tag>
                  <span class="h-pct" :class="h.changePercentage >= 0 ? 'up' : 'down'">{{ fmtPct(h.changePercentage) }}</span>
                </div>
                <div class="h-title">{{ h.title }}</div>
                <div class="h-desc">{{ h.industryChange }}</div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ev-title {
  font-size: 1.4rem;
  margin-bottom: 10px;
  line-height: 1.4;
}

.ev-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  font-size: 0.85rem;
}

.src-link {
  color: var(--primary-color);
}

.analysis-block {
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
  margin-top: 16px;
}

.block-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.analysis-block h3 {
  font-size: 1.05rem;
  margin-bottom: 12px;
}

.sub-block {
  margin-bottom: 14px;
}

.sub-block h4,
.variables h4 {
  font-size: 0.92rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.bullet-list {
  padding-left: 20px;
  line-height: 1.9;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.bullet-list.opp li::marker {
  color: #f56c6c;
}

.bullet-list.risk li::marker {
  color: #e6a23c;
}

.conclusion {
  background: #f0f7ff;
  border-left: 4px solid var(--primary-color);
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.mechanism {
  background: #f9fafc;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 12px;
}

.core-industry {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.dir-tag {
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
}

.dir-tag.pos,
.var-dir.pos {
  background: #fff1f0;
  color: #d4380d;
}

.dir-tag.neg,
.var-dir.neg {
  background: #f6ffed;
  color: #389e0d;
}

.dir-tag.neutral,
.var-dir.neutral {
  background: #f5f5f5;
  color: #8c8c8c;
}

.variables {
  margin-top: 14px;
}

.var-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.var-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  background: #f9fafc;
  border-radius: 6px;
  padding: 6px 10px;
  flex-wrap: wrap;
}

.var-name {
  font-weight: 600;
}

.var-dir {
  padding: 1px 7px;
  border-radius: 8px;
  font-size: 0.72rem;
}

.var-strength {
  color: var(--primary-color);
  font-size: 0.8rem;
}

.var-exp {
  font-size: 0.78rem;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.history-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
}

.h-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.h-pct {
  margin-left: auto;
  font-weight: 700;
}

.h-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.h-desc {
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.7;
}
</style>
