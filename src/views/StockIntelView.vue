<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const favorites = ref([])
const prices = ref({})
const news = ref([])
const events = ref([])
const loading = ref(false)

async function loadPrices() {
  const codes = favorites.value.map((f) => f.code || f.stock_code).filter(Boolean)
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
    favorites.value = userStore.favoriteStocks.length ? userStore.favoriteStocks : (await api.getFavorites()) || []
    const [n, ev] = await Promise.allSettled([
      api.getFavoritesNews({ limit: 10 }),
      api.getMonitorEvents({ limit: 10 }),
    ])
    if (n.status === 'fulfilled') news.value = n.value?.news || n.value?.推送新闻 || []
    if (ev.status === 'fulfilled') events.value = ev.value?.events || []
    await loadPrices()
  } catch (e) {
    if (e?.response?.status === 401) {
      ElMessage.warning('请先登录')
      router.push({ path: '/login', query: { redirect: '/stock-intel' } })
    }
  } finally {
    loading.value = false
  }
}

function removeStock(f) {
  const code = f.code || f.stock_code
  userStore.removeFavorite(code)
  favorites.value = favorites.value.filter((x) => (x.code || x.stock_code) !== code)
}

onMounted(load)
</script>

<template>
  <div class="container">
    <div class="card" v-loading="loading">
      <div class="section-title">自选股情报</div>
      <template v-if="favorites.length">
        <el-table :data="favorites" stripe @row-click="(row) => router.push(`/stock/${row.code || row.stock_code}`)" class="clickable-table">
          <el-table-column prop="code" label="代码" width="120">
            <template #default="{ row }">{{ row.code || row.stock_code }}</template>
          </el-table-column>
          <el-table-column prop="name" label="简称" min-width="140">
            <template #default="{ row }">
              <router-link :to="`/stock/${row.code || row.stock_code}`">{{ row.name || row.stock_name }}</router-link>
            </template>
          </el-table-column>
          <el-table-column label="最新价" width="130">
            <template #default="{ row }">
              <span v-if="prices[row.code || row.stock_code]">{{ prices[row.code || row.stock_code].price }}</span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="涨跌幅" width="130">
            <template #default="{ row }">
              <span v-if="prices[row.code || row.stock_code]" :class="prices[row.code || row.stock_code].change >= 0 ? 'up' : 'down'">
                {{ prices[row.code || row.stock_code].change >= 0 ? '+' : '' }}{{ prices[row.code || row.stock_code].change }}%
              </span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110">
            <template #default="{ row }">
              <el-button size="small" type="danger" link @click.stop="removeStock(row)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-else-if="!loading" description="暂无自选股，去股票详情页添加">
        <el-button type="primary" @click="router.push('/search')">去搜索股票</el-button>
      </el-empty>
    </div>

    <div class="card">
      <div class="section-title">自选股推送新闻</div>
      <ul v-if="news.length" class="news-list">
        <li v-for="(n, i) in news" :key="i">
          <div class="news-title">{{ n.title || n.标题 }}</div>
          <div v-if="n.summary || n.摘要" class="news-summary">{{ n.summary || n.摘要 }}</div>
        </li>
      </ul>
      <el-empty v-else description="暂无推送新闻" :image-size="80" />
    </div>

    <div class="card">
      <div class="section-title">自选股监控事件</div>
      <el-table v-if="events.length" :data="events" size="small" stripe>
        <el-table-column prop="stock_code" label="代码" width="110" />
        <el-table-column prop="stock_name" label="简称" min-width="120" />
        <el-table-column prop="change_type" label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.change_type === 'positive' ? 'danger' : 'info'">{{ row.change_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="事件" min-width="240" show-overflow-tooltip />
        <el-table-column prop="time" label="时间" width="160" />
      </el-table>
      <el-empty v-else description="暂无监控事件" :image-size="80" />
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

.news-list li:last-child {
  border-bottom: none;
}

.news-title {
  font-size: 0.95rem;
  line-height: 1.5;
}

.news-summary {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.6;
}
</style>
