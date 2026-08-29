<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const mobileMenuOpen = ref(false)
const toggleMobileMenu = () => (mobileMenuOpen.value = !mobileMenuOpen.value)
const closeMobileMenu = () => (mobileMenuOpen.value = false)

const handleLogout = async () => {
  await userStore.logout()
  closeMobileMenu()
  router.push('/')
}
</script>

<template>
  <nav class="navbar">
    <div class="container navbar-container">
      <div class="logo">
        <router-link to="/">
          <img src="/img/logo.c2355390.png" alt="股票资讯AI智能分析" />
          <div class="logo-divider"></div>
          <span class="logo-text">股票资讯AI智能分析</span>
        </router-link>
      </div>

      <div class="menu-toggle" @click="toggleMobileMenu">
        <img v-if="!mobileMenuOpen" src="/img/menu.3035aacc.svg" alt="菜单" />
        <i v-else class="el-icon-close"></i>
      </div>

      <!-- 移动端菜单 -->
      <div class="mobile-menu" :class="{ open: mobileMenuOpen }">
        <router-link to="/" class="menu-item" @click="closeMobileMenu">首页</router-link>
        <router-link to="/search" class="menu-item" @click="closeMobileMenu">搜索股票</router-link>
        <router-link to="/forecast" class="menu-item" @click="closeMobileMenu">业绩预测</router-link>
        <router-link to="/trend" class="menu-item" @click="closeMobileMenu">趋势股评分</router-link>
        <router-link to="/compare" class="menu-item" @click="closeMobileMenu">个股对比</router-link>
        <router-link to="/event" class="menu-item" @click="closeMobileMenu">事件传导</router-link>
        <router-link v-if="userStore.isLoggedIn" to="/potential-push-history" class="menu-item" @click="closeMobileMenu">推送历史</router-link>
        <router-link v-if="userStore.isLoggedIn" to="/favorites" class="menu-item" @click="closeMobileMenu">我的自选股</router-link>
        <router-link to="/download" class="menu-item" @click="closeMobileMenu">下载 App</router-link>
        <div class="menu-item" @click="themeStore.toggle()">{{ themeStore.dark ? '☀ 切换浅色模式' : '🌙 切换深色模式' }}</div>
        <template v-if="userStore.isLoggedIn">
          <router-link to="/profile" class="menu-item" @click="closeMobileMenu">个人信息</router-link>
          <div class="menu-item" @click="handleLogout">退出登录</div>
        </template>
        <router-link v-else to="/login" class="menu-item" @click="closeMobileMenu">登录</router-link>
      </div>

      <!-- 桌面端导航 -->
      <div class="nav-links">
        <router-link to="/" class="nav-item" @click="closeMobileMenu">首页</router-link>
        <router-link to="/search" class="nav-item" @click="closeMobileMenu">搜索股票</router-link>
        <router-link to="/forecast" class="nav-item" @click="closeMobileMenu">业绩预测</router-link>
        <router-link to="/trend" class="nav-item" @click="closeMobileMenu">趋势股评分</router-link>
        <router-link to="/compare" class="nav-item" @click="closeMobileMenu">个股对比</router-link>
        <router-link to="/event" class="nav-item" @click="closeMobileMenu">事件传导</router-link>
        <router-link v-if="userStore.isLoggedIn" to="/potential-push-history" class="nav-item" @click="closeMobileMenu">推送历史</router-link>
        <router-link v-if="userStore.isLoggedIn" to="/favorites" class="nav-item" @click="closeMobileMenu">我的自选股</router-link>
      </div>

      <div class="user-area">
        <button class="theme-toggle" :title="themeStore.dark ? '切换浅色模式' : '切换深色模式'" @click="themeStore.toggle()">
          {{ themeStore.dark ? '☀' : '🌙' }}
        </button>
        <router-link to="/download" class="download-app-btn" @click="closeMobileMenu">下载 App</router-link>
        <el-dropdown v-if="userStore.isLoggedIn" trigger="click">
          <div class="user-avatar">
            <img :src="userStore.currentUser?.avatar || '/img/default-avatar.e709af70.svg'" alt="头像" />
            <span>{{ userStore.currentUser?.name || '用户' }}</span>
            <i class="el-icon-arrow-down"></i>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <router-link to="/profile" @click="closeMobileMenu">个人信息</router-link>
              </el-dropdown-item>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <router-link v-else to="/login" class="login-btn" @click="closeMobileMenu">
          <el-button type="primary" size="small">登录</el-button>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.navbar-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.logo {
  min-width: 0;
}

.logo a {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--primary-color);
  font-weight: 700;
  font-size: 1.35rem;
  min-width: 0;
}

.logo a img {
  height: 36px;
}

.logo a .logo-divider {
  width: 1.5px;
  height: 22px;
  background: var(--primary-color);
  margin: 0 5px;
}

.logo a .logo-text {
  white-space: nowrap;
}

.menu-toggle {
  display: none;
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
}

.menu-toggle img {
  width: 24px;
  height: 24px;
}

.menu-toggle i {
  font-size: 24px;
  color: var(--text-primary);
}

.mobile-menu {
  display: none;
  flex-direction: column;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 10px 0;
  z-index: 1000;
  overflow-y: auto;
}

.mobile-menu.open {
  display: flex !important;
}

.mobile-menu .menu-item {
  text-decoration: none;
  color: var(--text-primary);
  padding: 10px 20px;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.mobile-menu .menu-item:last-child {
  border-bottom: none;
}

.mobile-menu .menu-item:hover {
  background-color: var(--background-hover);
}

.nav-links {
  display: flex;
}

.nav-links .nav-item {
  text-decoration: none;
  color: var(--text-primary);
  margin: 0 15px;
  padding: 10px 0;
  position: relative;
  white-space: nowrap;
}

.nav-links .nav-item:hover {
  color: var(--primary-color);
}

.nav-links .nav-item.router-link-active {
  color: var(--primary-color);
  font-weight: 600;
}

.nav-links .nav-item.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-color);
}

.user-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.download-app-btn {
  color: var(--primary-color);
  text-decoration: none;
  border: 1px solid var(--primary-color);
  padding: 4px 14px;
  border-radius: 16px;
  font-size: 0.85rem;
  white-space: nowrap;
}

.theme-toggle {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.theme-toggle:hover {
  border-color: var(--primary-color);
  transform: rotate(20deg);
}

.download-app-btn:hover {
  background: rgba(64, 158, 255, 0.08);
  opacity: 1;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.user-avatar img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
}

@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
    z-index: 1010;
  }
  .nav-links {
    display: none;
  }
  .user-area {
    display: none;
  }
}

@media (max-width: 1100px) {
  .logo a {
    font-size: 1.1rem;
  }
  .logo a .logo-divider,
  .logo a .logo-text {
    display: none;
  }
  .nav-links .nav-item {
    margin: 0 10px;
  }
}

@media (max-width: 576px) {
  .navbar {
    padding: 0 10px;
  }
  .navbar-container {
    height: 60px;
  }
  .logo a {
    font-size: 1rem;
  }
}
</style>
