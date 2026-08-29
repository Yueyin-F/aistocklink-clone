<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import api from '../api'
import { cachedFetch } from '../utils/cache'
import { useUserStore } from '../stores/user'
import NewsSlider from '../components/NewsSlider.vue'
import MarketOverview from '../components/MarketOverview.vue'
import WindLeaderPanel from '../components/WindLeaderPanel.vue'
import HotBurstPanel from '../components/HotBurstPanel.vue'
import StockCardList from '../components/StockCardList.vue'

const router = useRouter()
const userStore = useUserStore()

// ===== 缓存指示（本复现项目自研缓存层） =====
const windCacheTime = ref('')
const forecastCacheTime = ref('')
const burstCacheTime = ref('')

// ===== 资讯 =====
const headlineNews = ref([])
const domesticNews = ref([])
const foreignNews = ref([])

async function fetchHeadlineNews() {
  try {
    const data = await api.getHeadlines()
    const list = (data?.头条新闻 || []).map((n) => ({
      id: n.ID,
      title: n.标题,
      content: n.摘要,
      publish_time: n.时间,
      url: n.链接,
      author: n.作者,
      tag: { positive: [], negative: [] },
    }))
    if (list.length) headlineNews.value = list
  } catch (e) {
    console.error('获取头条新闻失败:', e)
  }
}

async function fetchDomesticNews() {
  try {
    const data = await api.getNewsCn()
    const list = (data?.头条新闻 || []).map(mapNews)
    if (list.length) domesticNews.value = list
  } catch (e) {
    console.error('获取国内资讯失败:', e)
  }
}

async function fetchForeignNews() {
  try {
    const [hk, gb] = await Promise.allSettled([api.getNewsHk(), api.getNewsGb()])
    const merged = []
    for (const r of [hk, gb]) {
      if (r.status === 'fulfilled') merged.push(...(r.value?.头条新闻 || []).map(mapNews))
    }
    merged.sort((a, b) => new Date(b.publish_time) - new Date(a.publish_time))
    if (merged.length) foreignNews.value = merged.slice(0, 8)
  } catch (e) {
    console.error('获取外围资讯失败:', e)
  }
}

function mapNews(n) {
  return {
    id: n.ID,
    title: n.标题,
    content: n.摘要,
    publish_time: n.时间,
    url: n.链接,
    author: n.作者,
    tag: { positive: [], negative: [] },
  }
}

// ===== 新闻详情 =====
const newsDetailVisible = ref(false)
const newsDetail = ref(null)
const loadingNewsDetail = ref(false)
const lastNews = ref(null)

async function showNewsDetail(item) {
  lastNews.value = item
  newsDetailVisible.value = true
  loadingNewsDetail.value = true
  newsDetail.value = null
  try {
    const data = await api.getNewsFullText(item.id)
    newsDetail.value = {
      title: data?.标题 || item.title,
      summary: data?.摘要 || item.content || '',
      content: data?.正文 || data?.内容 || data?.摘要 || '',
      publish_time: data?.时间 || item.publish_time || '',
      url: data?.链接 || item.url || '',
      tag: data?.标签 ? { positive: data.标签 || [], negative: [] } : item.tag,
    }
  } catch (e) {
    newsDetail.value = {
      title: item.title,
      summary: item.content || '',
      content: item.content || '',
      publish_time: item.publish_time || '',
      url: item.url || '',
      tag: item.tag,
    }
  } finally {
    loadingNewsDetail.value = false
  }
}

function closeNewsDetail() {
  newsDetailVisible.value = false
  newsDetail.value = null
}

function navigateToTag(tag) {
  // 标签点击：跳转板块龙头页（若为 BK 代码）
  if (/^BK\d{4}$/i.test(String(tag).trim())) {
    router.push({ name: 'TagView', params: { tagCode: String(tag).trim().toUpperCase() } })
  } else {
    router.push({ name: 'search', query: { q: tag } })
  }
}

// ===== 风口龙头 =====
const hotSectors = ref([])
const loadingHotSectors = ref(false)
const hotSectorUpdateTime = ref('')
const hotSectorError = ref('')

async function fetchHotSectors(force = false) {
  loadingHotSectors.value = true
  hotSectorError.value = ''
  try {
    const data = await cachedFetch(
      'home_wind_leaders',
      () => api.getWindLeaders(8),
      {
        ttlMs: 60e3,
        force,
        onFresh: (d, fromCache) => {
          hotSectors.value = d?.hot_sectors || []
          hotSectorUpdateTime.value = d?.update_time || ''
          windCacheTime.value = fromCache ? dayjs().format('HH:mm') : ''
          if (!hotSectors.value.length) hotSectorError.value = '暂无风口龙头数据'
        },
      }
    )
    if (!hotSectors.value.length && data?.hot_sectors?.length) {
      hotSectors.value = data.hot_sectors
    }
  } catch (e) {
    hotSectorError.value = '获取风口龙头数据失败'
  } finally {
    loadingHotSectors.value = false
  }
}

// ===== 盈利预测更新榜 =====
const forecastRanking = ref([])
const loadingForecastRanking = ref(false)

function mapForecastList(list) {
  return (list || [])
    .slice(0, 30)
    .map((e) => {
      const yoy = parseFloat(e['净利润同比(%)'] ?? e.forecast_netprofit_yoy)
      return {
        updateTime: (e['更新时间'] || '').slice(0, 10) || '--',
        code: e['股票代码'] || e.symbol || '',
        name: e['股票简称'] || e.name || '--',
        yoy: Number.isFinite(yoy) ? yoy : null,
        yoyText: Number.isFinite(yoy) ? (yoy >= 0 ? '+' : '') + yoy.toFixed(2) + '%' : '--',
      }
    })
    .filter((e) => e.code)
}

async function fetchForecastRanking() {
  loadingForecastRanking.value = true
  try {
    await cachedFetch(
      'home_forecast_ranking',
      () => api.getProfitForecast({ page: 1, pageSize: 30, sortBy: 'update_time', sortOrder: 'desc' }),
      {
        ttlMs: 5 * 60e3,
        onFresh: (data, fromCache) => {
          forecastRanking.value = mapForecastList(data?.盈利预测列表)
          forecastCacheTime.value = fromCache ? dayjs().format('HH:mm') : ''
        },
      }
    )
  } catch (e) {
    console.error('获取盈利预测排行榜失败:', e)
  } finally {
    loadingForecastRanking.value = false
  }
}

// 盈利预测榜分页（每页 8 条）
const forecastPage = ref(1)
const FORECAST_PAGE_SIZE = 8
const pagedForecastRanking = computed(() =>
  forecastRanking.value.slice((forecastPage.value - 1) * FORECAST_PAGE_SIZE, forecastPage.value * FORECAST_PAGE_SIZE)
)

function onForecastPageChange(p) {
  forecastPage.value = p
}

watch(forecastRanking, () => {
  forecastPage.value = 1
})

// ===== 我的自选股 =====
const myFavoriteStocks = ref([])
const loadingFavorites = ref(false)
const displayedFavoriteStocks = computed(() => myFavoriteStocks.value.slice(0, 6))
const isLoggedIn = computed(() => userStore.isLoggedIn)

async function fetchMyFavoriteStocks() {
  if (!isLoggedIn.value) {
    myFavoriteStocks.value = []
    return
  }
  loadingFavorites.value = true
  try {
    const favs = userStore.favoriteStocks.length ? userStore.favoriteStocks : await api.getFavorites()
    const codes = favs.map((f) => f.code || f.stock_code).filter(Boolean)
    if (codes.length) {
      const data = await api.getStockQuotesCore(codes.join(','))
      const map = {}
      ;(data?.行情 || []).forEach((q) => {
        map[q.股票代码] = { price: q.最新价, change: q.涨跌幅 }
      })
      myFavoriteStocks.value = favs.map((f) => {
        const c = f.code || f.stock_code
        return {
          code: c,
          name: f.name || f.stock_name || c,
          industry: f.industry || '',
          price: map[c]?.price,
          change: map[c]?.change,
        }
      })
    } else {
      myFavoriteStocks.value = []
    }
  } catch (e) {
    console.error('获取自选股失败:', e)
  } finally {
    loadingFavorites.value = false
  }
}

async function handleToggleFavorite(stock) {
  try {
    if (userStore.isFavorite(stock.code)) {
      await userStore.removeFavorite(stock.code)
      ElMessage.success(`已将 ${stock.name} 从自选股中移除`)
    } else {
      await userStore.addFavorite({ code: stock.code, name: stock.name })
      ElMessage.success(`成功添加 ${stock.name} 到自选股`)
    }
    fetchMyFavoriteStocks()
  } catch (e) {
    ElMessage.error('操作失败，请稍后再试')
  }
}

function viewStockDetail(stock) {
  if (stock?.code) router.push(`/stock/${stock.code}`)
}

function goToFavoritesPage() {
  router.push('/favorites')
}

function goToForecastPage() {
  router.push('/forecast')
}

// ===== 定时刷新 =====
let timerHeadline = null
let timerDomestic = null
let timerForeign = null

onMounted(() => {
  fetchHeadlineNews()
  fetchDomesticNews()
  fetchForeignNews()
  fetchHotSectors()
  fetchForecastRanking()
  fetchMyFavoriteStocks()

  timerHeadline = setInterval(fetchHeadlineNews, 60000)
  timerDomestic = setInterval(fetchDomesticNews, 600000)
  timerForeign = setInterval(fetchForeignNews, 600000)
})

onBeforeUnmount(() => {
  clearInterval(timerHeadline)
  clearInterval(timerDomestic)
  clearInterval(timerForeign)
})

watch(isLoggedIn, (v) => {
  if (v) fetchMyFavoriteStocks()
})
</script>

<template>
  <div class="home-page">
    <div class="page-container">
      <div class="main-content">
        <div class="container">
          <!-- 市场资讯 -->
          <div class="market-news-section">
            <div class="headline-news-section">
              <h3 class="section-title">市场资讯</h3>
              <NewsSlider
                title="头条新闻"
                :news="headlineNews"
                headline-style
                @show-detail="showNewsDetail"
                @tag-click="navigateToTag"
              />
            </div>
            <div class="news-columns">
              <div class="news-column">
                <div class="news-card">
                  <NewsSlider title="国内资讯" :news="domesticNews" @show-detail="showNewsDetail" @tag-click="navigateToTag" />
                </div>
              </div>
              <div class="news-column">
                <div class="news-card">
                  <NewsSlider title="外围资讯" :news="foreignNews" @show-detail="showNewsDetail" @tag-click="navigateToTag" />
                </div>
              </div>
            </div>

            <!-- 新闻详情弹窗 -->
            <el-dialog
              v-model="newsDetailVisible"
              title="新闻详情"
              width="600px"
              :before-close="closeNewsDetail"
              class="news-detail-dialog"
              destroy-on-close
              align-center
            >
              <div v-if="loadingNewsDetail" class="loading-container">
                <el-skeleton :rows="5" animated />
              </div>
              <div v-else-if="newsDetail" class="news-detail-content">
                <h2 class="news-detail-title">{{ newsDetail.title }}</h2>
                <div v-if="newsDetail.tag && ((newsDetail.tag.positive || []).length || (newsDetail.tag.negative || []).length)" class="news-detail-tags">
                  <span
                    v-for="t in newsDetail.tag.positive"
                    :key="'pos-' + t"
                    class="news-tag positive"
                    @click="navigateToTag(t)"
                  >{{ t }}</span>
                  <span
                    v-for="t in newsDetail.tag.negative"
                    :key="'neg-' + t"
                    class="news-tag negative"
                    @click="navigateToTag(t)"
                  >{{ t }}</span>
                </div>
                <div v-if="newsDetail.summary" class="news-detail-summary">
                  <h4>内容摘要</h4>
                  <p>{{ newsDetail.summary }}</p>
                </div>
                <div class="news-detail-content-body">
                  <h4>正文内容</h4>
                  <div class="news-content" v-html="newsDetail.content"></div>
                </div>
              </div>
              <div v-else class="error-message">
                <p>加载新闻详情失败，请稍后重试</p>
                <el-button type="primary" size="small" @click="lastNews && showNewsDetail(lastNews)">重试</el-button>
              </div>
              <template #footer>
                <div class="news-detail-footer">
                  <span class="news-detail-time">发布时间：{{ newsDetail?.publish_time || '-' }}</span>
                  <el-divider direction="vertical" />
                  <a v-if="newsDetail?.url" :href="newsDetail.url" target="_blank" class="news-detail-link">
                    查看原文 <span class="external-link-icon">↗</span>
                  </a>
                </div>
              </template>
            </el-dialog>
          </div>

          <!-- 市场概览 -->
          <div class="market-overview-section">
            <h3 class="section-title">市场概览</h3>
            <MarketOverview />
          </div>

          <!-- 长线风口龙头 -->
          <WindLeaderPanel
            :sectors="hotSectors"
            :loading="loadingHotSectors"
            :error="hotSectorError"
            :update-time="hotSectorUpdateTime"
            :cache-time="windCacheTime"
            @retry="fetchHotSectors(true)"
          />

          <!-- 机构调研推荐热门股 -->
          <div class="hot-burst-section">
            <HotBurstPanel :display-limit="5" />
          </div>

          <!-- 我的自选股 + 盈利预测更新榜 -->
          <div class="hot-stocks-row">
            <div class="hot-stocks-section">
              <StockCardList
                title="我的自选股"
                :stocks="displayedFavoriteStocks"
                :loading="loadingFavorites"
                :show-view-more="myFavoriteStocks.length > 6"
                empty-text="暂无自选股数据"
                @view-detail="viewStockDetail"
                @toggle-favorite="handleToggleFavorite"
                @view-more="goToFavoritesPage"
              >
                <template #empty>
                  <div class="login-prompt">
                    <p v-if="isLoggedIn">您还没有添加自选股</p>
                    <p v-else>登录后可查看您的自选股</p>
                    <router-link v-if="!isLoggedIn" to="/login">
                      <el-button type="primary" size="small">去登录</el-button>
                    </router-link>
                    <router-link v-else to="/search">
                      <el-button type="primary" size="small">添加股票</el-button>
                    </router-link>
                  </div>
                </template>
                <template #view-more>
                  <router-link to="/favorites">
                    <el-button type="primary" plain>查看全部自选股</el-button>
                  </router-link>
                </template>
              </StockCardList>
            </div>
            <div class="forecast-ranking-section">
              <h3 class="section-title ranking-title" @click="goToForecastPage">
                盈利预测更新榜
                <el-tag v-if="forecastCacheTime" size="small" type="info" effect="plain">缓存 {{ forecastCacheTime }}</el-tag>
              </h3>
              <div class="forecast-ranking-card">
                <el-table
                  :data="pagedForecastRanking"
                  v-loading="loadingForecastRanking"
                  stripe
                  size="small"
                  empty-text="暂无排行榜数据"
                  class="forecast-ranking-table"
                  @row-click="(row) => viewStockDetail(row)"
                >
                  <el-table-column prop="updateTime" label="更新时间" align="center" show-overflow-tooltip />
                  <el-table-column label="股票简称(股票代码)" show-overflow-tooltip>
                    <template #default="{ row }">
                      <span class="ranking-stock-link" @click.stop="viewStockDetail(row)">
                        {{ row.name }}({{ row.code }})
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="净利润同比" align="center" show-overflow-tooltip>
                    <template #default="{ row }">
                      <span class="ranking-yoy" :class="row.yoy === null ? '' : row.yoy >= 0 ? 'up' : 'down'">{{ row.yoyText }}</span>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="forecast-pager">
                  <el-pagination
                    v-if="forecastRanking.length > FORECAST_PAGE_SIZE"
                    size="small"
                    background
                    layout="prev, pager, next"
                    :total="forecastRanking.length"
                    :page-size="FORECAST_PAGE_SIZE"
                    :current-page="forecastPage"
                    @current-change="onForecastPageChange"
                  />
                  <el-button v-else text size="small" @click="goToForecastPage">查看完整榜单 →</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page .market-news-section {
  margin-top: 20px;
  margin-bottom: 30px;
}

.home-page .market-news-section .headline-news-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.home-page .market-news-section .news-columns {
  display: flex;
  gap: 20px;
}

.home-page .market-news-section .news-columns .news-column {
  flex: 1;
}

.home-page .market-news-section .news-columns .news-column .news-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 15px;
  height: 100%;
}

.home-page .section-title {
  font-size: 1.4rem;
  margin-bottom: 20px;
  color: var(--text-primary);
  font-weight: 500;
}

.home-page .market-overview-section {
  margin-top: 20px;
  margin-bottom: 20px;
}

.home-page .market-overview-section .section-title {
  margin-bottom: 12px;
}

.home-page .hot-burst-section {
  margin-top: 20px;
  margin-bottom: 20px;
}

/* 新闻详情弹窗 */
:deep(.news-detail-dialog) {
  border-radius: 18px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18) !important;
  overflow: hidden;
}

:deep(.news-detail-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
  background: #f7f9fb;
}

:deep(.news-detail-dialog .el-dialog__body) {
  padding: 12px;
  background: #f7f9fb;
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.news-detail-dialog .el-dialog__footer) {
  border-top: 1px solid var(--border-color);
  background: #f7f9fb;
}

.news-detail-content {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.news-detail-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 18px;
  line-height: 1.35;
  text-align: center;
}

.news-detail-tags {
  margin-bottom: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.news-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
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

.news-detail-summary {
  background: #e6f7ff;
  border-left: 4px solid #409eff;
  padding: 15px 18px;
  margin-bottom: 20px;
  border-radius: 6px;
}

.news-detail-summary h4 {
  margin: 0 0 8px 0;
  color: #409eff;
  font-size: 1.05rem;
}

.news-detail-summary p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.news-detail-content-body h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 1rem;
}

.news-content {
  color: #606266;
  line-height: 1.8;
  font-size: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 8px 4px 8px 0;
}

.news-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.news-detail-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.news-detail-time {
  color: var(--text-tertiary);
  font-size: 0.95rem;
}

.news-detail-link {
  color: #409eff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.news-detail-link:hover {
  text-decoration: underline;
}

.loading-container {
  padding: 40px 0;
  background: #fff;
  border-radius: 12px;
}

.error-message {
  text-align: center;
  padding: 40px 0;
  color: var(--text-tertiary);
  background: #fff;
  border-radius: 12px;
}

.error-message p {
  margin-bottom: 15px;
}

/* 自选股 + 盈利榜 */
.hot-stocks-row {
  margin-top: 20px;
  display: flex;
  gap: 20px;
  align-items: stretch;
}

.hot-stocks-section {
  flex: 2;
  display: flex;
  flex-direction: column;
}

.login-prompt {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.login-prompt p {
  margin-bottom: 15px;
  color: var(--text-secondary);
}

.forecast-ranking-section {
  flex: 1;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.forecast-ranking-section .section-title {
  margin: 0 0 15px 0;
}

.ranking-title {
  font-size: 1.4rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--text-primary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.ranking-title:hover {
  color: var(--primary-color);
}

.forecast-ranking-card {
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: var(--shadow-card-lg);
  padding: 10px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.forecast-pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.forecast-pager .el-button + .el-button {
  margin-left: 0;
}

.forecast-ranking-table {
  width: 100%;
  flex: 1;
}

.forecast-ranking-table :deep(.el-table__row) {
  cursor: pointer;
}

.ranking-stock-link {
  color: var(--primary-color);
  font-weight: 500;
  cursor: pointer;
  display: block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-stock-link:hover {
  text-decoration: underline;
}

.ranking-yoy {
  font-weight: 600;
}

.ranking-yoy.up {
  color: #f56c6c;
}

.ranking-yoy.down {
  color: #67c23a;
}

@media (max-width: 992px) {
  .home-page .market-news-section .news-columns {
    flex-direction: column;
  }
  .hot-stocks-row {
    flex-direction: column;
  }
  .forecast-ranking-section {
    min-width: 0;
  }
}
</style>
