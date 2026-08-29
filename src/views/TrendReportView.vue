<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import api from '../api'
import MarkdownText from '../components/MarkdownText.vue'

const route = useRoute()
const stock = ref(route.query.stock || '')
const reportTime = ref(route.query.time || '')
const report = ref(null)
const loading = ref(false)
const error = ref('')

async function loadReport() {
  if (!stock.value.trim()) return
  loading.value = true
  error.value = ''
  report.value = null
  try {
    const t = reportTime.value || dayjs().format('YYYY-MM-DD')
    const data = await api.getAgentReport(stock.value.trim(), t)
    report.value = typeof data === 'string' ? { content: data } : data
  } catch (e) {
    error.value = e.message || '获取报告失败'
  } finally {
    loading.value = false
  }
}

watch(() => route.query, () => {
  stock.value = route.query.stock || ''
  reportTime.value = route.query.time || ''
  loadReport()
})

onMounted(loadReport)
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="section-title">趋势股评分报告</div>
      <div class="search-bar">
        <el-input v-model="stock" placeholder="股票代码，如 600519" style="max-width: 200px" @keyup.enter="loadReport" />
        <el-input v-model="reportTime" placeholder="报告日期，如 2026-08-25" style="max-width: 200px" @keyup.enter="loadReport" />
        <el-button type="primary" :loading="loading" @click="loadReport">生成报告</el-button>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <template v-if="report">
        <h2 class="report-title">{{ stock }} 趋势评分报告</h2>
        <MarkdownText v-if="report.content" :text="report.content" />
        <pre v-else class="report-json">{{ JSON.stringify(report, null, 2) }}</pre>
      </template>
      <el-alert v-else-if="error" :title="error" type="warning" :closable="false" />
      <div v-else class="page-loading">输入股票代码，AI 将生成趋势评分报告</div>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.report-title {
  font-size: 1.2rem;
  margin-bottom: 14px;
}

.report-json {
  white-space: pre-wrap;
  font-size: 0.85rem;
  line-height: 1.7;
  color: var(--text-secondary);
}
</style>
