import { defineStore } from 'pinia'
import api from '../api'

const FAV_KEY = 'aistock_favorites_cache'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    favoriteStocks: [],
    favoritesSyncing: false,
    favoritesSyncError: null,
  }),
  getters: {
    currentUser: (s) => s.user,
    isLoggedIn: (s) => s.isAuthenticated,
  },
  actions: {
    async initAuth() {
      try {
        const data = await api.getUserInfo()
        if (data && data.user) {
          this.user = data.user
          this.isAuthenticated = true
        }
      } catch (e) {
        this.isAuthenticated = false
      }
      // 恢复自选股缓存
      try {
        const cached = localStorage.getItem(FAV_KEY)
        if (cached) this.favoriteStocks = JSON.parse(cached)
      } catch (e) { /* ignore */ }
      if (this.isAuthenticated) await this.syncFavorites()
    },
    async syncFavorites() {
      try {
        const list = await api.getFavorites()
        this.favoriteStocks = list || []
        localStorage.setItem(FAV_KEY, JSON.stringify(this.favoriteStocks))
      } catch (e) {
        this.favoritesSyncError = e.message
      }
    },
    async addFavorite(stock) {
      this.favoriteStocks.push(stock)
      localStorage.setItem(FAV_KEY, JSON.stringify(this.favoriteStocks))
      if (!this.isAuthenticated) return
      try {
        await api.addFavorite(stock)
      } catch (e) {
        console.error('添加自选股失败:', e)
      }
    },
    async removeFavorite(code) {
      this.favoriteStocks = this.favoriteStocks.filter((s) => s.code !== code && s.stock_code !== code)
      localStorage.setItem(FAV_KEY, JSON.stringify(this.favoriteStocks))
      if (!this.isAuthenticated) return
      try {
        await api.deleteFavorite({ stock_code: code })
      } catch (e) {
        console.error('删除自选股失败:', e)
      }
    },
    isFavorite(code) {
      return this.favoriteStocks.some((s) => s.code === code || s.stock_code === code)
    },
    async loginWithSms(phone, code) {
      const data = await api.smsLogin({ phone, code })
      this.user = data?.user || data
      this.isAuthenticated = true
      await this.syncFavorites()
      return data
    },
    async logout() {
      try {
        await api.logout()
      } catch (e) { /* ignore */ }
      this.user = null
      this.isAuthenticated = false
      this.favoriteStocks = []
      localStorage.removeItem(FAV_KEY)
    },
  },
})
