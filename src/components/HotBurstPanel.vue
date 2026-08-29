<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

const props = defineProps({
  showMoreLink: { type: Boolean, default: true },
  showDetectBtn: { type: Boolean, default: false },
  displayLimit: { type: Number, default: 5 },
})

const router = useRouter()
const signals = ref([])
const loading = ref(false)
const detecting = ref(false)

const displayedSignals = computed(() =>
  props.displayLimit > 0 ? signals.value.slice(0, props.displayLimit) : signals.value
)

function levelLabel(lv) {
  return { critical: '极高', high: '高', medium: '中', low: '低' }[lv] || lv
}

function formatChange(v) {
  return v == null ? '--' : (v >= 0 ? '+' : '') + Number(v).toFixed(2) + '%'
}

function changeClass(v) {
  return v == null ? '' : v >= 0 ? 'up' : 'down'
}

function goToStock(code) {
  router.push({ name: 'stockDetail', params: { code } })
}

async function fetchRecent() {
  loading.value = true
  try {
    const data = await api.getInstitutionResearchLatest()
    signals.value = data?.outbreaks || []
  } catch (e) {
    signals.value = []
  } finally {
    loading.value = false
  }
}

async function runDetect() {
  detecting.value = true
  try {
    await api.detectInstitutionResearch()
    ElMessage.success('监测任务已触发，稍后自动刷新')
    setTimeout(fetchRecent, 8000)
  } catch (e) {
    ElMessage.error(e.message || '触发检测失败')
  } finally {
    detecting.value = false
  }
}

onMounted(fetchRecent)
</script>

<template>
  <div class="hot-burst-panel">
    <div class="panel-header">
      <h3 class="section-title">
        机构调研推荐热门股
        <button v-if="showDetectBtn" class="detect-btn-small" :disabled="loading || detecting" @click="runDetect">
          {{ loading || detecting ? '检测中...' : '执行监测' }}
        </button>
      </h3>
      <div class="header-right">
        <span v-if="signals.length" class="subtitle">
          共 {{ signals.length }} 只<span v-if="displayedSignals.length < signals.length" class="subtitle-extra">（展示前 {{ displayedSignals.length }} 只）</span>
        </span>
        <router-link v-if="showMoreLink" to="/hot-burst" class="more-link"> 查看全部 <span class="arrow">→</span></router-link>
      </div>
    </div>

    <div v-if="loading && !signals.length" class="loading">检测中...</div>
    <div v-else class="signal-table">
      <div class="table-head">
        <span>行情</span>
        <span>股票</span>
        <span>等级</span>
        <span>关键词</span>
        <span>得分</span>
        <span>板块</span>
      </div>
      <div
        v-for="s in displayedSignals"
        :key="s.symbol"
        class="table-row"
        :class="'level-' + s.resonanceLevel"
        @click="goToStock(s.symbol)"
      >
        <div class="cell-price">
          <span class="price-val">{{ s.price != null ? Number(s.price).toFixed(2) : '--' }}</span>
          <span class="change-val" :class="changeClass(s.changePct)">{{ formatChange(s.changePct) }}</span>
        </div>
        <div class="cell-stock">
          <span class="stock-name">{{ s.stockName || s.symbol }}</span>
          <span class="stock-code">{{ s.symbol }}</span>
        </div>
        <div class="cell-level">
          <span class="level-tag" :class="s.resonanceLevel">{{ levelLabel(s.resonanceLevel) }}</span>
        </div>
        <div class="cell-keywords">
          <span v-for="t in (s.triggerTags || []).slice(0, 4)" :key="t" class="kw-tag">{{ t }}</span>
        </div>
        <div class="cell-score">
          <span class="score-val">{{ s.resonanceScore }}</span>
        </div>
        <div class="cell-sector">
          <span class="sector-text">{{ s.sectorInfo || s.thsSectorName || '--' }}</span>
        </div>
      </div>
      <div v-if="!signals.length" class="empty-row">暂无共振信号</div>
    </div>
  </div>
</template>

<style scoped>
.hot-burst-panel {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-header .section-title {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.detect-btn-small {
  padding: 3px 12px;
  font-size: 0.78rem;
  border-radius: 4px;
  border: 1px solid var(--primary-color);
  background: var(--primary-color);
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s;
}

.detect-btn-small:hover {
  opacity: 0.85;
}

.detect-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.subtitle {
  color: #94a3b8;
  font-size: 12px;
}

.more-link {
  font-size: 0.85rem;
  color: var(--primary-color);
  text-decoration: none;
  white-space: nowrap;
}

.more-link:hover {
  text-decoration: underline;
}

.loading {
  text-align: center;
  padding: 30px 0;
  color: #94a3b8;
  font-size: 13px;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 30px 0;
  font-size: 0.88rem;
}

.signal-table {
  border: 1px solid #edf1f7;
  border-radius: 8px;
  overflow: hidden;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 80px minmax(90px, 0.8fr) 56px minmax(120px, 1fr) 44px minmax(80px, 0.7fr);
  align-items: center;
  gap: 8px;
}

.table-head {
  min-height: 34px;
  padding: 0 12px;
  background: #f8fafc;
  border-bottom: 1px solid #edf1f7;
  color: var(--text-tertiary);
  font-size: 0.74rem;
  font-weight: 700;
}

.table-row {
  min-height: 50px;
  padding: 8px 12px;
  background: #fff;
  cursor: pointer;
  border-bottom: 1px solid #f0f3f8;
  border-left: 3px solid transparent;
  transition: background 0.2s, box-shadow 0.2s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #fbfdff;
  box-shadow: inset 3px 0 0 #4f7cff;
}

.table-row.level-critical {
  border-left-color: #ef4444;
}

.table-row.level-high {
  border-left-color: #f97316;
}

.table-row.level-medium {
  border-left-color: #f59e0b;
}

.cell-price {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cell-price .price-val {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.cell-price .change-val {
  font-size: 0.76rem;
  font-weight: 500;
}

.change-val.up {
  color: #f56c6c;
}

.change-val.down {
  color: #67c23a;
}

.cell-stock {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stock-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-code {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.cell-level .level-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.72rem;
  font-weight: 600;
}

.level-tag.critical {
  background: #fef2f2;
  color: #dc2626;
}

.level-tag.high {
  background: #fff7ed;
  color: #ea580c;
}

.level-tag.medium {
  background: #fffbeb;
  color: #d97706;
}

.level-tag.low {
  background: #f1f5f9;
  color: #64748b;
}

.cell-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.kw-tag {
  font-size: 0.72rem;
  padding: 1px 7px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  white-space: nowrap;
}

.score-val {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1d4ed8;
}

.sector-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

@media (max-width: 640px) {
  .table-head,
  .table-row {
    grid-template-columns: 70px minmax(80px, 1fr) 48px 1fr;
  }
  .cell-score,
  .cell-sector,
  .table-head span:nth-child(5),
  .table-head span:nth-child(6) {
    display: none;
  }
}
</style>
