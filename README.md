# AI StockLink 复现版（股票资讯AI智能分析）

**保研推免面试作品 · 开发者：范广乐**

对 **www.aistocklink.cn**（实际站点 `gupiao.yaozhineng.com`，"股票资讯AI智能分析"）的高保真前端复现项目。在还原原站 20 个页面的基础上，额外实现了多项原站没有的自研增强特性。

- 技术栈：Vue 3 + Vue Router + Pinia + Element Plus + ECharts + Axios（与原站一致）
- 数据：通过本地反向代理接入原站公开 API（`gupiao-api.yaozhineng.com`），个别不稳定接口有本地降级
- 通过 jsdom 全页面冒烟测试（15 个关键页面、0 JS 错误），无需浏览器即可自动化验证

## ✨ 自研增强特性（原站没有的差异化竞争力）

| 特性 | 说明 |
|---|---|
| 🌙 **深色/浅色主题** | 全局主题切换（导航栏一键切换，localStorage 持久化），Element Plus 暗色变量 + 自研暗色覆盖，图表跟随主题 |
| ⚡ **本地缓存层** | 自研 CacheManager：API 响应缓存到 localStorage，命中缓存秒开（页面标注"缓存数据 HH:mm"），后台静默刷新，网络异常时自动回退过期缓存 |
| 📊 **Kronos AI 价格预测** | 接入原站 Kronos 时序大模型：K 线上叠加未来 5 日预测均值路径 + 置信区间带 + 方向概率（偏多/偏空），支持任务轮询与缓存复用 |
| 🔍 **个股对比** | 全新 `/compare` 页面（原站无）：最多 6 只股票指标对比表（优劣自动高亮）+ 60 日归一化走势对比图 + 一键导入自选股 |
| 📈 **K 线增强** | MA5/MA10/MA20 均线、成交量副图、缩放漫游、预测区间叠加；K 线接口不可用时使用**确定性模拟数据**（种子=股票代码，刷新可复现） |
| 🎠 **资讯轮播** | 头条/国内/外围资讯轮播（10 秒自动轮播、前后翻页、圆点、触屏滑动），与原站一致的新闻详情弹窗 |

## 页面清单

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | 首页 | 市场资讯轮播（头条/国内/外围+详情弹窗）、指数概览、**长线风口龙头**（风口概念气泡图+龙头股卡片+传导流图弹窗）、机构调研推荐热门股、我的自选股、盈利预测更新榜（分页） |
| `/search` | 股票搜索 | 按代码/简称/关键词搜索 |
| `/stock/:code` | 股票详情 | 行情、K线（均线+AI预测叠加）、AI 分析、个股新闻、资金流向、业绩预测、历史评价 |
| `/compare` | 个股对比（自研） | 指标对比表 + 归一化走势图 |
| `/forecast` | 业绩预测 | 机构盈利预测排行，分页 + 排序 + 搜索 |
| `/tenx` | 十倍股评分 | 评分查询 + 十倍股候选榜（内部滚动） |
| `/trend` | 趋势股评分 | 趋势评分排名（内部滚动）+ 维度评分详情 |
| `/trend/report` | 趋势股评分报告 | AI 生成评分报告 |
| `/hot-burst` | 机构调研推荐热门股 | 共振信号检测（行情/等级/关键词/得分/板块） |
| `/stock-intel` | 自选股情报 | 自选股行情 + 推送新闻 + 监控事件 |
| `/potential-push-history` | 长线风口龙头历史表现 | 战绩概览 + 推送记录（分页） |
| `/event` | 事件传导 | AI 事件列表（类型/重要度/传导链预览/无限加载） |
| `/event/:id` | AI事件分析 | 关键点/机会/风险/传导链/历史类似事件 |
| `/tags/:tagCode` | 板块龙头 | 周期筛选（短线/中线/长线）+ 主力净流入排名 |
| `/favorites` | 自选股 | 自选列表 + 推送新闻（需登录） |
| `/login` | 用户登录 | 短信登录 / 微信扫码 |
| `/profile` | 个人信息 | 推送设置 |
| `/wechat/:msgid` | 微信推送消息详情 | |
| `/update-logs` | 更新日志 | |
| `/download` | 下载 App | 功能介绍 |

## 快速开始

```bash
npm install --ignore-scripts   # 受限环境需忽略脚本；普通环境直接 npm install
npm run build:rollup           # 纯 Rollup 构建（输出到 dist/）
npm run serve                  # 启动 http://127.0.0.1:4173
```

浏览器打开 http://127.0.0.1:4173 即可。

> 普通开发环境也可用 Vite：`npm run dev`（vite.config.js 已配置 `/api`、`/kronos` 代理）。

## 冒烟测试（jsdom，无浏览器依赖）

```bash
set BUILD_FORMAT=cjs&& node build/build.mjs   # 构建 CJS 测试包到 dist-test/
node test/smoke-all.mjs                       # 首页专项 + 15 页逐页渲染 + JS 错误检查
node test/smoke-event.mjs                     # AI 事件详情页专项
```

## 目录结构

```
├── src/
│   ├── api/index.js          # 全部 API 封装（原站接口 + Kronos 预测接口 + agent 事件接口）
│   ├── components/           # 导航/页脚/NewsSlider 轮播/市场概览/风口龙头面板/
│   │                         # 机构热门股面板/自选股卡片/K线图(均线+预测)/Markdown/评分徽章
│   ├── router/index.js       # 21 个路由
│   ├── stores/               # user / theme Pinia store
│   ├── utils/cache.js        # 自研本地缓存层 CacheManager
│   ├── styles/main.css       # 全局样式 + 设计变量 + 深色主题覆盖
│   └── views/                # 21 个页面视图
├── build/                    # 纯 Rollup 构建（自研 vue-sfc 编译插件）
├── serve.mjs                 # 静态服务器 + /api 与 /kronos 反向代理 + mock 兜底
├── research/                 # 逆向分析产物（原站 bundle/组件结构/CSS 参考）
└── test/                     # jsdom 冒烟测试
```

## 复现方法论

1. 抓取原站入口 HTML 与 JS bundle，解析 webpack chunk 映射，下载全部页面懒加载 chunk
2. 从编译产物中还原：路由表、组件树（首页 8 个子组件）、API 契约（40+ 端点）、CSS 设计令牌
3. 用 @vue/compiler-sfc 自研 SFC 编译插件 + 纯 Rollup 构建（规避受限环境的子进程限制）
4. jsdom 挂载真实 bundle 逐页渲染断言，接入真实数据源验证

## 说明

- 登录、自选股等用户态功能依赖原站 Cookie 认证，未登录时以本地缓存/空态呈现；
- 原站个别接口不稳定（K 线、半年报、板块龙头 Tushare 数据源），页面内有降级处理；
- 复现仅供学习交流，数据版权归原站所有。
