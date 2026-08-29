<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import ScoreBadge from '../components/ScoreBadge.vue'
import MarkdownText from '../components/MarkdownText.vue'

const router = useRouter()
const topList = ref([])
const loading = ref(false)
const code = ref('')
const score = ref(null)
const scoreLoading = ref(false)
const errorMsg = ref('')

async function loadTop() {
  loading.value = true
  try {
    topList.value = await api.getTenxTop(30)
  } catch (e) {
    // mock 兜底
    topList.value = [
      { symbol: '688498', name: '源杰科技', industry: '半导体', score: 83, label: 'A', expectedMultiple: '3-5倍', description: '赛道景气度高，业绩兑现确定性较强' },
      { symbol: '603268', name: '松发股份', industry: '船舶', score: 79, label: 'A', expectedMultiple: '3-5倍', description: '技术面强势，基本面优秀' },
      { symbol: '001337', name: '四川黄金', industry: '黄金', score: 79, label: 'A', expectedMultiple: '3-5倍', description: '赛道景气度高，消息面催化强劲' },
    ]
  } finally {
    loading.value = false
  }
}

async function queryScore() {
  const c = code.value.trim()
  if (!c) return
  scoreLoading.value = true
  errorMsg.value = ''
  score.value = null
  try {
    const data = await api.getTenxScore(c)
    score.value = data
  } catch (e) {
    errorMsg.value = e.message || '获取评分失败'
  } finally {
    scoreLoading.value = false
  }
}

onMounted(loadTop)
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="section-title">十倍股评分</div>
      <div class="search-bar">
        <el-input v-model="code" placeholder="输入股票代码查询十倍股评分，如 600519" clearable style="max-width: 320px" @keyup.enter="queryScore">
          <template #append>
            <el-button :loading="scoreLoading" @click="queryScore">查询</el-button>
          </template>
        </el-input>
      </div>

      <div v-if="scoreLoading" class="page-loading">评分计算中，首次计算可能需要较长时间…</div>

      <div v-if="score" class="score-card">
        <div class="score-head">
          <ScoreBadge :label="score.label" />
          <span class="score-num">{{ score.score }}</span>
          <span class="score-meta">{{ score.symbol }} · {{ score.name || '-' }}</span>
          <span v-if="score.expectedMultiple" class="muted">预期涨幅 {{ score.expectedMultiple }}</span>
        </div>
        <p v-if="score.description" class="score-desc">{{ score.description }}</p>
        <div v-if="score.dimScores" class="dim-bars">
          <div v-for="(v, i) in score.dimScores" :key="i" class="dim-bar">
            <span class="dim-name">{{ ['技术面', '趋势面', '赛道面', '消息面'][i] || `维度${i + 1}` }}</span>
            <el-progress :percentage="v" :stroke-width="12" :color="v >= 70 ? '#f56c6c' : v >= 50 ? '#e6a23c' : '#909399'" />
          </div>
        </div>
      </div>

      <el-alert v-if="errorMsg" :title="errorMsg" type="warning" :closable="false" style="margin-top: 12px" />
    </div>

    <div class="card" v-loading="loading">
      <div class="section-title">十倍股候选榜</div>
      <el-table :data="topList" stripe height="440" @row-click="(row) => router.push(`/stock/${row.symbol}`)" class="clickable-table">
        <el-table-column label="评级" width="80">
          <template #default="{ row }"><ScoreBadge :label="row.label" /></template>
        </el-table-column>
        <el-table-column prop="symbol" label="代码" width="110" />
        <el-table-column prop="name" label="简称" min-width="120">
          <template #default="{ row }">
            <router-link :to="`/stock/${row.symbol}`">{{ row.name }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="industry" label="行业" min-width="110" />
        <el-table-column prop="score" label="评分" width="90" sortable>
          <template #default="{ row }"><b class="up">{{ row.score }}</b></template>
        </el-table-column>
        <el-table-column prop="expectedMultiple" label="预期倍数" min-width="100" />
        <el-table-column prop="description" label="说明" min-width="260" show-overflow-tooltip />
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.score-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  background: #fdfcf9;
}

.score-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-num {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
}

.score-desc {
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.dim-bars {
  margin-top: 14px;
  display: grid;
  gap: 8px;
  max-width: 560px;
}

.dim-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dim-name {
  width: 52px;
  flex-shrink: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.clickable-table :deep(.el-table__row) {
  cursor: pointer;
}
</style>
