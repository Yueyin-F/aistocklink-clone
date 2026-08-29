<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: [String, Number], default: '' },
  score: { type: Number, default: null },
})

const color = computed(() => {
  const l = String(props.label || '').toUpperCase()
  const map = {
    A: '#f56c6c',
    B: '#e6a23c',
    C: '#409eff',
    D: '#909399',
    E: '#67c23a',
  }
  return map[l] || '#409eff'
})

const text = computed(() => (props.label !== '' && props.label !== null ? String(props.label) : props.score))
</script>

<template>
  <span class="score-badge" :style="{ background: color }">{{ text }}</span>
</template>
