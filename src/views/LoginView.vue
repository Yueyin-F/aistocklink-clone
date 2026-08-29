<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const tab = ref('sms')
const phone = ref('')
const code = ref('')
const sending = ref(false)
const countdown = ref(0)
const logging = ref(false)

// 微信扫码（演示模式：真实环境由后端下发二维码）
const qrUrl = ref('')
const qrState = ref('')
const qrLoading = ref(false)
let pollTimer = null

async function startWechatScan() {
  qrLoading.value = true
  try {
    const data = await api.getWechatScanUrl()
    qrUrl.value = data?.qr_url || data?.url || ''
    qrState.value = data?.state || ''
    startPoll()
  } catch (e) {
    // 演示二维码
    qrUrl.value = ''
    qrState.value = ''
  } finally {
    qrLoading.value = false
  }
}

async function startPoll() {
  stopPoll()
  pollTimer = setInterval(async () => {
    try {
      const data = await api.pollWechatScan(qrState.value)
      if (data?.status === 'success' || data?.token || data?.user) {
        stopPoll()
        userStore.user = data?.user || data
        userStore.isAuthenticated = true
        ElMessage.success('登录成功')
        router.push(route.query.redirect || '/')
      }
    } catch (e) { /* 未扫码 */ }
  }, 3000)
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function sendCode() {
  if (!/^1\d{10}$/.test(phone.value)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  sending.value = true
  try {
    await api.sendSmsCode({ phone: phone.value })
    ElMessage.success('验证码已发送')
    countdown.value = 60
    const t = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(t)
    }, 1000)
  } catch (e) {
    ElMessage.error(e.message || '发送失败')
  } finally {
    sending.value = false
  }
}

async function smsLogin() {
  if (!/^1\d{10}$/.test(phone.value) || !code.value.trim()) {
    ElMessage.warning('请输入手机号和验证码')
    return
  }
  logging.value = true
  try {
    await userStore.loginWithSms(phone.value, code.value.trim())
    ElMessage.success('登录成功')
    router.push(route.query.redirect || '/')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    logging.value = false
  }
}

function onTabChange(name) {
  if (name === 'wechat') startWechatScan()
}

async function demoLogin() {
  logging.value = true
  try {
    await userStore.demoLogin()
    ElMessage.success('演示账号登录成功（离线体验模式）')
    router.push(route.query.redirect || '/')
  } catch (e) {
    ElMessage.error('登录失败')
  } finally {
    logging.value = false
  }
}
</script>

<template>
  <div class="container login-page">
    <div class="card login-card">
      <div class="login-head">
        <router-link to="/" class="back-home">← 返回首页</router-link>
        <div class="section-title">用户登录</div>
      </div>
      <el-tabs v-model="tab" @tab-change="onTabChange">
        <el-tab-pane label="短信登录" name="sms">
          <el-alert
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 12px"
            title="短信服务为原站后端提供，当前原站未配置短信通道（需阿里云/腾讯云凭证），暂无法收到验证码。"
          />
          <el-form label-width="80px" style="max-width: 380px">
            <el-form-item label="手机号">
              <el-input v-model="phone" placeholder="11位手机号" maxlength="11" />
            </el-form-item>
            <el-form-item label="验证码">
              <div class="code-row">
                <el-input v-model="code" placeholder="6位验证码" maxlength="6" />
                <el-button :disabled="countdown > 0" :loading="sending" @click="sendCode">
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="logging" style="width: 100%" @click="smsLogin">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="微信扫码登录" name="wechat">
          <div class="qr-area" v-loading="qrLoading">
            <div v-if="qrUrl" class="qr-box">
              <img :src="qrUrl" alt="微信扫码登录" style="width: 220px; height: 220px" />
              <p class="muted">请使用微信扫描二维码登录</p>
            </div>
            <div v-else class="qr-fallback">
              <el-empty description="演示模式：微信扫码登录需原站微信开放平台配置" :image-size="100" />
              <p class="muted">可先使用下方「演示账号登录」体验完整功能</p>
            </div>
          </div>
        </el-tab-pane>

        <!-- 演示账号登录（自研：原站短信/微信服务不可用时的本地离线体验模式） -->
        <div class="demo-login">
          <el-divider><span class="muted">或</span></el-divider>
          <el-button type="success" plain style="width: 100%" @click="demoLogin">
            🚀 演示账号登录（离线体验完整功能）
          </el-button>
          <p class="muted demo-tip">无需手机号/验证码，自选股等数据保存在本地浏览器，适合演示与面试展示</p>
        </div>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.login-card {
  width: 520px;
  max-width: 100%;
}

.login-head {
  position: relative;
  text-align: center;
}

.login-head .section-title {
  justify-content: center;
  margin-bottom: 12px;
}

.back-home {
  position: absolute;
  left: 0;
  top: 4px;
  font-size: 0.85rem;
  color: var(--text-tertiary);
}

.back-home:hover {
  color: var(--primary-color);
}

.code-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.qr-area {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-box {
  text-align: center;
}

.qr-fallback {
  text-align: center;
}

.demo-login {
  margin-top: 4px;
}

.demo-tip {
  text-align: center;
  font-size: 0.78rem;
  margin-top: 8px;
}
</style>
