<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useUserStore } from './stores/user'
import TheNavbar from './components/TheNavbar.vue'
import TheFooter from './components/TheFooter.vue'

const route = useRoute()
const userStore = useUserStore()

// 部分页面不显示顶部导航（登录页与原站一致隐藏导航避免重叠，微信消息页全屏展示）
const showHeader = computed(() => !['wechatMessage', 'login'].includes(route.name))

onMounted(() => {
  userStore.initAuth()
})
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div id="app-shell">
      <TheNavbar v-if="showHeader" />
      <main class="page-main">
        <router-view />
      </main>
      <TheFooter v-if="showHeader" />
    </div>
  </el-config-provider>
</template>

<style>
#app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
