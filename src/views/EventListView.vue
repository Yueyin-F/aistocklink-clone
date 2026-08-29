<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import api from '../api'

const router = useRouter()
const events = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const hasMore = ref(false)
const loading = ref(false)
const error = ref('')

const EVENT_TYPES = ['产业政策', '地缘政治', '技术突破', '市场动态', '监管变化', '公司公告']

async function load(reset = false) {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const data = await api.getEventList({ page: page.value, pageSize })
    const list = data?.events || []
    events.value = reset ? list : [...events.value, ...list]
    total.value = data?.total ?? 0
    hasMore.value = data?.hasMore ?? false
    page.value += 1
  } catch (e) {
    error.value = '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

function goDetail(e) {
  router.push(`/event/${e.eventId}`)
}

function directionText(d) {
  return d === 'bullish' ? '利好' : d === 'bearish' ? '利空' : '中性'
}

function directionClass(d) {
  return d === 'bullish' ? 'pos' : d === 'bearish' ? 'neg' : 'neutral'
}

function importanceLevelText(lv) {
  return { critical: '重大', important: '重要', risk: '风险' }[lv] || lv || ''
}

function fmtTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '--'
}

onMounted(() => load(true))
</script>

<template>
  <div class="container event-list-page">
    <div class="card event-head-card">
      <div class="section-title">
        事件传导
        <span class="muted">{{ total ? `已加载 ${events.length} / ${total} 条事件` : '' }}</span>
        <el-button size="small" style="margin-left: auto" @click="load(true)">刷新</el-button>
      </div>
      <div class="type-filter">
        <el-tag v-for="t in EVENT_TYPES" :key="t" size="small" type="info" effect="plain">{{ t }}</el-tag>
      </div>
    </div>

    <div v-if="loading && !events.length" class="page-loading">加载中...</div>
    <el-alert v-else-if="error && !events.length" :title="error" type="warning" :closable="false">
      <template #default>
        <el-button size="small" @click="load(true)">重试</el-button>
      </template>
    </el-alert>

    <div v-else class="event-cards">
      <div v-for="e in events" :key="e.eventId" class="event-card">
        <div class="event-head">
          <el-tag size="small" type="primary" effect="plain">{{ e.event_type }}</el-tag>
          <el-tag v-if="importanceLevelText(e.globalImportanceLevel)" size="small" :type="e.globalImportanceLevel === 'critical' ? 'danger' : 'warning'" effect="dark">
            {{ importanceLevelText(e.globalImportanceLevel) }}
          </el-tag>
          <span class="muted event-time">{{ fmtTime(e.publishTime) }}</span>
          <span class="muted event-source">{{ e.source_name || '来源暂不可验证' }}</span>
        </div>
        <h3 class="event-title" @click="goDetail(e)">{{ e.title }}</h3>
        <p class="event-summary">{{ e.summary }}</p>
        <div v-if="e.conclusion" class="event-conclusion">
          <span class="muted">研判结论：</span>{{ e.conclusion }}
        </div>
        <!-- 传导链预览 -->
        <div v-if="(e.chain_summary || []).length" class="chain-preview">
          <div v-for="c in e.chain_summary.slice(0, 4)" :key="c.industry" class="chain-item">
            <span class="chain-industry">{{ c.industry }}</span>
            <span class="chain-dir" :class="directionClass(c.direction)">{{ directionText(c.direction) }}</span>
            <el-progress
              :percentage="Math.round((c.impactStrength || 0) * 100)"
              :stroke-width="8"
              :show-text="false"
              :color="c.direction === 'bullish' ? '#f56c6c' : c.direction === 'bearish' ? '#67c23a' : '#909399'"
            />
            <span class="chain-reason" :title="c.reason">{{ c.reason }}</span>
          </div>
        </div>
        <div class="event-foot">
          <el-button type="primary" link @click="goDetail(e)">AI解析 ›</el-button>
        </div>
      </div>
    </div>

    <div v-if="events.length" class="load-more">
      <el-button v-if="hasMore" :loading="loading" @click="load()">加载更多</el-button>
      <span v-else class="muted">已加载全部 {{ total }} 条事件</span>
    </div>
  </div>
</template>

<style scoped>
.event-head-card .type-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.event-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.event-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  padding: 16px 18px;
  transition: box-shadow 0.2s;
}

.event-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.event-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.event-time {
  margin-left: auto;
  font-size: 0.78rem;
}

.event-title {
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.5;
  cursor: pointer;
  margin-bottom: 6px;
}

.event-title:hover {
  color: var(--primary-color);
}

.event-summary {
  color: var(--text-secondary);
  font-size: 0.88rem;
  line-height: 1.7;
  margin-bottom: 8px;
}

.event-conclusion {
  background: #f7f9fc;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.85rem;
  margin-bottom: 10px;
}

.chain-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  align-items: center;
  border-top: 1px dashed var(--border-color);
  padding-top: 10px;
}

.chain-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  min-width: 180px;
  flex: 1 1 220px;
}

.chain-industry {
  font-weight: 600;
  white-space: nowrap;
}

.chain-dir {
  padding: 1px 7px;
  border-radius: 8px;
  font-size: 0.72rem;
  flex-shrink: 0;
}

.chain-dir.pos {
  background: #fff1f0;
  color: #d4380d;
}

.chain-dir.neg {
  background: #f6ffed;
  color: #389e0d;
}

.chain-dir.neutral {
  background: #f5f5f5;
  color: #8c8c8c;
}

.chain-item .el-progress {
  width: 70px;
  flex-shrink: 0;
}

.chain-reason {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.event-foot {
  margin-top: 8px;
  text-align: right;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}
</style>
