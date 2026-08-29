<script setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import api from '../api'

const props = defineProps({
  news: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  showTag: { type: Boolean, default: true },
})

const detailVisible = ref(false)
const detail = ref(null)
const detailLoading = ref(false)

async function openDetail(item) {
  if (!item.id && !item.ID) return
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const data = await api.getNewsFullText(item.id || item.ID)
    detail.value = data
  } catch (e) {
    detail.value = { 标题: item.title || item.标题, 正文: item.content || item.摘要 || item.内容 }
  } finally {
    detailLoading.value = false
  }
}

function fmtTime(t) {
  if (!t) return ''
  return dayjs(t).format('MM-DD HH:mm')
}
</script>

<template>
  <div v-loading="loading">
    <ul v-if="news.length" class="news-list">
      <li v-for="(item, idx) in news" :key="item.id || item.ID || idx">
        <div class="news-title" @click="openDetail(item)">{{ item.title || item.标题 }}</div>
        <div v-if="item.content || item.摘要" class="news-summary">{{ item.content || item.摘要 }}</div>
        <div class="news-meta">
          <span v-if="item.author || item.作者">{{ item.author || item.作者 }}</span>
          <span v-if="item.author || item.作者" class="sep">·</span>
          <span>{{ fmtTime(item.publish_time || item.时间) }}</span>
          <span v-if="item.source || item.来源" class="sep">·</span>
          <span v-if="item.source || item.来源">{{ item.source || item.来源 }}</span>
        </div>
      </li>
    </ul>
    <el-empty v-else-if="!loading" description="暂无新闻" :image-size="80" />
  </div>

  <el-dialog v-model="detailVisible" title="新闻详情" width="720px" top="6vh">
    <div v-loading="detailLoading" class="news-detail">
      <template v-if="detail">
        <h2 class="detail-title">{{ detail.标题 || detail.title }}</h2>
        <div class="detail-meta">
          <span v-if="detail.作者">{{ detail.作者 }}</span>
          <span v-if="detail.作者" class="sep">·</span>
          <span>{{ detail.时间 }}</span>
        </div>
        <div class="detail-body">{{ detail.正文 || detail.内容 || detail.摘要 || detail.content }}</div>
        <a v-if="detail.链接" :href="detail.链接" target="_blank" rel="noopener noreferrer">查看原文</a>
      </template>
    </div>
  </el-dialog>
</template>

<style scoped>
.news-detail {
  min-height: 120px;
}

.detail-title {
  font-size: 1.15rem;
  margin-bottom: 8px;
  line-height: 1.5;
}

.detail-meta {
  color: var(--text-tertiary);
  font-size: 0.85rem;
  margin-bottom: 14px;
}

.sep {
  margin: 0 6px;
}

.detail-body {
  line-height: 1.9;
  color: var(--text-secondary);
  font-size: 0.95rem;
  white-space: pre-wrap;
}
</style>
