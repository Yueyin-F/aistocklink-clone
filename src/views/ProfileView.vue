<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const settings = ref([])
const loading = ref(false)

async function loadSettings() {
  loading.value = true
  try {
    const data = await api.getPushSettings()
    settings.value = data?.settings || data || []
  } catch (e) {
    settings.value = []
  } finally {
    loading.value = false
  }
}

async function toggle(item) {
  try {
    await api.updatePushSetting(item.key, { enabled: item.enabled })
    ElMessage.success('设置已更新')
  } catch (e) {
    item.enabled = !item.enabled
    ElMessage.error(e.message || '更新失败')
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="container profile-page">
    <div class="card">
      <div class="section-title">个人信息</div>
      <div v-if="userStore.currentUser" class="user-info">
        <el-avatar :size="64" :src="userStore.currentUser.avatar || '/img/default-avatar.e709af70.svg'" />
        <div class="user-detail">
          <div class="user-name">{{ userStore.currentUser.name || '用户' }}</div>
          <div class="muted">UID: {{ userStore.currentUser.id || '-' }}</div>
        </div>
      </div>
      <el-empty v-else description="未登录">
        <el-button type="primary" @click="router.push('/login')">去登录</el-button>
      </el-empty>
    </div>

    <div class="card" v-loading="loading">
      <div class="section-title">推送设置</div>
      <template v-if="settings.length">
        <div v-for="s in settings" :key="s.key || s.name" class="setting-row">
          <div>
            <div class="setting-name">{{ s.name || s.label || s.key }}</div>
            <div v-if="s.description" class="muted">{{ s.description }}</div>
          </div>
          <el-switch v-model="s.enabled" @change="toggle(s)" />
        </div>
      </template>
      <el-empty v-else-if="!loading" description="暂无推送设置" :image-size="80" />
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 760px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  font-size: 1.2rem;
  font-weight: 600;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-name {
  font-size: 0.95rem;
  margin-bottom: 4px;
}
</style>
