<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  news: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  headlineStyle: { type: Boolean, default: false },
})

const emit = defineEmits(['showDetail', 'tagClick'])

const newsList = ref([])
const activeIndex = ref(0)
let timer = null

watch(
  () => props.news,
  (v) => {
    newsList.value = v || []
    startTimer()
  },
  { immediate: true }
)

function startTimer() {
  clearInterval(timer)
  if (newsList.value.length > 1) {
    timer = setInterval(() => {
      activeIndex.value = (activeIndex.value + 1) % newsList.value.length
    }, 10000)
  }
}

function selectNews(i) {
  activeIndex.value = i
  startTimer()
}

function changeNews(delta) {
  if (!newsList.value.length) return
  activeIndex.value = (activeIndex.value + delta + newsList.value.length) % newsList.value.length
  startTimer()
}

function preview(item) {
  const c = item.content || item.summary || item.摘要 || ''
  return c && c !== '暂无内容' ? c : '暂无内容'
}

function author(item) {
  return typeof item === 'object' ? String(item.author || item.source || item.作者 || item.来源 || '').trim() : ''
}

function onShow(item) {
  emit('showDetail', item)
}

// 触屏滑动
const touch = ref({ startX: 0, startY: 0, curX: 0, curY: 0, isSwipe: false })
const THRESHOLD = 50
function handleTouchStart(e) {
  const t = e.touches[0]
  Object.assign(touch.value, { startX: t.clientX, startY: t.clientY, curX: t.clientX, curY: t.clientY, isSwipe: false })
}
function handleTouchMove(e) {
  const t = e.touches[0]
  touch.value.curX = t.clientX
  touch.value.curY = t.clientY
  const dx = Math.abs(touch.value.curX - touch.value.startX)
  const dy = Math.abs(touch.value.curY - touch.value.startY)
  if (dx > dy && dx > 10) {
    touch.value.isSwipe = true
    e.preventDefault()
  }
}
function handleTouchEnd() {
  if (!touch.value.isSwipe) return
  const dx = touch.value.curX - touch.value.startX
  const dy = Math.abs(touch.value.curY - touch.value.startY)
  if (Math.abs(dx) > THRESHOLD && dy < 100) {
    changeNews(dx > 0 ? -1 : 1)
  }
  touch.value.isSwipe = false
}

onMounted(startTimer)
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="news-slider">
    <h4 v-if="title" class="news-slider-title">{{ title }}</h4>
    <div
      class="news-slideshow-container"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div class="news-slides" :class="{ 'headline-slides': headlineStyle }">
        <div
          v-for="(item, i) in newsList"
          :key="item.id || i"
          class="news-slide"
          :class="{ active: activeIndex === i, 'headline-slide': headlineStyle }"
        >
          <a
            class="news-title"
            :class="{ 'headline-news-title': headlineStyle }"
            href="javascript:void(0)"
            @click.prevent="onShow(item)"
          >{{ item.title || item.标题 }}</a>
          <div v-if="item.tag && ((item.tag.positive || []).length || (item.tag.negative || []).length)" class="news-tags">
            <span
              v-for="t in item.tag.positive"
              :key="'pos-' + t"
              class="news-tag positive"
              @click.stop="emit('tagClick', t)"
            >{{ t }}</span>
            <span
              v-for="t in item.tag.negative"
              :key="'neg-' + t"
              class="news-tag negative"
              @click.stop="emit('tagClick', t)"
            >{{ t }}</span>
          </div>
          <p class="news-preview" :class="{ 'headline-news-preview': headlineStyle }">{{ preview(item) }}</p>
          <p class="news-meta" :class="{ 'headline-news-meta': headlineStyle }">
            <span v-if="author(item)">{{ author(item) }}</span>
            <span v-if="author(item) && (item.publish_time || item.时间)">·</span>
            <span class="news-time" :class="{ 'headline-news-time': headlineStyle }">
              {{ item.publish_time || item.时间 || '时间未知' }}
            </span>
          </p>
        </div>
      </div>
      <button class="slide-nav prev" @click="changeNews(-1)">❮</button>
      <button class="slide-nav next" @click="changeNews(1)">❯</button>
      <div class="news-dots" :class="{ 'headline-dots': headlineStyle }">
        <span
          v-for="(n, i) in newsList"
          :key="i"
          :class="{ active: activeIndex === i }"
          @click="selectNews(i)"
        ></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.news-slider-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary-color);
  display: inline-block;
}

.news-slideshow-container {
  position: relative;
}

.news-slides {
  position: relative;
  min-height: 140px;
}

.news-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.45s ease;
}

.news-slide.active {
  opacity: 1;
  pointer-events: auto;
  position: relative;
}

.news-title {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 8px;
  text-decoration: none;
}

.news-title:hover {
  color: var(--primary-color);
}

.headline-news-title {
  font-size: 1.25rem;
  font-weight: 700;
}

.news-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.news-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.78rem;
  cursor: pointer;
}

.news-tag.positive {
  background: #fff1f0;
  color: #d4380d;
  border: 1px solid #ffccc7;
}

.news-tag.negative {
  background: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}

.news-preview {
  color: var(--text-secondary);
  font-size: 0.88rem;
  line-height: 1.7;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.headline-news-preview {
  -webkit-line-clamp: 4;
  font-size: 0.92rem;
}

.news-meta {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.slide-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.slide-nav.prev {
  left: -8px;
}

.slide-nav.next {
  right: -8px;
}

.slide-nav:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.news-dots {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  justify-content: center;
}

.news-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #dcdfe6;
  cursor: pointer;
  transition: all 0.2s;
}

.news-dots span.active {
  background: var(--primary-color);
  width: 16px;
  border-radius: 3px;
}

.headline-dots {
  justify-content: flex-start;
}
</style>
