<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import api from '../api'
import MarkdownText from '../components/MarkdownText.vue'

const types = ref([])
const logs = ref([])
const page = ref(1)
const perPage = 10
const total = ref(0)
const currentType = ref('')
const loading = ref(false)

async function loadTypes() {
  try {
    types.value = await api.getLogTypes()
  } catch (e) {
    types.value = []
  }
}

async function loadLogs() {
  loading.value = true
  try {
    const params = { page: page.value, per_page: perPage }
    if (currentType.value) params.update_type = currentType.value
    const data = await api.getLogs(params)
    logs.value = data?.commits || data?.logs || []
    total.value = data?.pagination?.last_page ? data.pagination.last_page * perPage : logs.value.length
  } catch (e) {
    // 兜底演示数据
    logs.value = [
      { id: 1, title: 'v1.0.0 发布', content: '**股票资讯AI智能分析 v1.0.0**\n- 首页头条新闻\n- 搜索股票\n- AI 智能分析', date: dayjs().format('YYYY-MM-DD'), update_type: 'feature' },
      { id: 2, title: '新增趋势股评分', content: '- 趋势股评分上线\n- 板块龙头展示', date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), update_type: 'feature' },
      { id: 3, title: '修复若干问题', content: '- 修复K线图显示问题\n- 优化移动端体验', date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), update_type: 'fix' },
    ]
  } finally {
    loading.value = false
  }
}

function onTypeChange() {
  page.value = 1
  loadLogs()
}

onMounted(() => {
  loadTypes()
  loadLogs()
})
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="section-title">更新日志</div>
      <div class="filter-bar">
        <el-radio-group v-model="currentType" @change="onTypeChange">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button v-for="t in types" :key="t" :value="t">{{ t }}</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <template v-if="logs.length">
        <div v-for="log in logs" :key="log.id || log.sha || log.title" class="log-item">
          <div class="log-head">
            <span class="log-title">{{ log.title || log.message?.split('\n')[0] }}</span>
            <el-tag v-if="log.update_type" size="small" type="info" effect="plain">{{ log.update_type }}</el-tag>
            <span class="muted log-date">{{ dayjs(log.date || log.created_at || log.committed_date).format('YYYY-MM-DD') }}</span>
          </div>
          <MarkdownText :text="log.content || log.body || (log.message || '').split('\n').slice(1).join('\n')" />
        </div>
      </template>
      <el-empty v-else-if="!loading" description="暂无更新日志" :image-size="80" />
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
}

.log-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.log-item:last-child {
  border-bottom: none;
}

.log-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.log-title {
  font-weight: 600;
  font-size: 1rem;
}

.log-date {
  margin-left: auto;
}
</style>
