<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const list = ref([])
const prices = ref({})
const loading = ref(false)
const pushNews = ref([])

async function loadPrices() {
  const codes = list.value.map((f) => f.code || f.stock_code).filter(Boolean)
  if (!codes.length) return
  try {
    const data = await api.getStockQuotesCore(codes.join(','))
    const map = {}
    ;(data?.行情 || []).forEach((q) => {
      map[q.股票代码] = { price: q.最新价, change: q.涨跌幅 }
    })
    prices.value = map
  } catch (e) { /* ignore */ }
}

async function load() {
  loading.value = true
  try {
    list.value = await api.getFavorites()
    const [n] = await Promise.allSettled([api.getPushNews()])
    if (n.status === 'fulfilled') pushNews.value = n.value?.推送新闻 || []
    await loadPrices()
  } catch (e) {
    if (e?.response?.status === 401) {
      ElMessage.warning('请先登录')
      router.push({ path: '/login', query: { redirect: '/favorites' } })
    } else {
      list.value = []
    }
  } finally {
    loading.value = false
  }
}

async function remove(row) {
  await ElMessageBox.confirm(`确定移除 ${row.name || row.stock_name || row.code} 吗？`, '移除自选股', { type: 'warning' })
  await userStore.removeFavorite(row.code || row.stock_code)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="container">
    <div class="card" v-loading="loading">
      <div class="section-title">我的自选股</div>
      <el-table :data="list" stripe @row-click="(row) => router.push(`/stock/${row.code || row.stock_code}`)" class="clickable-table">
        <el-table-column prop="code" label="代码" width="120">
          <template #default="{ row }">{{ row.code || row.stock_code }}</template>
        </el-table-column>
        <el-table-column prop="name" label="简称" min-width="150">
          <template #default="{ row }">
            <router-link :to="`/stock/${row.code || row.stock_code}`">{{ row.name || row.stock_name }}</router-link>
          </template>
        </el-table-column>
        <el-table-column label="最新价" min-width="120">
          <template #default="{ row }">
            <b v-if="prices[row.code || row.stock_code]">{{ prices[row.code || row.stock_code].price }}</b>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="涨跌幅" min-width="120">
          <template #default="{ row }">
            <span v-if="prices[row.code || row.stock_code]" :class="prices[row.code || row.stock_code].change >= 0 ? 'up' : 'down'">
              {{ prices[row.code || row.stock_code].change >= 0 ? '+' : '' }}{{ prices[row.code || row.stock_code].change }}%
            </span>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110">
          <template #default="{ row }">
            <el-button size="small" type="danger" link @click.stop="remove(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="暂无自选股，去股票详情页添加">
        <el-button type="primary" @click="router.push('/search')">去搜索股票</el-button>
      </el-empty>
    </div>

    <div class="card">
      <div class="section-title">自选股推送新闻</div>
      <ul v-if="pushNews.length" class="news-list">
        <li v-for="(n, i) in pushNews" :key="i">
          <div class="news-title">{{ n.title || n.标题 }}</div>
          <div v-if="n.summary || n.摘要" class="news-summary">{{ n.summary || n.摘要 }}</div>
          <div class="news-meta muted">{{ n.time || n.时间 }}</div>
        </li>
      </ul>
      <el-empty v-else description="暂无推送新闻" :image-size="80" />
    </div>
  </div>
</template>

<style scoped>
.clickable-table :deep(.el-table__row) {
  cursor: pointer;
}

.news-list {
  list-style: none;
}

.news-list li {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.news-title {
  font-size: 0.95rem;
  line-height: 1.5;
}

.news-summary {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}
</style>
