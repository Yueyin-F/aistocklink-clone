<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Object, default: null }, // { dates:[], klines:[[o,c,l,h,v],...] }
  loading: { type: Boolean, default: false },
  prediction: { type: Object, default: null }, // Kronos 预测 {bands:[], direction:{}, summary:{}}
  predictLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['pred-info'])

const el = ref(null)
let chart = null

// 均线计算
function calcMA(closes, n) {
  const out = []
  for (let i = 0; i < closes.length; i++) {
    if (i < n - 1) {
      out.push(null)
      continue
    }
    let sum = 0
    for (let j = i - n + 1; j <= i; j++) sum += closes[j]
    out.push(+(sum / n).toFixed(2))
  }
  return out
}

function render() {
  if (!el.value || !props.data) return
  if (!chart) chart = echarts.init(el.value)
  const d = props.data
  const dates = d.dates || []
  const klines = d.klines || []
  const closes = klines.map((k) => k[1])
  const vols = klines.map((k) => k[4] || 0)
  const colors = klines.map((k) => (k[1] >= k[0] ? '#f56c6c' : '#67c23a'))

  const series = [
    {
      name: 'K线',
      type: 'candlestick',
      data: klines,
      itemStyle: { color: '#f56c6c', color0: '#67c23a', borderColor: '#f56c6c', borderColor0: '#67c23a' },
    },
    { name: 'MA5', type: 'line', data: calcMA(closes, 5), smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#e6a23c' } },
    { name: 'MA10', type: 'line', data: calcMA(closes, 10), smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#409eff' } },
    { name: 'MA20', type: 'line', data: calcMA(closes, 20), smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#9c27b0' } },
    {
      name: '成交量',
      type: 'bar',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: vols,
      itemStyle: { color: (p) => colors[p.dataIndex] },
    },
  ]

  // ===== Kronos AI 预测叠加 =====
  let predInfo = null
  let xDates = dates
  if (props.prediction && props.prediction.bands && props.prediction.bands.length) {
    const bands = props.prediction.bands
    const lastDate = dates[dates.length - 1] || ''
    const predDates = bands.map((b) => String(b.date).replace(/-/g, ''))
    xDates = [...dates, ...predDates]
    const bandBase = new Array(dates.length).fill(null)
    const low = bands.map((b) => b.trading_low)
    const high = bands.map((b) => b.trading_high)
    const mean = bands.map((b) => b.mean_close)

    // 置信区间带（堆叠面积）
    series.push({
      name: '预测区间',
      type: 'line',
      data: [...bandBase, ...low],
      lineStyle: { opacity: 0 },
      stack: 'band',
      symbol: 'none',
      silent: true,
    })
    series.push({
      name: '预测区间带',
      type: 'line',
      data: [...bandBase, ...high.map((h, i) => +(h - low[i]).toFixed(2))],
      lineStyle: { opacity: 0 },
      areaStyle: { color: 'rgba(64,158,255,0.18)' },
      stack: 'band',
      symbol: 'none',
      silent: true,
    })
    // 预测均值路径（虚线）
    series.push({
      name: 'AI预测均值',
      type: 'line',
      data: [...bandBase, ...mean],
      lineStyle: { type: 'dashed', width: 2, color: '#409eff' },
      symbol: 'circle',
      symbolSize: 5,
      itemStyle: { color: '#409eff' },
    })
    // 分隔标记
    series[0].markLine = {
      silent: true,
      symbol: 'none',
      lineStyle: { color: '#e6a23c', type: 'dashed', width: 1 },
      label: { show: true, formatter: 'AI预测', position: 'insideEndTop', color: '#e6a23c', fontSize: 10 },
      data: [{ xAxis: lastDate }],
    }
    // 成交量补空位
    series[4].data = [...vols, ...new Array(bands.length).fill(null)]
    predInfo = {
      signal: props.prediction.direction,
      summary: props.prediction.summary,
      confidence: props.prediction.confidence,
      count: bands.length,
    }
  }

  chart.setOption(
    {
      animation: false,
      xAxis: [
        { type: 'category', data: xDates, boundaryGap: true, axisLine: { lineStyle: { color: '#dcdfe6' } }, axisLabel: { fontSize: 10 } },
        { type: 'category', gridIndex: 1, data: xDates, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#dcdfe6' } } },
      ],
      legend: { data: ['K线', 'MA5', 'MA10', 'MA20', '成交量', 'AI预测均值'], top: 0, textStyle: { fontSize: 12 } },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params) => {
          const i = params[0]?.dataIndex
          if (i === undefined) return ''
          const isPred = i >= dates.length
          if (isPred) {
            const b = props.prediction?.bands?.[i - dates.length]
            if (!b) return ''
            return `<b>${b.date}（AI预测）</b><br/>均值: ${b.mean_close}<br/>区间: ${b.trading_low} ~ ${b.trading_high}<br/>不确定性: ${(b.uncertainty * 100).toFixed(1)}%`
          }
          const k = klines[i]
          if (!k) return ''
          const up = k[1] >= k[0]
          const col = up ? '#f56c6c' : '#67c23a'
          return (
            `<b>${dates[i]}</b><br/>` +
            `开盘: <span style="color:${col}">${k[1]}</span><br/>` +
            `收盘: <span style="color:${col}">${k[0]}</span><br/>` +
            `最高: ${k[2]}<br/>最低: ${k[3]}<br/>成交量: ${(k[4] || 0).toLocaleString()}`
          )
        },
      },
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      grid: [
        { left: 60, right: 20, top: 30, height: '55%' },
        { left: 60, right: 20, top: '72%', height: '18%' },
      ],
      yAxis: [
        { scale: true, splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { fontSize: 10 } },
        { gridIndex: 1, splitNumber: 2, axisLabel: { show: false }, splitLine: { show: false } },
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], start: 40, end: 100 },
        { type: 'slider', xAxisIndex: [0, 1], bottom: 4, height: 16, start: 40, end: 100 },
      ],
      series,
    },
    true
  )

  if (predInfo) emit('pred-info', predInfo)
}

function resize() {
  chart && chart.resize()
}

watch(() => props.data, () => nextTick(render))
watch(() => props.prediction, () => nextTick(render))
watch(() => props.loading, (v) => {
  if (chart && !v) chart.resize()
})

onMounted(() => {
  nextTick(render)
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart && chart.dispose()
})
</script>

<template>
  <div v-loading="loading" class="kline-wrap">
    <div v-if="data" ref="el" class="kline-chart"></div>
    <el-empty v-else-if="!loading" description="暂无K线数据" :image-size="80" />
    <div v-if="predictLoading" class="predict-loading-tip">
      ⏳ Kronos AI 正在生成未来价格预测，约需 30-60 秒...
    </div>
  </div>
</template>

<style scoped>
.kline-wrap {
  width: 100%;
  min-height: 420px;
  position: relative;
}

.kline-chart {
  width: 100%;
  height: 420px;
}

.predict-loading-tip {
  position: absolute;
  top: 40px;
  right: 12px;
  background: rgba(64, 158, 255, 0.12);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  z-index: 3;
}
</style>
