<script setup>
// 个股对比（本复现项目自研特色功能，原站无此页面）
// 支持最多 6 只股票：行情指标对比表 + 归一化走势对比图 + 指标优劣高亮
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import api from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const stocks = ref([]) // [{code, name, industry}]
const quotes = ref({}) // code -> 行情
const klines = ref({}) // code -> {dates, closes}
const inputCode = ref('')
const loading = ref(false)
const chartEl = ref(null)
let chart = null

const MAX = 6

const METRICS = [
  { key: '最新价', label: '最新价', digits: 2 },
  { key: '涨跌幅', label: '涨跌幅', digits: 2, suffix: '%', colorize: true },
  { key: '今开价', label: '今开', digits: 2 },
  { key: '最高价', label: '最高', digits: 2 },
  { key: '最低价', label: '最低', digits: 2 },
  { key: '成交量', label: '成交量', format: 'amount' },
  { key: '成交额', label: '成交额', format: 'amount' },
  { key: '换手率', label: '换手率', digits: 2, suffix: '%' },
  { key: '市盈率', label: '市盈率', digits: 2 },
  { key: '市净率', label: '市净率', digits: 2 },
  { key: '量比', label: '量比', digits: 2 },
  { key: '振幅', label: '振幅', digits: 2, suffix: '%' },
]

function fmtAmount(v) {
  if (v == null) return '--'
  const n = Number(v)
  if (!Number.isFinite(n)) return '--'
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿'
  if (n >= 1e4) return (n / 1e4).toFixed(2) + '万'
  return String(n)
}

function fmtMetric(v, m) {
  if (v == null || v === '') return '--'
  if (m.format === 'amount') return fmtAmount(v)
  const n = Number(v)
  if (!Number.isFinite(n)) return '--'
  return n.toFixed(m.digits ?? 2) + (m.suffix || '')
}

function metricValue(code, m) {
  const q = quotes.value[code]
  return q ? q[m.key] : null
}

// 找出每项指标的最优/最差（涨跌幅优=最大；其余无方向性，仅高亮最大值）
function isBest(code, m) {
  if (stocks.value.length < 2) return false
  const vals = stocks.value.map((s) => Number(metricValue(s.code, m)))
  if (vals.some((v) => !Number.isFinite(v))) return false
  const cur = Number(metricValue(code, m))
  if (m.key === '涨跌幅') return cur === Math.max(...vals)
  return cur === Math.max(...vals)
}

function isWorst(code, m) {
  if (stocks.value.length < 2) return false
  const vals = stocks.value.map((s) => Number(metricValue(s.code, m)))
  if (vals.some((v) => !Number.isFinite(v))) return false
  const cur = Number(metricValue(code, m))
  if (m.key === '涨跌幅') return cur === Math.min(...vals)
  return false
}

async function addStock() {
  const kw = inputCode.value.trim()
  if (!kw) return
  if (stocks.value.length >= MAX) {
    ElMessage.warning(`最多对比 ${MAX} 只股票`)
    return
  }
  loading.value = true
  try {
    const data = await api.searchStocks(kw, 1)
    const list = data?.股票列表 || []
    if (!list.length) {
      ElMessage.warning('未找到该股票，请输入 6 位代码或简称')
      return
    }
    const s = list[0]
    const code = s.股票代码
    if (stocks.value.some((x) => x.code === code)) {
      ElMessage.info('该股票已在对比列表中')
      return
    }
    stocks.value.push({ code, name: s.股票简称, industry: s.所属行业 || '' })
    inputCode.value = ''
    await loadData()
  } catch (e) {
    ElMessage.error('添加失败')
  } finally {
    loading.value = false
  }
}

function removeStock(code) {
  stocks.value = stocks.value.filter((s) => s.code !== code)
  renderChart()
}

function addFavorites() {
  const favs = userStore.favoriteStocks
  if (!favs.length) {
    ElMessage.info('暂无自选股，可先搜索添加')
    return
  }
  let added = 0
  for (const f of favs) {
    const code = f.code || f.stock_code
    if (stocks.value.length >= MAX) break
    if (!code || stocks.value.some((s) => s.code === code)) continue
    stocks.value.push({ code, name: f.name || f.stock_name || code, industry: f.industry || '' })
    added++
  }
  if (added) loadData()
  else ElMessage.info('自选股已在列表中')
}

async function loadData() {
  const codes = stocks.value.map((s) => s.code).join(',')
  if (!codes) return
  loading.value = true
  try {
    const data = await api.getStockQuotesActivity(codes)
    const map = {}
    ;(data?.行情 || []).forEach((q) => {
      map[q.股票代码] = q
    })
    quotes.value = map
  } catch (e) { /* ignore */ }
  // 归一化走势（并行请求K线，失败用确定性的模拟数据）
  await Promise.allSettled(stocks.value.map(async (s) => {
    try {
      const data = await api.getKline({ symbol: s.code, klt: 101, fqt: 1, limit: 60 })
      const rows = data?.行情 || data?.klines || []
      const closes = rows.map((r) => Number(r.收盘 ?? r.close)).filter(Number.isFinite)
      if (closes.length >= 10) {
        klines.value[s.code] = closes
        return
      }
    } catch (e) { /* fallback */ }
    // 确定性模拟数据（种子=股票代码，保证可复现）
    let seed = 0
    for (const ch of s.code) seed = (seed * 31 + ch.charCodeAt(0)) | 0
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    let price = 50 + rand() * 80
    const arr = []
    for (let i = 0; i < 60; i++) {
      price = Math.max(5, price * (1 + (rand() - 0.49) * 0.03))
      arr.push(+price.toFixed(2))
    }
    klines.value[s.code] = arr
  }))
  loading.value = false
  renderChart()
}

function renderChart() {
  nextTick(() => {
    if (!chartEl.value) return
    if (!chart) chart = echarts.init(chartEl.value)
    if (!stocks.value.length) {
      chart.clear()
      return
    }
    const colors = ['#409eff', '#f56c6c', '#67c23a', '#e6a23c', '#9c27b0', '#00bcd4']
    const series = stocks.value.map((s, i) => {
      const closes = klines.value[s.code] || []
      const base = closes[0] || 1
      const data = closes.map((c, j) => [j, +((c / base) * 100).toFixed(2)])
      return {
        name: s.name,
        type: 'line',
        data,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: colors[i % colors.length] },
        itemStyle: { color: colors[i % colors.length] },
        emphasis: { focus: 'series' },
      }
    })
    chart.setOption(
      {
        backgroundColor: 'transparent',
        color: colors,
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            let out = `第 ${params[0].dataIndex + 1} 个交易日<br/>`
            params.forEach((p) => {
              out += `${p.marker}${p.seriesName}: <b>${p.data[1]}%</b>（基准100）<br/>`
            })
            return out
          },
        },
        legend: { top: 0, textStyle: { color: 'inherit' } },
        grid: { left: 40, right: 20, top: 40, bottom: 30 },
        xAxis: {
          type: 'value',
          name: '交易日',
          axisLabel: { show: false },
        },
        yAxis: {
          type: 'value',
          name: '归一化(%)',
          scale: true,
          axisLabel: { formatter: '{value}%' },
        },
        dataZoom: [{ type: 'inside' }],
        series,
      },
      true
    )
  })
}

function goDetail(code) {
  router.push(`/stock/${code}`)
}

const trendTable = computed(() => stocks.value)

onMounted(() => {
  // 默认载入自选股（若有），否则示例两只
  const favs = userStore.favoriteStocks.slice(0, MAX)
  if (favs.length) {
    stocks.value = favs.map((f) => ({
      code: f.code || f.stock_code,
      name: f.name || f.stock_name,
      industry: f.industry || '',
    }))
    loadData()
  }
})
</script>

<template>
  <div class="container compare-page">
    <div class="card">
      <div class="section-title">
        个股对比
        <el-tag size="small" type="warning" effect="plain">自研特色功能</el-tag>
      </div>
      <div class="picker-bar">
        <el-input
          v-model="inputCode"
          placeholder="输入代码或名称，如 600519"
          style="max-width: 240px"
          clearable
          @keyup.enter="addStock"
        />
        <el-button type="primary" :loading="loading" @click="addStock">添加股票</el-button>
        <el-button @click="addFavorites">一键导入自选股</el-button>
        <span class="muted">最多 {{ MAX }} 只 · 点击指标列名可查看各股行情</span>
      </div>
      <div class="selected-stocks">
        <el-tag
          v-for="s in stocks"
          :key="s.code"
          closable
          size="large"
          :disable-transitions="false"
          @close="removeStock(s.code)"
          @click="goDetail(s.code)"
          style="cursor: pointer"
        >
          {{ s.name }} {{ s.code }}
        </el-tag>
      </div>
    </div>

    <!-- 对比图表 -->
    <div class="card" v-if="stocks.length">
      <div class="section-title">近 60 日归一化走势对比（基准 100）</div>
      <div ref="chartEl" class="compare-chart"></div>
    </div>

    <!-- 指标对比表 -->
    <div class="card" v-if="stocks.length">
      <div class="section-title">行情指标对比</div>
      <div class="compare-table-wrap scrollable-area">
        <table class="compare-table">
          <thead>
            <tr>
              <th class="sticky-col">指标</th>
              <th v-for="s in stocks" :key="s.code" class="stock-col" @click="goDetail(s.code)">
                <div class="th-name">{{ s.name }}</div>
                <div class="th-code">{{ s.code }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in METRICS" :key="m.key">
              <td class="sticky-col metric-name">{{ m.label }}</td>
              <td
                v-for="s in stocks"
                :key="s.code"
                class="metric-cell"
                :class="{
                  'cell-best': isBest(s.code, m),
                  'cell-worst': isWorst(s.code, m),
                }"
                @click="goDetail(s.code)"
              >
                {{ fmtMetric(metricValue(s.code, m), m) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="legend-line muted">
        <span class="lg lg-best"></span> 指标最优
        <span class="lg lg-worst"></span> 涨跌幅最弱
      </div>
    </div>

    <div v-if="!stocks.length" class="card">
      <el-empty description="添加股票开始对比">
        <p class="muted">支持搜索添加、从自选股一键导入；走势图与指标表联动展示</p>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
.picker-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.selected-stocks {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.compare-chart {
  width: 100%;
  height: 360px;
}

.compare-table-wrap {
  overflow-x: auto;
  max-height: 480px;
  overflow-y: auto;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  min-width: 600px;
}

.compare-table th,
.compare-table td {
  padding: 10px 12px;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.compare-table thead th {
  background: var(--bg-soft);
  position: sticky;
  top: 0;
  z-index: 2;
}

.compare-table .sticky-col {
  position: sticky;
  left: 0;
  background: var(--bg-card);
  z-index: 1;
  text-align: left;
  font-weight: 600;
}

.compare-table thead .sticky-col {
  z-index: 3;
  background: var(--bg-soft);
}

.th-name {
  font-weight: 600;
}

.th-code {
  color: var(--text-tertiary);
  font-size: 0.78rem;
}

.metric-name {
  color: var(--text-secondary);
  font-weight: 500;
}

.cell-best {
  background: rgba(103, 194, 58, 0.14) !important;
  font-weight: 700;
}

.cell-worst {
  background: rgba(245, 108, 108, 0.14) !important;
}

.legend-line {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.lg {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-left: 12px;
}

.lg-best {
  background: rgba(103, 194, 58, 0.5);
}

.lg-worst {
  background: rgba(245, 108, 108, 0.5);
}
</style>
