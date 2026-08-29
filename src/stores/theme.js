import { defineStore } from 'pinia'

const THEME_KEY = 'aistock_theme'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    dark: localStorage.getItem(THEME_KEY) === 'dark',
  }),
  actions: {
    toggle() {
      this.dark = !this.dark
      localStorage.setItem(THEME_KEY, this.dark ? 'dark' : 'light')
      this.apply()
    },
    apply() {
      document.documentElement.classList.toggle('dark', this.dark)
    },
    init() {
      this.apply()
    },
  },
})
