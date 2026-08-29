<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import api from '../api'

const router = useRouter()
const outbreaks = ref([])
const history = ref([])
const updateTime = ref('')
const loading = ref(false)
const detecting = ref(false)
const stats = ref(null)

async function load() {
  loading.value = true
  try {
    const [latest, h, s] = await Promise.allSettled([
      api.getInstitutionResearchLatest(),
      api.getInstitutionResearchHistory(),
      api.getMonitorStats(),
    ])
    if (latest.status === 'fulfilled' && latest.value) {
      outbreaks.value = latest.value.outbreaks || []
      updateTime.value = latest.value.update_time || ''
    }
    if (h.status === 'fulfilled') history.value = h.value || []
    if (s.status === 'fulfilled') stats.value = s.value
  } catch (e) {
    outbreaks.value = []
  } finally {
    loading.value = false
  }
}

async function detect() {
  detecting.value = true
  try {
    await api.detectInstitutionResearch()
    ElMessage.success('检测任务已触发，请稍后刷新查看结果')
  } catch (e) {
    ElMessage.error(e.message || '触发检测失败')
  } finally {
    detecting.value = false
  }
}

function levelType(lv) {
  return { high: 'danger', medium: 'warning', low: 'info' }[lv] || 'info'
}

onMounted(load)
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="section-title">
        机构调研推荐热门股
        <span class="muted" v-if="updateTime">更新于 {{ dayjs(updateTime).format('YYYY-MM-DD HH:mm') }}</span>
        <el-button size="small" style="margin-left: auto" :loading="detecting" @click="detect">立即检测</el-button>
      </div>

      <div v-if="stats" class="stats-row">
        <div class="stat-chip"><b>{{ stats.total }}</b> 监控事件</div>
        <div class="stat-chip"><b>{{ stats.announcement }}</b> 公告</div>
        <div class="stat-chip"><b>{{ stats.news }}</b> 新闻</div>
        <div class="stat-chip positive"><b>{{ stats.positive }}</b> 利好</div>
        <div class="stat-chip negative"><b>{{ stats.negative }}</b> 利空</div>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <div class="section-title">热门股爆发检测</div>
      <div v-if="outbreaks.length" class="outbreak-grid">
        <div v-for="o in outbreaks" :key="o.symbol" class="outbreak-card" @click="router.push(`/stock/${o.symbol}`)">
          <div class="ob-head">
            <span class="ob-name">{{ o.stockName }}</span>
            <span class="ob-code">{{ o.symbol }}</span>
            <span class="ob-change" :class="o.changePct >= 0 ? 'up' : 'down'">{{ o.changePct >= 0 ? '+' : '' }}{{ o.changePct }}%</span>
          </div>
          <div class="ob-tags">
            <el-tag v-for="t in o.triggerTags" :key="t" size="small" type="danger" effect="plain">{{ t }}</el-tag>
          </div>
          <div class="ob-meta">
            <el-tag v-if="o.thsSectorName" size="small" type="info" effect="plain">{{ o.thsSectorName }}</el-tag>
            <el-tag size="small" :type="levelType(o.resonanceLevel)" effect="dark">共振 {{ o.resonanceScore }}</el-tag>
            <span v-if="o.newsCount" class="muted">{{ o.newsCount }} 条相关新闻</span>
          </div>
          <div v-if="o.sectorInfo" class="ob-sector muted">{{ o.sectorInfo }}</div>
        </div>
      </div>
      <el-empty v-else-if="!loading" description="暂无爆发检测结果" :image-size="80" />
    </div>

    <div v-if="history.length" class="card">
      <div class="section-title">历史检测记录</div>
      <el-table :data="history" size="small" stripe>
        <el-table-column prop="detectedAt" label="检测时间" min-width="160">
          <template #default="{ row }">{{ dayjs(row.detectedAt || row.time).format('YYYY-MM-DD HH:mm') }}</template>
        </el-table-column>
        <el-table-column prop="totalStocksChecked" label="检查股票" width="100" />
        <el-table-column prop="resonanceCount" label="共振数量" width="100" />
        <el-table-column prop="note" label="说明" min-width="200" />
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-chip {
  background: #f9fafc;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stat-chip b {
  color: var(--primary-color);
  font-size: 1.1rem;
  margin-right: 4px;
}

.stat-chip.positive b {
  color: var(--up-color);
}

.stat-chip.negative b {
  color: var(--down-color);
}

.outbreak-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.outbreak-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.outbreak-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.ob-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ob-name {
  font-weight: 600;
  font-size: 1.05rem;
}

.ob-code {
  color: var(--text-tertiary);
  font-size: 0.85rem;
}

.ob-change {
  margin-left: auto;
  font-weight: 600;
}

.ob-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.ob-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ob-sector {
  margin-top: 6px;
  font-size: 0.8rem;
}
</style>
