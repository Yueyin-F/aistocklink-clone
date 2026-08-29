<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const tagCode = ref('')
const tagName = ref('')
const leaders = ref([])
const source = ref('')
const sortField = ref('')
const loading = ref(false)
const count = ref(20)
const followLoading = ref({})

// 周期: 默认/短线/中线/长线（存储于 localStorage）
const CYCLE_KEY = 'aistock_stockCycle'
const cycles = [
  { key: 'default', label: '默认' },
  { key: 'short', label: '短线' },
  { key: 'mid', label: '中线' },
  { key: 'long', label: '长线' },
]
const cycle = ref(localStorage.getItem(CYCLE_KEY) || 'default')

function setCycle(c) {
  cycle.value = c
  try {
    localStorage.setItem(CYCLE_KEY, c)
  } catch (e) { /* ignore */ }
  load()
}

async function load() {
  const code = String(route.params.tagCode || tagCode.value || '').trim().toUpperCase()
  tagCode.value = code
  if (!/^BK\d{4}$/.test(code)) {
    ElMessage.warning('板块代码格式应为 BK+4位数字（如 BK0475）')
    return
  }
  loading.value = true
  try {
    const data = await api.getTagLeaders(code, count.value)
    source.value = data?.来源 || ''
    sortField.value = data?.排序字段 || ''
    tagName.value = route.query.name || data?.板块ID || code
    leaders.value = (data?.龙头个股 || []).map((s) => ({
      code: s['股票代码'] || s.code || s.f12 || '',
      name: s['股票简称'] || s.name || '',
      industry: s['所属行业'] || s.industry || '',
      price: s['最新价'] ?? s.price ?? null,
      changePct: s['涨跌幅'] ?? s.change_pct ?? null,
      mainInflow: s['主力净流入'] ?? s.main_inflow ?? null,
    }))
  } catch (e) {
    ElMessage.error(e.message || '获取板块龙头失败')
  } finally {
    loading.value = false
  }
}

function goDetail(row) {
  if (row.code) router.push(`/stock/${row.code}`)
}

function isFollowed(code) {
  return userStore.isFavorite(code)
}

async function toggleFollow(row) {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后才能添加自选股')
    router.push('/login')
    return
  }
  followLoading.value = { ...followLoading.value, [row.code]: true }
  try {
    if (isFollowed(row.code)) {
      await userStore.removeFavorite(row.code)
    } else {
      await userStore.addFavorite({ code: row.code, name: row.name })
    }
  } catch (e) {
    ElMessage.error('操作失败，请稍后再试')
  } finally {
    followLoading.value = { ...followLoading.value, [row.code]: false }
  }
}

function fmtInflow(v) {
  if (v == null) return '--'
  const n = Number(v)
  if (!Number.isFinite(n)) return '--'
  const y = n / 1e8
  return Math.abs(y) >= 1 ? y.toFixed(2) + '亿' : (n / 1e4).toFixed(0) + '万'
}

const fmtPrice = (p) => (p == null ? '--' : Number(p).toFixed(2))
const fmtPct = (p) => (p == null ? '--' : (p >= 0 ? '+' : '') + Number(p).toFixed(2) + '%')

watch(() => route.params.tagCode, load)
onMounted(load)
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="section-title">
        板块龙头 · {{ tagName || tagCode }}
        <span v-if="source" class="muted">数据来源: {{ source }}</span>
      </div>
      <div class="search-bar">
        <el-input v-model="tagCode" placeholder="板块代码 BK+4位，如 BK0475" style="max-width: 260px" @keyup.enter="router.replace({ path: `/tags/${tagCode}`, query: { name: tagName } })" />
        <el-input-number v-model="count" :min="1" :max="100" />
        <el-button type="primary" @click="router.replace({ path: `/tags/${tagCode}`, query: { name: tagName } })">查询</el-button>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <!-- 周期筛选 -->
      <div class="cycle-filter">
        <button
          v-for="c in cycles"
          :key="c.key"
          class="cycle-btn"
          :class="{ 'is-active': cycle === c.key }"
          @click="setCycle(c.key)"
        >{{ c.label }}</button>
      </div>

      <el-table :data="leaders" stripe @row-click="goDetail" class="clickable-table">
        <el-table-column label="股票" min-width="160">
          <template #default="{ row }">
            <div class="stock-identity">
              <h4 class="stock-name">
                <router-link :to="`/stock/${row.code}`">{{ row.name }}</router-link>
              </h4>
              <span class="stock-code-line">{{ row.code }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="industry" label="板块" min-width="120">
          <template #default="{ row }">
            <el-tag v-if="row.industry" size="small" type="info" effect="plain">{{ row.industry }}</el-tag>
            <span v-else class="muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="最新价" min-width="100" align="right">
          <template #default="{ row }">{{ fmtPrice(row.price) }}</template>
        </el-table-column>
        <el-table-column label="涨跌幅" min-width="100" align="right">
          <template #default="{ row }">
            <span :class="(row.changePct ?? 0) >= 0 ? 'up' : 'down'">{{ fmtPct(row.changePct) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="sortField ? `${sortField}（排名依据）` : '主力净流入'" min-width="140" align="right">
          <template #default="{ row }">{{ fmtInflow(row.mainInflow) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click.stop="goDetail(row)">查看详情</el-button>
            <el-button
              v-if="userStore.isLoggedIn"
              size="small"
              :type="isFollowed(row.code) ? 'danger' : 'primary'"
              plain
              :loading="followLoading[row.code]"
              @click.stop="toggleFollow(row)"
            >{{ isFollowed(row.code) ? '取消关注' : '添加关注' }}</el-button>
            <el-button v-else size="small" type="primary" plain @click.stop="router.push('/login')">登录关注</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !leaders.length" description="该板块暂无龙头数据" :image-size="80">
        <p class="muted">可在搜索框更换板块代码（BK+4位数字）查询</p>
      </el-empty>
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

.cycle-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.cycle-btn {
  padding: 5px 16px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.cycle-btn:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.cycle-btn.is-active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: #fff;
}

.clickable-table :deep(.el-table__row) {
  cursor: pointer;
}

.stock-identity .stock-name {
  margin: 0;
  font-size: 0.95rem;
}

.stock-code-line {
  color: var(--text-tertiary);
  font-size: 0.75rem;
}
</style>
