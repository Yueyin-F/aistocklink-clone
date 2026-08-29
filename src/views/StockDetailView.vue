<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import api from '../api'
import { useUserStore } from '../stores/user'
import NewsList from '../components/NewsList.vue'
import KlineChart from '../components/KlineChart.vue'
import MarkdownText from '../components/MarkdownText.vue'

const route = useRoute()
const userStore = useUserStore()
const code = computed(() => route.params.code)

const quote = ref(null)
const info = ref(null)
const klineData = ref(null)
const klineLoading = ref(false)
const period = ref('101')
const analysis = ref(null)
const analysisLoading = ref(false)
const history = ref([])
const news = ref([])
const newsLoading = ref(false)
const capitalFlow = ref(null)
const forecast = ref(null)
const semiAnnual = ref(null)
const loadingQuote = ref(true)
const activeTab = ref('quote')
const aiGenerating = ref(false)

const fmt = (v, d = '-') => (v === null || v === undefined || v === '' ? d : v)

async function loadQuote() {
  loadingQuote.value = true
  try {
    const [q, i] = await Promise.allSettled([
      api.getStockQuotesActivity(code.value),
      api.getStockInfos(code.value),
    ])
    if (q.status === 'fulfilled') quote.value = q.value?.行情?.[0] || null
    if (i.status === 'fulfilled') info.value = i.value?.股票信息?.[0] || null
  } catch (e) { /* ignore */ }
  loadingQuote.value = false
}

async function loadKline() {
  klineLoading.value = true
  klineData.value = null
  try {
    const data = await api.getKline({ symbol: code.value, klt: period.value, fqt: 1, limit: 200 })
    const rows = data?.行情 || data?.klines || []
    const dates = rows.map((r) => String(r.日期 || r.date || r.time || ''))
    const klines = rows.map((r) => [
      Number(r.收盘 || r.close),
      Number(r.开盘 || r.open),
      Number(r.最高 || r.high),
      Number(r.最低 || r.low),
      Number(r.成交量 || r.volume || 0),
    ])
    if (klines.length && klines.every((k) => k.slice(0, 4).every(Number.isFinite))) {
      klineData.value = { dates, klines }
    } else {
      klineData.value = genSyntheticKline()
    }
  } catch (e) {
    // 接口超时/不可用时：确定性模拟数据（种子=股票代码，刷新结果一致）
    klineData.value = genSyntheticKline()
  } finally {
    klineLoading.value = false
  }
}

// 确定性模拟K线（种子=股票代码，保证可复现，用于接口不可用时的降级展示）
function genSyntheticKline() {
  let seed = 0
  const s = String(code.value)
  for (const ch of s) seed = (seed * 31 + ch.charCodeAt(0)) | 0
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const n = 120
  const dates = []
  const klines = []
  let price = 30 + rand() * 120
  const now = dayjs()
  for (let i = n - 1; i >= 0; i--) {
    dates.push(now.subtract(i, 'day').format('YYYYMMDD'))
    const open = price
    const driftPct = (rand() - 0.49) * 0.04
    const close = Math.max(5, open * (1 + driftPct))
    const high = Math.max(open, close) * (1 + rand() * 0.015)
    const low = Math.min(open, close) * (1 - rand() * 0.015)
    const vol = Math.floor(1e5 + rand() * 5e6)
    klines.push([+close.toFixed(2), +open.toFixed(2), +high.toFixed(2), +low.toFixed(2), vol])
    price = close
  }
  return { dates, klines, synthetic: true }
}

// ===== Kronos AI 价格预测 =====
const prediction = ref(null)
const predictLoading = ref(false)
const predInfo = ref(null)
let predictPollTimer = null

async function runPrediction() {
  if (predictLoading.value) return
  predictLoading.value = true
  predInfo.value = null
  prediction.value = null
  try {
    // 1. 先查缓存
    const cache = await api.getPricePredictionCache(code.value)
    const entries = cache?.entries || []
    if (entries.length) {
      const latest = entries[entries.length - 1]
      prediction.value = latest?.result || latest
      emitPredInfo({ signal: prediction.value?.direction, summary: prediction.value?.summary, confidence: prediction.value?.confidence })
      ElMessage.success('已加载缓存的 AI 预测结果')
      return
    }
    // 2. 创建预测任务
    const task = await api.createPricePrediction({ symbol: code.value, lookback: 256, predLen: 5, sampleCount: 20, mode: 'simple' })
    const taskId = task?.task_id
    if (!taskId) throw new Error('缺少 task_id 参数')
    // 3. 轮询任务状态
    await pollPrediction(taskId)
  } catch (e) {
    ElMessage.error(e.message || 'AI 预测失败，请稍后重试')
  } finally {
    predictLoading.value = false
  }
}

async function pollPrediction(taskId) {
  const MAX_TRIES = 12
  for (let i = 0; i < MAX_TRIES; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    try {
      const res = await api.getPricePredictionTask(taskId)
      if (res?.status === 'done' && res.result) {
        prediction.value = res.result
        emitPredInfo({ signal: res.result.direction, summary: res.result.summary, confidence: res.result.confidence })
        ElMessage.success('AI 价格预测完成')
        return
      }
      if (res?.status === 'error' || res?.error) {
        throw new Error(res.error || '预测任务失败')
      }
    } catch (e) {
      if (e?.message && e.message !== '预测任务失败') throw e
    }
  }
  throw new Error('AI 预测超时，请稍后重试')
}

function emitPredInfo(info) {
  predInfo.value = info
}

async function loadAnalysis() {
  analysisLoading.value = true
  try {
    analysis.value = await api.getAnalysis(code.value)
  } catch (e) {
    analysis.value = null
  } finally {
    analysisLoading.value = false
  }
}

async function loadHistory() {
  try {
    const data = await api.getAnalysisHistory(1, 5)
    const list = data?.历史评价 || []
    // 仅显示当前股票的历史评价
    history.value = list.filter((h) => String(h.股票代码) === String(code.value))
    if (!history.value.length) history.value = list.slice(0, 3)
  } catch (e) {
    history.value = []
  }
}

async function loadNews() {
  newsLoading.value = true
  try {
    const data = await api.getStockNews(code.value, 10, 0)
    news.value = (data?.个股新闻 || []).map((n) => ({
      id: n.ID,
      title: n.标题,
      content: n.内容 || n.摘要,
      publish_time: n.时间,
      url: n.链接,
      author: '财联社',
    }))
  } catch (e) {
    news.value = []
  } finally {
    newsLoading.value = false
  }
}

async function loadCapitalFlow() {
  try {
    capitalFlow.value = await api.getCapitalFlow(code.value)
  } catch (e) {
    capitalFlow.value = null
  }
}

async function loadForecast() {
  try {
    forecast.value = await api.getStockProfitForecast(code.value)
  } catch (e) {
    forecast.value = null
  }
}

async function loadSemiAnnual() {
  try {
    semiAnnual.value = await api.getSemiAnnualReport(code.value)
  } catch (e) {
    semiAnnual.value = null
  }
}

async function refreshAnalysis() {
  aiGenerating.value = true
  try {
    await api.getAnalysis(code.value)
    ElMessage.success('已触发分析更新，请稍后查看最新结果')
  } catch (e) {
    ElMessage.error('分析更新失败')
  } finally {
    aiGenerating.value = false
  }
}

function toggleFavorite() {
  if (userStore.isFavorite(code.value)) {
    userStore.removeFavorite(code.value)
  } else {
    userStore.addFavorite({ code: code.value, name: quote.value?.股票简称 || info.value?.股票简称 || code.value })
  }
}

watch(code, () => {
  loadQuote()
  loadKline()
  loadAnalysis()
  loadNews()
  loadCapitalFlow()
  loadForecast()
  loadSemiAnnual()
  loadHistory()
})

onMounted(() => {
  loadQuote()
  loadKline()
  loadAnalysis()
  loadNews()
  loadCapitalFlow()
  loadForecast()
  loadSemiAnnual()
  loadHistory()
})

watch(period, loadKline)

const isUp = computed(() => (quote.value?.涨跌幅 ?? 0) >= 0)

function fmtAmount(v) {
  if (v == null) return '-'
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  if (v >= 1e4) return (v / 1e4).toFixed(2) + '万'
  return String(v)
}
</script>

<template>
  <div class="container">
    <!-- 行情头部 -->
    <div class="card quote-card" v-loading="loadingQuote">
      <div class="quote-head">
        <div class="stock-title">
          <h1 class="stock-name">{{ quote?.股票简称 || info?.股票简称 || code }}</h1>
          <span class="stock-code">{{ code }}</span>
          <el-tag v-if="info?.所属行业" size="small" type="info" effect="plain">{{ info.所属行业 }}</el-tag>
        </div>
        <div class="quote-actions">
          <el-button :type="userStore.isFavorite(code) ? 'warning' : 'default'" round size="small" @click="toggleFavorite">
            {{ userStore.isFavorite(code) ? '★ 已自选' : '☆ 加自选' }}
          </el-button>
        </div>
      </div>

      <div v-if="quote" class="quote-body">
        <div class="price-area">
          <span class="price" :class="isUp ? 'up' : 'down'">{{ quote.最新价 }}</span>
          <span class="change" :class="isUp ? 'up' : 'down'">
            {{ quote.涨跌额 >= 0 ? '+' : '' }}{{ quote.涨跌额 }}
            ({{ quote.涨跌幅 >= 0 ? '+' : '' }}{{ quote.涨跌幅 }}%)
          </span>
        </div>
        <div class="quote-stats">
          <div class="qs"><span class="l">今开</span><span class="v">{{ quote.今开价 }}</span></div>
          <div class="qs"><span class="l">昨收</span><span class="v">{{ quote.昨收价 }}</span></div>
          <div class="qs"><span class="l">最高</span><span class="v up">{{ quote.最高价 }}</span></div>
          <div class="qs"><span class="l">最低</span><span class="v down">{{ quote.最低价 }}</span></div>
          <div class="qs"><span class="l">成交量</span><span class="v">{{ fmtAmount(quote.成交量) }}</span></div>
          <div class="qs"><span class="l">成交额</span><span class="v">{{ fmtAmount(quote.成交额) }}</span></div>
          <div class="qs"><span class="l">换手率</span><span class="v">{{ fmt(quote.换手率) }}%</span></div>
          <div class="qs"><span class="l">市盈率</span><span class="v">{{ fmt(quote.市盈率) }}</span></div>
          <div class="qs"><span class="l">市净率</span><span class="v">{{ fmt(quote.市净率) }}</span></div>
          <div class="qs"><span class="l">量比</span><span class="v">{{ fmt(quote.量比) }}</span></div>
          <div class="qs"><span class="l">振幅</span><span class="v">{{ fmt(quote.振幅) }}%</span></div>
          <div class="qs"><span class="l">均价</span><span class="v">{{ fmt(quote.均价) }}</span></div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="detail-tabs">
      <!-- K线 -->
      <el-tab-pane label="K线" name="quote">
        <div class="card">
          <div class="toolbar">
            <el-radio-group v-model="period" size="small">
              <el-radio-button value="101">日K</el-radio-button>
              <el-radio-button value="102">周K</el-radio-button>
              <el-radio-button value="103">月K</el-radio-button>
            </el-radio-group>
            <div class="toolbar-right">
              <span v-if="klineData?.synthetic" class="muted" style="font-size: 0.78rem">
                （K线接口暂不可用，展示确定性模拟数据）
              </span>
              <el-button
                size="small"
                type="warning"
                plain
                :loading="predictLoading"
                @click="runPrediction"
              >{{ prediction ? '重新预测' : 'Kronos AI 价格预测' }}</el-button>
            </div>
          </div>
          <!-- 预测结论条 -->
          <div v-if="predInfo" class="pred-banner">
            <template v-if="predInfo.signal">
              <span class="pred-signal" :class="predInfo.signal.signal === 'bullish' ? 'bullish' : 'bearish'">
                {{ predInfo.signal.signal === 'bullish' ? '▲ 偏多' : '▼ 偏空' }}
              </span>
              <span class="muted">方向概率 {{ (predInfo.signal.probability * 100).toFixed(0) }}%</span>
              <span class="muted">· 置信度 {{ predInfo.confidence }}%</span>
              <span class="muted">· 预测收盘均值 {{ predInfo.summary?.mean_close }}</span>
              <span class="muted">· 区间 {{ predInfo.summary?.range_low }} ~ {{ predInfo.summary?.range_high }}</span>
            </template>
            <span v-else class="muted">预测结果加载中...</span>
          </div>
          <KlineChart
            :data="klineData"
            :loading="klineLoading"
            :prediction="prediction"
            :predict-loading="predictLoading"
            @pred-info="predInfo = $event"
          />
        </div>
      </el-tab-pane>

      <!-- AI分析 -->
      <el-tab-pane label="AI分析" name="analysis">
        <div class="card" v-loading="analysisLoading">
          <div class="toolbar">
            <div class="section-title" style="margin-bottom: 0">AI 智能分析</div>
            <el-button size="small" :loading="aiGenerating" @click="refreshAnalysis">重新分析</el-button>
          </div>
          <template v-if="analysis">
            <div class="analysis-conclusion">
              <span class="conclusion-label">结论</span>
              <el-tag size="large" :type="analysis.结论 === '看好' ? 'success' : analysis.结论 === '中性' ? 'warning' : 'danger'">
                {{ analysis.结论 }}
              </el-tag>
              <span class="muted" style="margin-left: 12px">分析时间: {{ dayjs(analysis.分析时间).format('YYYY-MM-DD HH:mm') }}</span>
            </div>
            <div class="analysis-block">
              <h3>核心逻辑</h3>
              <MarkdownText :text="analysis.核心逻辑" />
            </div>
            <div v-if="analysis.风险提示" class="analysis-block risk">
              <h3>风险提示</h3>
              <MarkdownText :text="analysis.风险提示" />
            </div>
          </template>
          <el-empty v-else-if="!analysisLoading" description="暂无分析数据，可点击重新分析生成" />
        </div>
      </el-tab-pane>

      <!-- 个股新闻 -->
      <el-tab-pane label="个股新闻" name="news">
        <div class="card">
          <div class="section-title">个股新闻</div>
          <NewsList :news="news" :loading="newsLoading" />
        </div>
      </el-tab-pane>

      <!-- 资金流向 -->
      <el-tab-pane label="资金流向" name="flow">
        <div class="card" v-loading="!capitalFlow && !loadingQuote">
          <template v-if="capitalFlow">
            <div class="section-title">资金流向</div>
            <div class="flow-grid">
              <div class="flow-item"><span class="l">主力净流入</span><span class="v" :class="capitalFlow.mainInflow >= 0 ? 'up' : 'down'">{{ capitalFlow.mainInflow }}亿</span></div>
              <div class="flow-item"><span class="l">散户净流入</span><span class="v" :class="capitalFlow.retailInflow >= 0 ? 'up' : 'down'">{{ capitalFlow.retailInflow }}亿</span></div>
              <div class="flow-item"><span class="l">5日累计</span><span class="v" :class="capitalFlow.fiveDay >= 0 ? 'up' : 'down'">{{ capitalFlow.fiveDay }}亿</span></div>
              <div class="flow-item"><span class="l">10日累计</span><span class="v" :class="capitalFlow.tenDay >= 0 ? 'up' : 'down'">{{ capitalFlow.tenDay }}亿</span></div>
              <div class="flow-item"><span class="l">20日累计</span><span class="v" :class="capitalFlow.twentyDay >= 0 ? 'up' : 'down'">{{ capitalFlow.twentyDay }}亿</span></div>
              <div class="flow-item"><span class="l">资金标签</span><span class="v">{{ capitalFlow.tag }}</span></div>
            </div>
            <div v-if="capitalFlow.narrative" class="flow-narrative">{{ capitalFlow.narrative }}</div>
            <div v-if="capitalFlow.risk" class="flow-risk">⚠ {{ capitalFlow.risk }}</div>
          </template>
          <el-empty v-else description="暂无资金流向数据" />
        </div>
      </el-tab-pane>

      <!-- 财务与预测 -->
      <el-tab-pane label="财务与预测" name="financial">
        <div class="card">
          <div class="section-title">业绩预测</div>
          <template v-if="forecast">
            <div class="forecast-summary">{{ forecast.摘要 }}</div>
            <el-table :data="forecast.业绩预测详表_详细指标预测 || []" size="small" border>
              <el-table-column prop="预测指标" label="预测指标" min-width="150" fixed />
              <el-table-column prop="2023-实际值" label="2023 实际" min-width="110" />
              <el-table-column prop="2024-实际值" label="2024 实际" min-width="110" />
              <el-table-column prop="2025-实际值" label="2025 实际" min-width="110" />
              <el-table-column prop="预测2026-平均" label="2026 预测" min-width="110">
                <template #default="{ row }"><b>{{ row['预测2026-平均'] }}</b></template>
              </el-table-column>
              <el-table-column prop="预测2027-平均" label="2027 预测" min-width="110" />
              <el-table-column prop="预测2028-平均" label="2028 预测" min-width="110" />
            </el-table>
            <div class="muted" style="margin-top: 8px">来源: {{ forecast.来源 }} · 更新: {{ dayjs(forecast.更新时间).format('YYYY-MM-DD') }}</div>
          </template>
          <el-empty v-else description="暂无业绩预测数据" :image-size="80" />
        </div>
        <div v-if="semiAnnual" class="card">
          <div class="section-title">半年报数据</div>
          <pre class="semi-body">{{ typeof semiAnnual === 'string' ? semiAnnual : JSON.stringify(semiAnnual, null, 2) }}</pre>
        </div>
      </el-tab-pane>

      <!-- 历史评价 -->
      <el-tab-pane label="历史评价" name="history">
        <div class="card">
          <div class="section-title">历史 AI 评价</div>
          <template v-if="history.length">
            <div v-for="h in history" :key="h.分析时间" class="history-item">
              <div class="history-head">
                <el-tag size="small" :type="h.结论 === '看好' ? 'success' : h.结论 === '中性' ? 'warning' : 'danger'">{{ h.结论 }}</el-tag>
                <span class="muted">{{ dayjs(h.分析时间).format('YYYY-MM-DD HH:mm') }}</span>
              </div>
              <MarkdownText :text="h.核心逻辑" />
              <div v-if="h.风险提示" class="history-risk">风险提示：{{ h.风险提示 }}</div>
            </div>
          </template>
          <el-empty v-else description="暂无历史评价" :image-size="80" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.quote-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.stock-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stock-name {
  font-size: 1.5rem;
  font-weight: 700;
}

.stock-code {
  color: var(--text-tertiary);
}

.quote-body {
  margin-top: 16px;
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.price {
  font-size: 2.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.change {
  display: inline-block;
  margin-left: 12px;
  font-size: 1rem;
  font-weight: 600;
}

.quote-stats {
  flex: 1;
  min-width: 320px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px 20px;
}

.qs {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 4px;
}

.qs .l {
  color: var(--text-tertiary);
}

.qs .v {
  font-variant-numeric: tabular-nums;
}

.detail-tabs {
  background: transparent;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pred-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  background: var(--bg-soft);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.pred-signal {
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 0.8rem;
}

.pred-signal.bullish {
  background: rgba(245, 108, 108, 0.14);
  color: var(--up-color);
}

.pred-signal.bearish {
  background: rgba(103, 194, 58, 0.14);
  color: var(--down-color);
}

.analysis-conclusion {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 1rem;
}

.conclusion-label {
  font-weight: 600;
}

.analysis-block {
  margin-top: 12px;
}

.analysis-block h3 {
  font-size: 1rem;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.analysis-block.risk h3 {
  color: var(--up-color);
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.flow-item {
  background: #f9fafc;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.flow-item .l {
  color: var(--text-tertiary);
}

.flow-item .v {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.flow-narrative {
  background: #f0f7ff;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-secondary);
}

.flow-risk {
  margin-top: 8px;
  color: var(--up-color);
  font-size: 0.9rem;
}

.forecast-summary {
  background: #f9fafc;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.7;
}

.history-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.history-item:last-child {
  border-bottom: none;
}

.history-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.history-risk {
  margin-top: 10px;
  font-size: 0.85rem;
  color: var(--up-color);
}

.semi-body {
  white-space: pre-wrap;
  font-size: 0.85rem;
  line-height: 1.7;
  color: var(--text-secondary);
  max-height: 400px;
  overflow-y: auto;
}
</style>
