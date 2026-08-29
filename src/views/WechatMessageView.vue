<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'
import MarkdownText from '../components/MarkdownText.vue'

const route = useRoute()
const msg = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const msgid = route.params.msgid
  if (!msgid) {
    error.value = '无效的消息ID'
    loading.value = false
    return
  }
  try {
    msg.value = await api.getWechatMessage(msgid)
  } catch (e) {
    error.value = e.message || '获取消息失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="wechat-page">
    <div class="card wechat-card" v-loading="loading">
      <template v-if="msg">
        <h2 class="msg-title">{{ msg.title || msg.标题 || '微信推送消息' }}</h2>
        <div v-if="msg.time || msg.时间" class="muted msg-time">{{ msg.time || msg.时间 }}</div>
        <MarkdownText v-if="msg.content || msg.正文" :text="msg.content || msg.正文" />
        <pre v-else class="msg-json">{{ JSON.stringify(msg, null, 2) }}</pre>
      </template>
      <el-alert v-else-if="error" :title="error" type="warning" :closable="false" />
    </div>
  </div>
</template>

<style scoped>
.wechat-page {
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 120px);
}

.wechat-card {
  width: 720px;
  max-width: 100%;
}

.msg-title {
  font-size: 1.2rem;
  margin-bottom: 8px;
}

.msg-time {
  margin-bottom: 14px;
}

.msg-json {
  white-space: pre-wrap;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
</style>
