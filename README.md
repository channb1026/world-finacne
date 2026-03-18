# 全球金融财经作战图

**Repository:** [https://github.com/channb1026/world-finacne](https://github.com/channb1026/world-finacne)

一个面向宏观、跨市场和区域情报观察的单屏 monitor。界面以“作战室”方式组织信息：

- 左侧看关键汇率、大宗商品和热点财经
- 中央看关键指标、全球地图和区域情报
- 右侧看全球股市与中国 A 股
- 底部看时间、快讯和真实经济日历

当前版本已经不再依赖 mock 数据，核心面板全部走后端真实数据接口，并具备多源聚合、fallback、基础安全收口、轮询防堆积、资讯去重分类与中英文切换能力。

| 中文界面 | 英文界面 |
|----------|----------|
| ![中文界面](screenshot.png) | ![英文界面](screenshot-en.png) |

## 项目定位

这个项目不是通用门户首页，而是一个偏 monitor 的信息面板，目标是让用户在一屏里快速回答这些问题：

- 全球主要风险资产和避险资产现在怎么走
- 哪些宏观和地缘事件正在影响市场
- 哪个国家或地区正在出现新的政经热点
- 中国 A 股当前的盘面和资讯重点是什么
- 未来几天有哪些值得盯的真实经济事件

因此实现上优先追求：

- 真数据，而不是占位内容
- 多源聚合，而不是单一来源
- 阅读效率，而不是堆砌内容
- 低干扰主界面，同时保留内部可观测性

## 当前能力

### 界面与交互

- 支持中文 / English 双语切换
- 支持 `?locale=zh` / `?locale=en` 直接覆盖界面语言，便于演示、截图和分享
- 地图支持区域预设切换
- 地图视角会同步到 URL：`?lat=&lng=&zoom=`
- 当 URL 带地图参数时，底部支持一键复制当前视角链接
- 页面隐藏时会暂停轮询，减少无意义请求

### 数据面板

- **关键汇率**：展示对人民币的主要汇率对
- **大宗商品**：展示 WTI、布伦特、黄金、白银等主要品种
- **关键指标条**：展示美元指数、VIX、WTI、黄金、在岸人民币、10Y 美债等
- **全球股市**：展示全球主要股指
- **中国 A 股**：展示主要指数与 A 股资讯
- **地区情报**：点击地图亮点可查看对应国家/地区资讯
- **快讯**：底部滚动展示更高时效性的 breaking news
- **经济日历**：底部展示未来窗口内的真实经济事件，带 actual / forecast / previous

### 资讯增强

- 热点财经支持按分类筛选
- A 股资讯支持按分类筛选
- 地区资讯会展示来源、分类和标签
- 资讯来源不是简单平铺，而是按用途和质量分层使用
- 聚合层已加入：
  - 源质量分层
  - 精确去重
  - 近似标题聚类
  - 规则分类

当前分类覆盖宏观、央行/利率、通胀/就业、汇率/债券、股市/盘面、大宗商品、公司/财报、地缘/政策、中国宏观、A 股盘面、A 股公司等主题。

## 数据来源

### 行情与指标

- **主源**：Yahoo Finance
- **汇率备用源**：Frankfurter

覆盖内容包括：

- 汇率
- 全球股指
- A 股主要指数
- 大宗商品
- 关键指标
- 利率 / 波动率面板

当 Yahoo 汇率不可用时，会自动回退到 Frankfurter；其余行情项若上游失败，则保持已有缓存或返回空态。

### 经济日历

- **主源**：Trading Economics Calendar API
- **备用源**：EODHD Economic Events

后端会对日历事件做：

- 真实接口拉取
- 双源 fallback
- 45 秒缓存
- 字段归一化
- 按时间临近排序

默认可使用：

- `TRADING_ECONOMICS_API_KEY=guest:guest`
- `EODHD_API_TOKEN=demo`

生产环境建议替换为正式凭证。

### 新闻与区域情报

新闻系统不是单一 RSS，而是按用途拆分的多源聚合。就接入方式来说，当前大致分为两类：

- **直接源**
  - 直接使用公开 RSS 或官方可访问 feed
  - 例如 Reuters、BBC、WSJ、Yahoo News、Yahoo Finance、CNBC、新浪财经、中国新闻网等

- **定向聚合源**
  - 通过 Google News 站点定向搜索等方式补足覆盖面
  - 例如 MarketWatch、Financial Times、Fortune、The Economist、Investing.com、AP Business，以及中文侧的东方财富、财联社、同花顺财经、第一财经

README 中提到某个媒体时，默认表示“内容已进入系统可用来源池”，不一定意味着是该站官方直连 RSS。

在输出层，系统还会按照“权威性、时效性、盘面贴近度、去重后信息密度”等因素做排序分层，因此不同模块看到的来源优先级并不相同。

- **地图 / 地区情报**
  - 按国家/地区聚合国际新闻与财经媒体内容
  - 主要覆盖 Google News、Yahoo News、Reuters、BBC、WSJ、CNN、NYT、Guardian 等国际源
  - 部分地区也会结合定向搜索或独立 feed 扩充覆盖
  - 地图更强调“地区覆盖面”，不是单纯追求财经媒体权重最高

- **快讯**
  - 从国际新闻与财经源中提炼更高时效性的 breaking news
  - 用于底部滚动显示突发事件和市场驱动因子
  - 排序上优先更强时效和更高公信力的来源，如 Reuters、WSJ、BBC、AP Business、Yahoo News、Google News 等

- **热点财经**
  - 聚合国际政治、经济、金融类新闻
  - 当前已覆盖 Reuters、WSJ、Yahoo Finance、CNBC、Financial Times、MarketWatch、Fortune、The Economist、Investing.com、AP Business、BBC、Guardian、NPR 等
  - 其中 Reuters、WSJ、Yahoo Finance、CNBC、Financial Times、MarketWatch 等会被放在更高优先级
  - 结果会经过质量加权、去重、聚类和分类增强，不是简单的时间流

- **A 股资讯**
  - 以国内财经、证券、经济媒体为主
  - 直接源包括新浪财经、中国新闻网、财新网、证券之星、每日经济新闻、凤凰财经、网易财经
  - 定向聚合补充源包括东方财富、财联社、同花顺财经、第一财经
  - 排序时会优先更贴近盘面和交易信息的来源，因此财联社、东方财富、同花顺财经、第一财经等通常优先于传统门户展示
  - 这意味着这些来源的内容是真实进入系统的，但接入方式可能是聚合链路，而不一定是官方 RSS/API 直连

### 内部可观测性

后端提供内部接口：

- `/api/source-health`

可查看 Yahoo Finance、Frankfurter、Trading Economics、EODHD 以及各 RSS 源的最近成功/失败状态。这个能力默认不对终端用户暴露，前端调试面板默认隐藏，只有设置 `VITE_SHOW_SOURCE_HEALTH=true` 时才会显示。

## 架构概览

### 前端

- React 19
- TypeScript
- Vite 5
- Leaflet / React Leaflet

前端通过统一的数据层轮询后端 API，而不是每个组件各自独立请求。当前已实现：

- market / news / source health 切片拆分
- 轮询超时
- `AbortController` 取消
- 防重入与防请求堆积
- 页面不可见时暂停轮询

### 后端

- Node
- Express
- rss-parser
- yahoo-finance2

后端职责包括：

- 行情和新闻接口聚合
- 缓存与后台预刷新
- 多源 fallback
- 新闻去重、聚类、分类
- CORS allowlist
- 基础限流
- 源状态跟踪

## 运行方式

### 环境要求

- Node 22+

仓库根目录已提供 `.nvmrc`。如果使用 `nvm`，可以在根目录执行：

```bash
nvm use
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

默认地址通常是：

- [http://localhost:5173/](http://localhost:5173/)

### 后端

```bash
cd backend
npm install
npm run dev
```

默认地址通常是：

- [http://localhost:3000/](http://localhost:3000/)

开发模式下，前端通过 Vite 代理将 `/api` 转发到后端，所以应先启动后端，再打开前端页面。

### 一键启停

根目录提供：

- `./start.sh`
- `./stop.sh`

用于后台启动和停止前后端服务。

## 常用环境变量

### 安全

- `ALLOWED_ORIGINS`
  - 逗号分隔的 CORS 白名单
- `RATE_LIMIT_MAX`
  - 限流窗口内每 IP 最大请求数
- `RATE_LIMIT_WINDOW_MS`
  - 限流窗口时长

### 经济日历

- `TRADING_ECONOMICS_API_KEY`
- `EODHD_API_TOKEN`

### 调试

- `VITE_SHOW_SOURCE_HEALTH=true`
  - 显示前端内部源状态面板

## 项目结构

```text
world_finance/
├── frontend/
│   └── src/
│       ├── components/   # 各面板、地图、底部条、地区抽屉等
│       ├── views/        # WarRoomView 主界面
│       ├── services/     # 前端 API 封装
│       ├── state/        # 共享数据层与轮询逻辑
│       ├── stores/       # timezoneStore 等本地状态
│       ├── i18n/         # 语言上下文、翻译与显示名映射
│       └── data/         # 类型定义与地图默认几何
├── backend/
│   └── src/
│       ├── routes/       # /api/news, /api/rates, /api/calendar 等
│       ├── services/     # newsService, marketService, newsClassifier
│       ├── data/         # 数据层，对 services 的轻封装
│       ├── security.js   # CORS 与限流
│       ├── sourceStatus.js
│       └── index.js
├── screenshot.png
├── screenshot-en.png
├── start.sh
├── stop.sh
└── README.md
```

## 已知边界

- 部分 RSS 源可能因为 403、超时、TLS 或地区网络差异而暂时不可达
- 海外环境下，部分中文财经源的稳定性通常弱于国际源
- A 股资讯虽然已经多源接入，但仍会受到上游可达性影响
- 经济日历默认凭证适合开发体验，不适合作为生产级 SLA 保证
- 内部源状态监控默认隐藏，不会直接展示给终端用户

这些都不会让系统整体失效，但会影响某些板块的覆盖率或更新质量。

## 测试与验证

常用检查命令：

```bash
cd frontend && npm run lint
cd frontend && npm test
cd frontend && npm run build
cd backend && npm test
```

## 后续方向

- 更强的告警体系：失败阈值、恢复提示、时间窗口统计
- 更细的主题标签与事件合并
- 更多稳定新闻源与更清晰的质量分层
- 更丰富的地图信息图层与时间过滤
