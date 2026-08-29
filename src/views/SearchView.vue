<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const keyword = ref('')
const stocks = ref([])
const loading = ref(false)
const searched = ref(false)
const total = ref(0)

async function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  loading.value = true
  searched.value = true
  try {
    const data = await api.searchStocks(kw, 30)
    stocks.value = data?.股票列表 || []
    total.value = data?.总数量 || 0
  } catch (e) {
    stocks.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function goDetail(row) {
  router.push(`/stock/${row.股票代码}`)
}

onMounted(() => {
  // 支持 ?q= 参数直达搜索
  const q = new URLSearchParams(location.search).get('q')
  if (q) {
    keyword.value = q
    doSearch()
  }
})
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="section-title">股票搜索</div>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          size="large"
          placeholder="输入股票代码或名称，如 600519 / 贵州茅台"
          clearable
          @keyup.enter="doSearch"
        >
          <template #append>
            <el-button :loading="loading" @click="doSearch">搜索</el-button>
          </template>
        </el-input>
        <el-button v-if="searched" size="large" @click="router.push('/forecast')">按业绩预测搜索 →</el-button>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <div v-if="searched" class="result-meta">
        共找到 <b>{{ total }}</b> 只股票
      </div>
      <el-table :data="stocks" stripe @row-click="goDetail" class="clickable-table">
        <el-table-column prop="股票代码" label="代码" width="120" />
        <el-table-column prop="股票简称" label="简称" min-width="140">
          <template #default="{ row }">
            <router-link :to="`/stock/${row.股票代码}`">{{ row.股票简称 }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="所属行业" label="行业" min-width="140" />
        <el-table-column prop="市场代码" label="市场" width="100" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="goDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="searched && !loading && !stocks.length" description="未找到相关股票" />
      <div v-if="!searched" class="hint">
        <p>支持：</p>
        <ul>
          <li>6 位股票代码，如 <code>600519</code></li>
          <li>股票简称，如 <code>贵州茅台</code></li>
          <li>模糊关键词，如 <code>茅台</code></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 12px;
  max-width: 720px;
}

.result-meta {
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.clickable-table :deep(.el-table__row) {
  cursor: pointer;
}

.hint {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 2;
  padding: 20px;
}

.hint code {
  background: var(--background-hover);
  padding: 1px 6px;
  border-radius: 4px;
}
</style>
