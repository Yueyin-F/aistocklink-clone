<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'
import ScoreBadge from '../components/ScoreBadge.vue'

const router = useRouter()
const topList = ref([])
const loading = ref(false)
const code = ref('')
const detail = ref(null)
const detailLoading = ref(false)

async function loadTop() {
  loading.value = true
  try {
    topList.value = await api.getTrendTop(30)
  } catch (e) {
    topList.value = []
  } finally {
    loading.value = false
  }
}

async function queryDetail() {
  const c = code.value.trim()
  if (!c) return
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await api.getTrendScore(c)
  } catch (e) {
    ElMessage.error(e.message || '获取趋势评分失败')
  } finally {
    detailLoading.value = false
  }
}

function labelColor(label) {
  return { A: 'danger', B: 'warning', C: 'primary', D: 'info', E: 'success' }[label] || 'info'
}

onMounted(loadTop)
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="section-title">
        趋势股评分
        <router-link to="/trend/report" class="report-link">查看评分报告 →</router-link>
      </div>
      <div class="search-bar">
        <el-input v-model="code" placeholder="输入股票代码查询趋势评分，如 600519" clearable style="max-width: 320px" @keyup.enter="queryDetail">
          <template #append>
            <el-button :loading="detailLoading" @click="queryDetail">查询</el-button>
          </template>
        </el-input>
      </div>

      <div v-if="detail" class="score-card">
        <div class="score-head">
          <ScoreBadge :label="detail.label" />
          <span class="score-num">{{ detail.score }}</span>
          <span class="score-meta">{{ detail.symbol }} · {{ detail.name || '-' }}</span>
          <span v-if="detail.expectedMultiple" class="muted">预期 {{ detail.expectedMultiple }}</span>
        </div>
        <p v-if="detail.description" class="score-desc">{{ detail.description }}</p>
        <div v-if="detail.dimensions?.length" class="dim-list">
          <div v-for="dim in detail.dimensions" :key="dim.name" class="dim-block">
            <div class="dim-head">
              <span class="dim-name">{{ dim.name }}</span>
              <span class="dim-weight">权重 {{ dim.weight }}%</span>
              <el-progress :percentage="dim.score" :stroke-width="10" style="flex: 1" />
              <b class="dim-score" :class="dim.score >= 60 ? 'up' : 'down'">{{ dim.score }}</b>
            </div>
            <div class="dim-indicators">
              <span v-for="ind in dim.indicators" :key="ind.key" class="ind-chip">
                {{ ind.name }}: {{ ind.value }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <div class="section-title">趋势股排名</div>
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
        <el-table-column label="维度评分" min-width="200">
          <template #default="{ row }">
            <span v-if="row.dimScores" class="dim-scores">
              <el-tag v-for="(v, i) in row.dimScores" :key="i" size="small" effect="plain" style="margin-right: 4px">
                {{ v }}
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="expectedMultiple" label="预期倍数" min-width="100" />
        <el-table-column prop="description" label="说明" min-width="240" show-overflow-tooltip />
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.report-link {
  font-size: 0.85rem;
  font-weight: 400;
  margin-left: auto;
}

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

.dim-list {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.dim-block {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 14px;
}

.dim-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dim-name {
  font-weight: 600;
  width: 60px;
  flex-shrink: 0;
}

.dim-weight {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  flex-shrink: 0;
}

.dim-score {
  font-size: 1.1rem;
  width: 36px;
  text-align: right;
}

.dim-indicators {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ind-chip {
  background: var(--background-hover);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.clickable-table :deep(.el-table__row) {
  cursor: pointer;
}
</style>
