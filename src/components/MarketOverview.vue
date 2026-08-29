<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

// 指数列表（与原站一致）
const INDEX_DEFS = [
  { code: '000001', name: '上证指数' },
  { code: '399001', name: '深证成指' },
  { code: '399006', name: '创业板指' },
  { code: '000300', name: '沪深300' },
]

const indexes = ref([])
const loading = ref(true)

function getIndexUrl(code) {
  const map = {
    '000001': 'https://quote.eastmoney.com/zs000001.html',
    '399001': 'https://quote.eastmoney.com/zs399001.html',
    '399006': 'https://quote.eastmoney.com/zs399006.html',
    '000300': 'https://quote.eastmoney.com/zs000300.html',
  }
  return map[code] || 'https://quote.eastmoney.com/'
}

const fmtValue = (v) => (v == null ? '--' : Number(v).toFixed(2))
const fmtChangeAmount = (v) => (v == null ? '--' : (v >= 0 ? '+' : '') + Number(v).toFixed(2))
const fmtChange = (v) => (v == null ? '--' : (v >= 0 ? '+' : '') + Number(v).toFixed(2) + '%')
const tone = (v) => (v == null ? '' : v >= 0 ? 'up' : 'down')

async function load() {
  loading.value = true
  try {
    const data = await api.getIndexQuotes(INDEX_DEFS.map((i) => i.code).join(','))
    const map = {}
    ;(data?.行情 || []).forEach((q) => {
      map[q.指数代码] = { value: q.最新价, change: q.涨跌幅, changeAmount: q.涨跌额 }
    })
    indexes.value = INDEX_DEFS.map((d) => ({
      indexKey: d.code,
      name: d.name,
      indexCode: d.code,
      value: map[d.code]?.value,
      change: map[d.code]?.change,
      changeAmount: map[d.code]?.changeAmount,
    }))
  } catch (e) {
    indexes.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="market-overview" v-loading="loading">
    <div v-if="indexes.length" class="market-cards">
      <div v-for="idx in indexes" :key="idx.indexKey" class="market-card">
        <div class="index-name">
          <a :href="getIndexUrl(idx.indexCode)" target="_blank" class="index-link">{{ idx.name }}</a>
        </div>
        <div class="index-value" :class="tone(idx.change)">{{ fmtValue(idx.value) }}</div>
        <div class="change-row" :class="tone(idx.change)">
          <span class="metric-number">{{ fmtChangeAmount(idx.changeAmount) }}</span>
          <span class="metric-number">{{ fmtChange(idx.change) }}</span>
        </div>
        <span class="index-code">{{ idx.indexCode }}</span>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="暂无市场指数数据" :image-size="70" />
  </div>
</template>

<style scoped>
.market-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.market-card {
  flex: 1 0 calc(50% - 10px);
  min-width: 120px;
  background: #fff;
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f2f5;
}

.index-name {
  margin-bottom: 4px;
}

.index-link {
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}

.index-link:hover {
  color: var(--primary-color);
}

.index-value {
  font-size: 1.35rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.index-value.up {
  color: #f56c6c;
}

.index-value.down {
  color: #67c23a;
}

.change-row {
  display: flex;
  gap: 10px;
  margin-top: 2px;
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
}

.change-row.up {
  color: #f56c6c;
}

.change-row.down {
  color: #67c23a;
}

.index-code {
  color: var(--text-tertiary);
  font-size: 0.75rem;
}
</style>
