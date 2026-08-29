<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import api from '../api'

const router = useRouter()
const allHistory = ref([]) // 一次性拉取的服务端数据
const ranking = ref(null)
const loading = ref(false)
const page = ref(1)
const pageSize = 15
const total = ref(0)

// 客户端分页（服务端接口无 total 字段时按列表长度分页）
const pagedHistory = computed(() => {
  const start = (page.value - 1) * pageSize
  return allHistory.value.slice(start, start + pageSize)
})

async function load() {
  loading.value = true
  try {
    const [h, r] = await Promise.allSettled([
      api.getPushHistory({ page: 1, per_page: 100 }),
      api.getPushRanking({ limit: 50 }),
    ])
    if (h.status === 'fulfilled') {
      allHistory.value = h.value?.items || h.value?.history || []
      total.value = h.value?.total || allHistory.value.length
    }
    if (r.status === 'fulfilled') ranking.value = r.value
  } catch (e) {
    allHistory.value = []
  } finally {
    loading.value = false
  }
}

function onPageChange(p) {
  page.value = p
}

onMounted(load)
</script>

<template>
  <div class="container">
    <!-- 战绩概览 -->
    <div v-if="ranking?.summary" class="card">
      <div class="section-title">长线风口龙头历史表现</div>
      <div class="summary-grid">
        <div class="sum-item"><span class="l">累计推送</span><span class="v">{{ ranking.summary.total }}</span></div>
        <div class="sum-item"><span class="l">上涨次数</span><span class="v up">{{ ranking.summary.winners }}</span></div>
        <div class="sum-item"><span class="l">胜率</span><span class="v">{{ ranking.summary.win_rate }}%</span></div>
        <div class="sum-item"><span class="l">平均收益</span><span class="v" :class="ranking.summary.average_return_pct >= 0 ? 'up' : 'down'">{{ ranking.summary.average_return_pct }}%</span></div>
        <div v-if="ranking.summary.best" class="sum-item best">
          <span class="l">最佳</span>
          <span class="v">{{ ranking.summary.best.stock_name }} <span class="up">+{{ ranking.summary.best.return_pct }}%</span></span>
        </div>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <div class="section-title">
        推送记录
        <span class="muted" v-if="total">共 {{ total }} 条</span>
      </div>
      <el-table
        :data="pagedHistory"
        stripe
        size="small"
        height="440"
        @row-click="(row) => router.push(`/stock/${row.stock_code}`)"
        class="clickable-table"
      >
        <el-table-column prop="push_date" label="推送日期" width="110" />
        <el-table-column prop="stock_code" label="代码" width="100" />
        <el-table-column prop="stock_name" label="简称" min-width="110">
          <template #default="{ row }">
            <router-link :to="`/stock/${row.stock_code}`">{{ row.stock_name }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="theme" label="主题" min-width="140" show-overflow-tooltip />
        <el-table-column prop="chain_position" label="环节" width="90" />
        <el-table-column prop="reason_tag" label="标签" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.reason_tag" size="small" type="warning" effect="plain">{{ row.reason_tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="评分" width="80">
          <template #default="{ row }"><b class="up">{{ row.score }}</b></template>
        </el-table-column>
        <el-table-column label="收益率" width="110">
          <template #default="{ row }">
            <span :class="(row.return_pct ?? 0) >= 0 ? 'up' : 'down'">
              {{ (row.return_pct ?? 0) >= 0 ? '+' : '' }}{{ row.return_pct ?? '-' }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="push_time" label="推送时间" min-width="150">
          <template #default="{ row }">{{ dayjs(row.push_time).format('YYYY-MM-DD HH:mm') }}</template>
        </el-table-column>
      </el-table>
      <div class="pager" v-if="total > pageSize">
        <el-pagination
          size="small"
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          @current-change="onPageChange"
        />
      </div>
      <el-empty v-if="!loading && !allHistory.length" description="暂无推送记录" :image-size="80" />
    </div>
  </div>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.sum-item {
  background: #f9fafc;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sum-item .l {
  color: var(--text-tertiary);
  font-size: 0.85rem;
}

.sum-item .v {
  font-size: 1.3rem;
  font-weight: 700;
}

.sum-item.best .v {
  font-size: 1rem;
}

.clickable-table :deep(.el-table__row) {
  cursor: pointer;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
