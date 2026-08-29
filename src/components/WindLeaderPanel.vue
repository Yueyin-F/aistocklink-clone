<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { useUserStore } from '../stores/user'

const props = defineProps({
  sectors: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  updateTime: { type: String, default: '' },
  cacheTime: { type: String, default: '' },
})

const emit = defineEmits(['retry'])

const router = useRouter()
const userStore = useUserStore()

const bubbleEl = ref(null)
const bubbleElTop = ref(null)
let chart = null
let chartTop = null

// ===== 数据处理 =====
const displayBubbles = computed(() =>
  props.sectors.slice(0, 8).map((s) => ({
    name: s.name,
    change: s.today_change || 0,
    frequency: s.frequency || 0,
    score: s.score || 0,
    persistence: s.ai_analysis?.persistence || derivePersistence(s),
  }))
)

function derivePersistence(s) {
  const days = s.ai_analysis?.long_term_days
  if (days == null) return '短期(1-3天)'
  if (days >= 60) return `长期(${days}天)`
  if (days >= 30) return `中期(${days}天)`
  return '短期(1-3天)'
}

function persistenceTier(p) {
  return (p || '').includes('长期') ? 3 : (p || '').includes('中期') ? 2 : 1
}

// 龙头股卡片（每个板块取 long_leader → leading_stock_info → main_stocks 第一个未重复）
const displayStocks = computed(() => {
  const sorted = [...props.sectors].sort((a, b) => (b.score || 0) - (a.score || 0))
  const seen = new Set()
  const out = []
  for (const s of sorted) {
    if (out.length >= 8) break
    const candidates = []
    const ll = s.long_leader
    if (ll && ll.code) candidates.push({ ...ll, track: s.name, score: ll.change_pct ?? 0 })
    const lsi = s.leading_stock_info
    if (lsi && lsi.code) candidates.push({ ...lsi, track: s.name, score: lsi.change_pct ?? 0 })
    ;(s.main_stocks || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0)).forEach((m) => candidates.push({ ...m, track: s.name }))
    for (const c of candidates) {
      if (!seen.has(c.code)) {
        seen.add(c.code)
        out.push({
          code: c.code,
          name: c.name,
          track: s.name,
          industry: c.industry || '',
          latestPrice: c.price != null ? String(c.price) : '--',
          changeRate: c.change_pct != null ? Number(c.change_pct) : 0,
          reason: c.reason || '',
        })
        break
      }
    }
  }
  return out
})

const displayUpdateTime = computed(() => {
  if (props.updateTime) return props.updateTime
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isFollowed = (code) => userStore.isFavorite(code)
const followLoading = ref({})

async function toggleFollow(stock) {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后才能添加自选股')
    router.push('/login')
    return
  }
  const code = stock.code
  followLoading.value = { ...followLoading.value, [code]: true }
  try {
    if (isFollowed(code)) {
      await userStore.removeFavorite(code)
      ElMessage.success(`已取消关注 ${stock.name}`)
    } else {
      await userStore.addFavorite({ code, name: stock.name })
      ElMessage.success(`已添加 ${stock.name} 到自选股`)
    }
  } catch (e) {
    ElMessage.error('操作失败，请稍后再试')
  } finally {
    followLoading.value = { ...followLoading.value, [code]: false }
  }
}

function goToStockByCode(code) {
  if (code) router.push(`/stock/${code}`)
}

function goToHistoryPerformance() {
  router.push('/potential-push-history')
}

// ===== 风口详情弹窗 =====
const modalVisible = ref(false)
const currentSector = ref(null)
const modalTitle = ref('')

function openDetail(sector) {
  currentSector.value = sector
  modalTitle.value = sector.name + ' - 风口详情'
  modalVisible.value = true
}

const fmtChange = (v) => {
  const t = parseFloat(v)
  return isNaN(t) ? '--' : (t >= 0 ? '+' : '') + t.toFixed(2) + '%'
}
const fmtAmount = (v) => {
  const t = parseFloat(v)
  if (isNaN(t) || t === 0) return '--'
  const y = t / 1e8
  return Math.abs(y) >= 1 ? y.toFixed(2) + '亿' : (t / 1e4).toFixed(0) + '万'
}
const getMarketCode = (code) => {
  if (!code) return ''
  if (code.startsWith('6') || code.startsWith('9')) return 'SH'
  if (code.startsWith('0') || code.startsWith('3')) return 'SZ'
  if (code.startsWith('4') || code.startsWith('8')) return 'BJ'
  return ''
}
const fmtPrice = (p) => (p != null ? Number(p).toFixed(2) : '--')
const fmtPct = (p) => (p != null ? (p > 0 ? '+' : '') + Number(p).toFixed(2) + '%' : '--')
const pnlClass = (p) => (p > 0 ? 'pnl-up' : p < 0 ? 'pnl-down' : 'pnl-flat')

// ===== 气泡图（ECharts force）=====
function renderBubble(el, chartRef) {
  if (!el) return
  if (!chartRef) chartRef = echarts.init(el)
  const nodes = displayBubbles.value.map((b) => {
    const tier = persistenceTier(b.persistence)
    const ranges = { 1: [22, 28], 2: [32, 40], 3: [45, 60] }
    const [rMin, rMax] = ranges[tier]
    return {
      id: b.name,
      name: b.name,
      value: b.frequency,
      score: b.score,
      persistence: b.persistence,
      symbolSize: rMin + (rMax - rMin) * 0.5,
      tier,
    }
  })
  const scores = nodes.map((n) => n.score)
  const minS = Math.min(...scores, 0)
  const maxS = Math.max(...scores, 1)
  const colorOf = (s) => {
    const t = maxS > minS ? (s - minS) / (maxS - minS) : 0.5
    // #bfdbfe → #1d4ed8
    const r = Math.round(0xbf + (0x1d - 0xbf) * t)
    const g = Math.round(0xdb + (0x4e - 0xdb) * t)
    const b = Math.round(0xfe + (0xd8 - 0xfe) * t)
    return `rgb(${r},${g},${b})`
  }
  chartRef.setOption({
    tooltip: {
      formatter: (p) => {
        const n = p.data
        return `${n.name}<br/>热度分: ${n.score}<br/>上榜: ${n.value}次<br/>${n.persistence}`
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        force: { repulsion: 420, edgeLength: [100, 160], gravity: 0.06, friction: 0.6 },
        // 标签置于气泡外部并隐藏重叠，避免文字互相遮挡
        label: {
          show: true,
          position: 'right',
          distance: 6,
          fontSize: 11,
          fontWeight: 600,
          color: '#374151',
          formatter: (p) => p.data.name.slice(0, 4) + (p.data.name.length > 4 ? '..' : ''),
        },
        labelLayout: { hideOverlap: true, moveOverlap: 'shiftY' },
        emphasis: { focus: 'adjacency', scale: 1.25 },
        data: nodes.map((n) => ({
          ...n,
          itemStyle: { color: colorOf(n.score), borderColor: '#fff', borderWidth: 2, opacity: 0.9 },
        })),
      },
    ],
  })
  chartRef.off('click')
  chartRef.on('click', (params) => {
    if (params.dataType === 'node') {
      const idx = displayBubbles.value.findIndex((b) => b.name === params.data.name)
      if (idx >= 0 && props.sectors[idx]) openDetail(props.sectors[idx])
    }
  })
  return chartRef
}

function resizeAll() {
  try {
    chart && chart.resize()
    chartTop && chartTop.resize()
  } catch (e) { /* ignore */ }
}

watch(displayBubbles, () => nextTick(() => {
  chart = renderBubble(bubbleEl.value, chart)
  chartTop = renderBubble(bubbleElTop.value, chartTop)
}), { deep: true })

onMounted(() => {
  nextTick(() => {
    chart = renderBubble(bubbleEl.value, chart)
    chartTop = renderBubble(bubbleElTop.value, chartTop)
  })
  window.addEventListener('resize', resizeAll)
})

// ===== 传导流图（简化 SVG，自动防重叠布局）=====
const flowLayout = computed(() => {
  const s = currentSector.value
  if (!s || !s.flow_data) return null
  const { nodes, links } = s.flow_data
  const W = 520
  const ROW_H = 76 // 行距（防止节点重叠）
  const main = nodes.find((n) => n.type === 'main')
  const related = nodes.filter((n) => n.type === 'related')
  const upstream = nodes.filter((n) => n.type === 'upstream')
  const downstream = nodes.filter((n) => n.type === 'downstream')

  const totalRows = Math.max(upstream.length, downstream.length, related.length, 1)
  const H = Math.max(110, 60 + totalRows * ROW_H)
  const yOf = (i, total) => H / 2 + (i - (total - 1) / 2) * ROW_H

  const pos = {}
  if (main) pos[main.id] = { x: W / 2, y: H / 2 }
  if (related.length) {
    related.forEach((n, i) => {
      pos[n.id] = { x: W / 2, y: 26 + i * ROW_H }
    })
    // 有相关行业时，上游靠左、下游靠右，纵向按各自数量居中
    upstream.forEach((n, i) => { pos[n.id] = { x: 100, y: yOf(i, Math.max(upstream.length, 1)) } })
    downstream.forEach((n, i) => { pos[n.id] = { x: W - 100, y: yOf(i, Math.max(downstream.length, 1)) } })
  } else if (main) {
    upstream.forEach((n, i) => { pos[n.id] = { x: 100, y: yOf(i, Math.max(upstream.length, 1)) } })
    downstream.forEach((n, i) => { pos[n.id] = { x: W - 100, y: yOf(i, Math.max(downstream.length, 1)) } })
  } else {
    nodes.forEach((n, i) => { pos[n.id] = { x: W / 2, y: 30 + i * ROW_H } })
  }
  const renderNodes = nodes.map((n) => {
    const label = String(n.label || n.id || '').replace(/\(A股\)$/, '')
    return { ...n, label: label.length > 8 ? label.slice(0, 8) + '…' : label, x: pos[n.id]?.x ?? W / 2, y: pos[n.id]?.y ?? H / 2 }
  })
  return { W, H, nodes: renderNodes, links }
})

const flowNodeStyle = (type) => {
  switch (type) {
    case 'main': return { fill: '#dbeafe', stroke: '#2563eb' }
    case 'related': return { fill: '#ede9fe', stroke: '#7c3aed' }
    case 'upstream': return { fill: '#fffbeb', stroke: '#d97706' }
    case 'downstream': return { fill: '#f0fdf4', stroke: '#16a34a' }
    default: return { fill: '#f3f4f6', stroke: '#6b7280' }
  }
}
const flowLinkColor = (d) => (d === 'upstream' ? '#d97706' : d === 'downstream' ? '#16a34a' : '#94a3b8')

const groupThead = [['hs-detail-name', '名称'], ['hs-detail-industry', '行业'], ['col-price', '价格'], ['col-pnl', '盈亏'], ['hs-detail-reason', '理由']]

// 模板辅助函数
function linkPath(l, layout) {
  const s = layout.nodes.find((n) => n.id === l.source)
  const t = layout.nodes.find((n) => n.id === l.target)
  if (!s || !t) return ''
  const midX = (s.x + t.x) / 2
  if (l.direction === 'related') {
    return `M${s.x},${s.y} L${t.x},${t.y}`
  }
  return `M${s.x},${s.y} C${midX},${s.y} ${midX},${t.y} ${t.x},${t.y}`
}
function labelWidth(n) {
  const len = String(n.label || '').replace(/\(A股\)$/, '').length
  return len * 12 + 12
}
</script>

<template>
  <div class="hot-sector-panel">
    <!-- 头部 -->
    <div class="hs-header">
      <h3 class="section-title">长线风口龙头</h3>
      <div class="hs-header-actions">
        <el-tag v-if="cacheTime" size="small" type="info" effect="plain">缓存数据 {{ cacheTime }}</el-tag>
        <span v-if="displayUpdateTime" class="hs-header-meta">更新时间: {{ displayUpdateTime }}</span>
        <el-button class="hs-history-btn" type="primary" plain size="small" @click="goToHistoryPerformance">
          查看历史表现
        </el-button>
      </div>
    </div>

    <div v-if="loading && !sectors.length" class="hs-loading">风口龙头数据加载中...</div>
    <el-alert v-else-if="error && !sectors.length" :title="error" type="warning" :closable="false">
      <template #default>
        <el-button size="small" @click="emit('retry')">重试</el-button>
      </template>
    </el-alert>

    <template v-else>
      <div class="hs-body">
        <!-- 龙头股卡片 -->
        <div class="hs-cards-area">
          <div class="hs-cards-grid">
            <div v-for="s in displayStocks" :key="s.code" class="hs-stock-card" @click="goToStockByCode(s.code)">
              <div class="hs-card-info">
                <div class="hs-card-header">
                  <h4 class="hs-card-name">{{ s.name }}</h4>
                  <span v-if="s.industry" class="hs-card-industry" :title="s.industry">{{ s.industry }}</span>
                </div>
                <div class="hs-card-code">
                  <span v-if="getMarketCode(s.code)" class="hs-market-code">{{ getMarketCode(s.code) }}</span>
                  {{ s.code }}
                  <span class="hs-card-track" :title="s.reason"> · {{ s.track }}</span>
                </div>
              </div>
              <div class="hs-card-metrics">
                <div class="hs-metric">
                  <span class="hs-metric-label">最新价</span>
                  <span class="hs-metric-value">{{ fmtPrice(s.latestPrice) }}</span>
                </div>
                <div class="hs-metric">
                  <span class="hs-metric-label">涨跌幅</span>
                  <span class="hs-metric-value" :class="s.changeRate >= 0 ? 'up' : 'down'">{{ fmtPct(s.changeRate) }}</span>
                </div>
              </div>
              <div class="hs-card-actions">
                <el-button size="small" type="primary" plain @click.stop="goToStockByCode(s.code)">查看详情</el-button>
                <el-button
                  v-if="isLoggedIn"
                  size="small"
                  :type="isFollowed(s.code) ? 'danger' : 'primary'"
                  plain
                  :loading="followLoading[s.code]"
                  @click.stop="toggleFollow(s)"
                >{{ isFollowed(s.code) ? '取消关注' : '添加关注' }}</el-button>
                <el-button v-else size="small" type="primary" plain @click.stop="router.push('/login')">登录关注</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 气泡图 -->
        <div class="hs-bubble-area hs-bubble-area-side">
          <div class="hs-bubble-card">
            <div class="hs-bubble-title">风口概念</div>
            <div class="hs-bubble-wrap"><div ref="bubbleEl" class="hs-bubble-chart"></div></div>
          </div>
        </div>
      </div>

      <div class="hs-bubble-area hs-bubble-area-top">
        <div class="hs-bubble-card">
          <div class="hs-bubble-title">风口概念</div>
          <div class="hs-bubble-wrap"><div ref="bubbleElTop" class="hs-bubble-chart"></div></div>
        </div>
      </div>
    </template>

    <!-- 风口详情弹窗 -->
    <el-dialog
      v-model="modalVisible"
      :title="modalTitle"
      width="90%"
      top="5vh"
      destroy-on-close
      class="hs-modal-dialog"
    >
      <div v-if="currentSector" class="hs-sector-row">
        <!-- 左栏 -->
        <div class="hs-sector-left">
          <div class="hs-sector-header">
            <span class="hs-sector-name">{{ currentSector.name }}</span>
            <span class="hs-sector-badge badge-hot">上榜{{ currentSector.frequency }}次</span>
            <span
              class="hs-persistence-tag"
              :class="(currentSector.ai_analysis?.persistence || derivePersistence(currentSector)).includes('长期')
                ? 'persistence-long'
                : (currentSector.ai_analysis?.persistence || derivePersistence(currentSector)).includes('中期')
                  ? 'persistence-mid'
                  : 'persistence-short'"
            >{{ currentSector.ai_analysis?.persistence || derivePersistence(currentSector) }}</span>
          </div>
          <div class="hs-sector-stats">
            <div class="hs-stat-item">
              <div class="hs-stat-label">今日涨幅</div>
              <div class="hs-stat-value" :class="currentSector.today_change >= 0 ? 'up' : 'down'">
                {{ (currentSector.today_change >= 0 ? '+' : '') + currentSector.today_change }}%
              </div>
            </div>
            <div class="hs-stat-item">
              <div class="hs-stat-label">均涨幅</div>
              <div class="hs-stat-value" :class="currentSector.avg_change >= 0 ? 'up' : 'down'">
                {{ (currentSector.avg_change >= 0 ? '+' : '') + currentSector.avg_change }}%
              </div>
            </div>
            <div class="hs-stat-item">
              <div class="hs-stat-label">成交额</div>
              <div class="hs-stat-value">{{ fmtAmount(currentSector.amount) }}</div>
            </div>
          </div>
          <!-- 传导流图 -->
          <div class="hs-flow-chart">
            <svg v-if="flowLayout" :viewBox="`0 0 ${flowLayout.W} ${flowLayout.H}`" :style="{ width: flowLayout.W + 'px', height: flowLayout.H + 'px' }">
              <defs>
                <marker v-for="(c, i) in ['#2563eb', '#d97706', '#16a34a']" :key="i" :id="`arrow-flow-${i}`" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="6" markerHeight="4" orient="auto">
                  <polygon :fill="c" points="0 0, 10 3.5, 0 7" />
                </marker>
              </defs>
              <path
                v-for="(l, i) in flowLayout.links"
                :key="i"
                :d="linkPath(l, flowLayout)"
                :stroke="flowLinkColor(l.direction)"
                :stroke-width="1 + 1.2 * (l.factor || 0.5)"
                fill="none"
                stroke-opacity="0.4"
                :marker-end="`url(#arrow-flow-${l.direction === 'upstream' ? 1 : l.direction === 'downstream' ? 2 : 0})`"
              />
              <g v-for="n in flowLayout.nodes" :key="n.id" :transform="`translate(${n.x},${n.y})`">
                <rect :x="-(labelWidth(n) / 2)" :y="n.type === 'main' ? -13 : -10" :width="labelWidth(n)" :height="n.type === 'main' ? 26 : 20" rx="4" :fill="flowNodeStyle(n.type).fill" :stroke="flowNodeStyle(n.type).stroke" stroke-width="1.5" />
                <text y="1" font-size="11" fill="#1f2937" text-anchor="middle" dominant-baseline="central" font-weight="600">{{ n.label }}</text>
              </g>
            </svg>
          </div>
          <!-- AI 传导分析 -->
          <div class="hs-transfer-info">
            <div><span class="hs-label">传递方向：</span>{{ currentSector.ai_analysis?.transfer_direction || '--' }}</div>
            <div><span class="hs-label">传递判断：</span>{{ currentSector.ai_analysis?.transfer_reason || '--' }}</div>
            <div><span class="hs-label">持续原因：</span>{{ currentSector.ai_analysis?.persistence_reason || '--' }}</div>
            <div><span class="hs-label">风险：</span><span class="hs-risk-tag">{{ currentSector.ai_analysis?.risk_warning || '--' }}</span></div>
          </div>
        </div>

        <!-- 右栏：三类股票表 -->
        <div class="hs-sector-right">
          <div v-for="(group, gi) in [
            { label: '风口精选', dot: 'dot-main', key: 'main_stocks' },
            { label: '上游带动', dot: 'dot-up', key: 'upstream_stocks' },
            { label: '下游传导', dot: 'dot-down', key: 'downstream_stocks' },
          ]" :key="gi" class="hs-stock-group">
            <div class="hs-stock-group-label">
              <span class="hs-dot" :class="group.dot"></span>{{ group.label }}
            </div>
            <div v-if="(currentSector[group.key] || []).length" class="hs-detail-stock-table">
              <div class="hs-detail-thead">
                <span v-for="h in groupThead" :key="h[1]" :class="h[0]">{{ h[1] }}</span>
              </div>
              <div
                v-for="s in currentSector[group.key]"
                :key="s.code"
                class="hs-detail-row clickable"
                @click="goToStockByCode(s.code)"
              >
                <span class="hs-detail-name">{{ s.name }}</span>
                <span class="hs-detail-industry">
                  <span v-if="s.in_concept" class="hs-concept-tag">概念</span>
                  <span class="hs-industry-tag">{{ (s.industry || '').replace(/\(A股\)|A股/g, '') }}</span>
                </span>
                <span class="col-price">{{ fmtPrice(s.price) }}</span>
                <span class="col-pnl" :class="pnlClass(s.change_pct)">{{ fmtPct(s.change_pct) }}</span>
                <span class="hs-detail-reason" :title="s.reason">
                  <span v-if="s.reason_tag" class="hs-reason-tag" :class="s.reason_tag_class || 'tag-trend'">{{ s.reason_tag }}</span>
                  {{ s.reason || '' }}
                </span>
              </div>
            </div>
            <div v-else class="hs-detail-empty">暂无</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.hot-sector-panel {
  margin-bottom: 20px;
}

.hs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 10px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.hs-header .section-title {
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.hs-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.hs-header-meta {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}

.hs-loading {
  text-align: center;
  color: var(--text-tertiary);
  padding: 30px 0;
}

.hs-body {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.hs-cards-area {
  flex: 1;
  min-width: 0;
}

.hs-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.hs-stock-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.hs-stock-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.hs-card-info {
  margin-bottom: 8px;
}

.hs-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 6px;
  min-width: 0;
}

.hs-card-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.hs-card-industry {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 3px;
  background: #eff6ff;
  color: #2563eb;
  flex-shrink: 1;
  min-width: 0;
  max-width: 120px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.hs-card-code {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hs-card-track {
  color: var(--text-tertiary);
  font-size: 0.78rem;
}

.hs-market-code {
  font-size: 0.7rem;
  font-weight: 700;
  color: #1677ff;
  margin-right: 4px;
  padding: 1px 4px;
  border: 1px solid #d6e4ff;
  background-color: #f0f5ff;
  border-radius: 3px;
  display: inline-block;
}

.hs-card-metrics {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.hs-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hs-metric-label {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  margin-bottom: 2px;
}

.hs-metric-value {
  font-size: 1rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.hs-metric-value.up {
  color: #f56c6c;
}

.hs-metric-value.down {
  color: #67c23a;
}

.hs-card-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.hs-card-actions :deep(.el-button) {
  flex: 1;
  font-size: 12px;
}

.hs-bubble-area-side {
  flex-shrink: 0;
}

.hs-bubble-area-top {
  display: none;
}

.hs-bubble-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.hs-bubble-title {
  font-size: 14px;
  color: #111827;
  margin-bottom: 8px;
  text-align: center;
}

.hs-bubble-area-side .hs-bubble-wrap {
  width: 280px;
  height: 100%;
  min-height: 280px;
  flex: 1;
}

.hs-bubble-chart {
  width: 100%;
  height: 100%;
  min-height: 280px;
}

/* 弹窗 */
:deep(.hs-modal-dialog) {
  border-radius: 12px;
  max-width: 900px;
}

:deep(.hs-modal-dialog .el-dialog__body) {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}

.hs-sector-row {
  display: flex;
  align-items: stretch;
}

.hs-sector-left {
  flex: 0 0 320px;
  padding: 12px 14px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hs-sector-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.hs-sector-name {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.hs-sector-badge {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.badge-hot {
  background: #fef2f2;
  color: #dc2626;
}

.hs-sector-stats {
  display: flex;
  gap: 10px;
  font-size: 12px;
}

.hs-stat-item {
  text-align: center;
}

.hs-stat-label {
  color: #9ca3af;
  font-size: 10px;
}

.hs-stat-value {
  font-weight: 600;
  font-size: 12px;
}

.hs-stat-value.up {
  color: #dc2626;
}

.hs-stat-value.down {
  color: #16a34a;
}

.hs-transfer-info {
  padding: 5px 8px;
  background: #f8fafc;
  border-radius: 4px;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.6;
}

.hs-transfer-info .hs-label {
  color: #2563eb;
  font-weight: 600;
}

.hs-sector-right {
  flex: 1;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-y: auto;
}

.hs-stock-group {
  margin-bottom: 8px;
}

.hs-stock-group-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding-bottom: 2px;
  border-bottom: 1px solid #f0f0f0;
}

.hs-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  display: inline-block;
}

.dot-main {
  background: #dc2626;
}

.dot-up {
  background: #d97706;
}

.dot-down {
  background: #16a34a;
}

.hs-persistence-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 4px;
}

.persistence-short {
  background: #fffbeb;
  color: #d97706;
}

.persistence-mid {
  background: #eff6ff;
  color: #2563eb;
}

.persistence-long {
  background: #f0fdf4;
  color: #16a34a;
}

.hs-flow-chart {
  width: 100%;
  overflow-x: auto;
  display: flex;
  justify-content: center;
}

.hs-detail-stock-table {
  width: 100%;
  font-size: 11px;
}

.hs-detail-thead {
  display: grid;
  grid-template-columns: minmax(50px, 10%) minmax(80px, 22%) minmax(45px, 10%) minmax(50px, 10%) 1fr;
  color: #9ca3af;
  font-weight: 500;
  font-size: 10px;
  padding: 2px 4px 3px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}

.hs-detail-thead .col-price {
  text-align: right;
}

.hs-detail-thead .col-pnl {
  text-align: center;
}

.hs-detail-row {
  display: grid;
  grid-template-columns: minmax(50px, 10%) minmax(80px, 22%) minmax(45px, 10%) minmax(50px, 10%) 1fr;
  padding: 3px 4px;
  border-bottom: 1px solid #f8f8f8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hs-detail-row.clickable {
  cursor: pointer;
}

.hs-detail-row.clickable:hover {
  background: #eef2ff;
}

.hs-detail-name {
  font-weight: 600;
  color: #111827;
}

.hs-detail-industry {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  overflow: hidden;
}

.hs-industry-tag {
  font-size: 10px;
  color: #2563eb;
  padding: 0 3px;
  background: #eff6ff;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.hs-concept-tag {
  font-size: 10px;
  color: #dc2626;
  padding: 0 3px;
  background: #fef2f2;
  border-radius: 3px;
  flex-shrink: 0;
}

.hs-detail-row .col-price {
  text-align: right;
}

.hs-detail-row .col-pnl {
  text-align: center;
}

.pnl-up {
  color: #dc2626;
}

.pnl-down {
  color: #16a34a;
}

.pnl-flat {
  color: #9ca3af;
}

.hs-detail-reason {
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 3px;
}

.hs-reason-tag {
  font-size: 10px;
  padding: 0 4px;
  border-radius: 3px;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 600;
}

.hs-reason-tag.tag-bullish,
.hs-reason-tag.tag-trend {
  color: #ea580c;
  background: #fff7ed;
}

.hs-reason-tag.tag-fund {
  color: #2563eb;
  background: #eff6ff;
}

.hs-detail-empty {
  font-size: 11px;
  color: #d1d5db;
  padding: 2px 0;
}

.hs-risk-tag {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 10px;
  background: #fef2f2;
  color: #dc2626;
}

@media (max-width: 1100px) {
  .hs-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .hs-body {
    flex-direction: column;
  }
  .hs-bubble-area-top {
    display: block;
    width: 100%;
    margin-top: 12px;
  }
  .hs-bubble-area-side {
    display: none;
  }
  .hs-bubble-area-top .hs-bubble-wrap {
    width: 100%;
    height: 280px;
  }
  .hs-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hs-sector-row {
    flex-direction: column;
  }
  .hs-sector-left {
    flex: none;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }
}

@media (max-width: 520px) {
  .hs-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
