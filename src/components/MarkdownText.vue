<script setup>
// 轻量 Markdown 渲染（支持加粗/链接/标题/列表/引用/代码），输出安全 HTML
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
})

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderInline(s) {
  let out = esc(s)
  // 行内代码
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  // 链接 [text](url)
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  // 加粗
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  return out
}

const html = computed(() => {
  const lines = (props.text || '').split('\n')
  let out = ''
  let inList = false
  let inQuote = false
  let inCode = false
  let codeBuf = []

  const closeList = () => {
    if (inList) { out += '</ul>'; inList = false }
  }
  const closeQuote = () => {
    if (inQuote) { out += '</blockquote>'; inQuote = false }
  }

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '')
    if (/^```/.test(line.trim())) {
      if (inCode) { out += '</pre>'; inCode = false }
      else { closeList(); closeQuote(); inCode = true; codeBuf = [] }
      continue
    }
    if (inCode) { codeBuf.push(esc(line)); continue }
    if (/^#{1,4}\s/.test(line)) {
      closeList(); closeQuote()
      const level = line.match(/^#+/)[0].length
      out += `<h${level}>${renderInline(line.replace(/^#+\s*/, ''))}</h${level}>`
    } else if (/^\s*[-*]\s+/.test(line)) {
      closeQuote()
      if (!inList) { out += '<ul>'; inList = true }
      out += `<li>${renderInline(line.replace(/^\s*[-*]\s+/, ''))}</li>`
    } else if (/^\s*>\s?/.test(line)) {
      closeList()
      if (!inList) { /* noop */ }
      if (!inQuote) { out += '<blockquote>'; inQuote = true }
      out += `<p>${renderInline(line.replace(/^\s*>\s?/, ''))}</p>`
    } else if (line.trim() === '') {
      closeList(); closeQuote()
    } else {
      closeList(); closeQuote()
      out += `<p>${renderInline(line)}</p>`
    }
  }
  closeList(); closeQuote()
  if (inCode && codeBuf.length) out += `<pre>${codeBuf.join('\n')}</pre>`
  return out
})
</script>

<template>
  <div class="md-body" v-html="html"></div>
</template>
