<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const props = defineProps({
  title: { type: String, default: '' },
  stocks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无数据' },
  showViewMore: { type: Boolean, default: false },
})

const emit = defineEmits(['view-detail', 'toggle-favorite', 'view-more'])

const router = useRouter()
const userStore = useUserStore()
const loadingStates = ref({})

function isFavorite(code) {
  return userStore.isFavorite(code)
}

function getMarketCode(code) {
  if (!code) return ''
  if (code.startsWith('6') || code.startsWith('9')) return 'SH'
  if (code.startsWith('0') || code.startsWith('3')) return 'SZ'
  if (code.startsWith('4') || code.startsWith('8')) return 'BJ'
  return ''
}

function fmtPrice(v) {
  if (v == null || v === '') return '--'
  const n = Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n.toFixed(2) : '--'
}

function fmtPct(v) {
  if (v == null || v === '') return '--'
  const n = Number(String(v).replace(/%/g, ''))
  return Number.isFinite(n) ? (n >= 0 ? '+' : '') + n.toFixed(2) + '%' : '--'
}

function changeClass(stock) {
  const v = stock.change ?? stock.change_percent ?? stock.change_pct
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  return n >= 0 ? 'stock-up' : 'stock-down'
}

function onToggleFavorite(stock) {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后才能添加自选股')
    router.push('/login')
    return
  }
  loadingStates.value[stock.code] = true
  try {
    emit('toggle-favorite', stock)
  } finally {
    setTimeout(() => {
      loadingStates.value[stock.code] = false
    }, 300)
  }
}

function onViewDetail(stock) {
  emit('view-detail', stock)
}
</script>

<template>
  <div class="stock-card-list">
    <h3 v-if="title" class="section-title">{{ title }}</h3>
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>
    <template v-else-if="stocks.length">
      <div class="stock-cards">
        <div v-for="s in stocks" :key="s.code" class="stock-card">
          <div class="stock-info">
            <div class="stock-header">
              <h4 class="stock-name" @click.stop="onViewDetail(s)">{{ s.name }}</h4>
              <span v-if="s.industry" class="stock-industry">{{ s.industry }}</span>
            </div>
            <p class="stock-code">
              <span v-if="getMarketCode(s.code)" class="market-code">{{ getMarketCode(s.code) }}</span>
              {{ s.code }}
            </p>
            <div class="stock-metrics">
              <div class="metric">
                <span class="label">最新价</span>
                <span class="value">{{ fmtPrice(s.price ?? s.latest_price ?? s.latestPrice) }}</span>
              </div>
              <div class="metric">
                <span class="label">涨跌幅</span>
                <span class="value" :class="changeClass(s)">{{ fmtPct(s.change ?? s.change_percent ?? s.change_pct ?? s.changeRate) }}</span>
              </div>
              <slot name="extra-info" :stock="s"></slot>
            </div>
            <slot name="item-content" :stock="s"></slot>
          </div>
          <div class="stock-actions">
            <el-button size="small" type="primary" plain @click="onViewDetail(s)">查看详情</el-button>
            <slot name="favorite-button" :stock="s" :loading="loadingStates[s.code]">
              <el-button
                size="small"
                :type="isFavorite(s.code) ? 'danger' : 'primary'"
                plain
                :loading="loadingStates[s.code]"
                @click="onToggleFavorite(s)"
              >{{ isFavorite(s.code) ? '取消关注' : '添加关注' }}</el-button>
            </slot>
            <slot name="extra-actions" :stock="s"></slot>
          </div>
        </div>
      </div>
      <div v-if="showViewMore" class="view-more">
        <slot name="view-more">
          <el-button type="primary" plain @click="emit('view-more')">查看更多</el-button>
        </slot>
      </div>
    </template>
    <slot v-else name="empty">
      <el-empty :description="emptyText" :image-size="70" />
    </slot>
  </div>
</template>

<style scoped>
.stock-card-list .section-title {
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 15px 0;
}

.loading-container {
  padding: 20px 0;
}

.stock-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stock-card {
  flex: 1 1 calc(33.333% - 10px);
  max-width: calc(33.333% - 10px);
  min-width: 220px;
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
}

.stock-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.stock-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
  cursor: pointer;
}

.stock-name:hover {
  text-decoration: underline;
}

.stock-industry {
  font-size: 0.7rem;
  background: #eff6ff;
  color: #2563eb;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
}

.stock-code {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.market-code {
  font-size: 0.68rem;
  font-weight: 700;
  color: #1677ff;
  padding: 1px 4px;
  border: 1px solid #d6e4ff;
  background: #f0f5ff;
  border-radius: 3px;
  margin-right: 4px;
}

.stock-metrics {
  display: flex;
  gap: 18px;
}

.metric {
  display: flex;
  flex-direction: column;
}

.metric .label {
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

.metric .value {
  font-weight: 600;
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
}

.value.stock-up {
  color: #f56c6c;
}

.value.stock-down {
  color: #67c23a;
}

.stock-actions {
  display: flex;
  gap: 8px;
}

.view-more {
  text-align: center;
  margin-top: 14px;
}
</style>
