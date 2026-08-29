<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 50
const loading = ref(false)
const sortBy = ref('forecast_netprofit_yoy')
const sortOrder = ref('desc')
const keyword = ref('')

async function load() {
  loading.value = true
  try {
    let data
    const kw = keyword.value.trim()
    if (kw) {
      data = await api.searchProfitForecast({ keyword: kw, page: page.value, pageSize, sortBy: sortBy.value, sortOrder: sortOrder.value })
    } else {
      data = await api.getProfitForecast({ page: page.value, pageSize, sortBy: sortBy.value, sortOrder: sortOrder.value })
    }
    list.value = data?.盈利预测列表 || []
    total.value = data?.总数量 || 0
  } catch (e) {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onSortChange({ prop, order }) {
  if (!prop) return
  sortBy.value = prop
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  page.value = 1
  load()
}

function onPageChange(p) {
  page.value = p
  load()
}

function doSearch() {
  page.value = 1
  load()
}

onMounted(load)
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="section-title">业绩预测</div>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="按股票代码 / 简称 / 行业搜索"
          clearable
          style="max-width: 360px"
          @keyup.enter="doSearch"
        >
          <template #append>
            <el-button :loading="loading" @click="doSearch">搜索</el-button>
          </template>
        </el-input>
        <span class="muted">共 {{ total }} 只股票的机构盈利预测</span>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <el-table
        :data="list"
        stripe
        :default-sort="{ prop: sortBy, order: sortOrder === 'desc' ? 'descending' : 'ascending' }"
        @sort-change="onSortChange"
        @row-click="(row) => router.push(`/stock/${row.股票代码}`)"
        class="clickable-table"
      >
        <el-table-column prop="股票代码" label="代码" width="110" sortable="custom" />
        <el-table-column prop="股票简称" label="简称" min-width="130">
          <template #default="{ row }">
            <router-link :to="`/stock/${row.股票代码}`">{{ row.股票简称 }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="净利润同比(%)" label="净利润同比" min-width="130" sortable="custom">
          <template #default="{ row }">
            <span class="up">{{ (row['净利润同比(%)'] ?? 0).toLocaleString() }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="净利润预测" label="净利润预测" min-width="120" />
        <el-table-column prop="EPS预测" label="EPS 预测" min-width="110" />
        <el-table-column prop="EPS同比" label="EPS 同比" min-width="110">
          <template #default="{ row }">
            <span class="up">{{ row.EPS同比 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="机构数量" label="机构数" width="90" sortable="custom" />
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="router.push(`/stock/${row.股票代码}`)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          @current-change="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.clickable-table :deep(.el-table__row) {
  cursor: pointer;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
