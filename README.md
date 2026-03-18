# 全球金融财经作战图

**Repository:** [https://github.com/channb1026/world-finacne](https://github.com/channb1026/world-finacne)

作战室风格仪表盘：一屏展示关键汇率、热点新闻、全球股市与中国 A 股；中央为全球地图与闪烁亮点，点击亮点可下钻该地区政经要闻。底部为时间轴（UTC/北京时）、真实经济日历及**数据刷新说明**（行情约 3 秒、新闻/快讯/日历约 45 秒）。**支持中英文界面切换**：底部栏提供「中文 / English」切换，选择后界面文案、面板标题、数据项名称（股指/大宗/利率/地区等）及新闻来源名均随语言切换；语言偏好会保存到本地，也支持用 `?locale=zh` 或 `?locale=en` 直接覆盖界面语言，便于演示和截图。

| 中文界面 | 英文界面 |
|----------|----------|
| ![中文界面](screenshot.png) | ![英文界面](screenshot-en.png) |

## 运行方式

**前端（必选）**

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 **http://localhost:5173/**（若 5173 被占用，终端会提示实际端口，以终端为准），建议宽屏使用。

**若页面仍是旧版**：请按终端里显示的 Local 地址打开，或用无痕窗口 / **Cmd+Shift+R** 强制刷新。页面底部有「行情 3s · 新闻/快讯/日历 45s」或 "Market 3s · News/Feed/Calendar 45s" 即表示已加载最新界面。切换语言请点击底部「中文」或「English」。

**后端（必选，所有数据来自真实接口，无 mock）**

```bash
cd backend
npm install
npm run dev
```

后端提供新闻（RSS 聚合）、汇率/股市/大宗/利率（Yahoo Finance v3）等接口。开发时前端通过 Vite 代理将 `/api` 转发到 `http://localhost:3000`，**请先启动后端**再访问前端，否则各面板会显示「加载失败」。

- **Node 版本**：项目现在统一要求 **Node 22+**。根目录已提供 `.nvmrc`，若使用 `nvm` 可直接执行 `nvm use`；`yahoo-finance2 v3` 在 Node 22 下更稳定，避免 Node 18/20 下的环境警告与潜在兼容性问题。
- **Yahoo 不可用时**：汇率会自动改用 Frankfurter 备用源；股市/大宗/关键指标若请求失败会显示「暂无数据」，可点「重试」。
- **部分 RSS 超时/403**：属正常（网络或源限制），能连上的源会照常展示。
- **来源名与语言**：新闻/快讯的来源名与分类标签会随界面语言显示；标题保持原文，不接入翻译。除底部切换外，也可通过 URL 参数 `?locale=zh` / `?locale=en` 强制指定语言。
- **一键启停**：根目录 `./start.sh` 启动前后端（nohup），`./stop.sh` 停止；详见脚本内注释。
- **安全相关环境变量**：后端默认只允许 `localhost:5173/4173` 跨域访问。若需自定义来源，可设置 `ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com` 后再启动；基础限流可通过 `RATE_LIMIT_MAX` 与 `RATE_LIMIT_WINDOW_MS` 调整，默认 60 秒内每 IP 120 次请求。

## 项目结构

```
world_finance/
├── frontend/
│   └── src/
│       ├── components/   # 汇率/新闻/股市/地图/地区抽屉/底部条等
│       ├── views/        # WarRoomView 作战图主视图
│       ├── services/     # API 封装（仅请求后端，无 mock）
│       ├── stores/       # timezoneStore（UTC/北京时切换）
│       ├── i18n/         # LocaleContext、translations、displayNames（中英文）
│       └── data/         # 类型定义与地图默认几何
├── backend/
│   └── src/
│       ├── routes/       # /api/news, /api/rates, /api/map-spots, /api/ticker 等
│       ├── services/     # newsService（RSS）、marketService（Yahoo）
│       ├── data/         # 数据层（委托 services）
│       └── index.js
├── start.sh / stop.sh    # 一键启停前后端（nohup）
└── README.md
```

## 当前实现

- **中英文切换**：底部栏「中文 / English」切换；面板标题、按钮、数据项名称、新闻来源、分类标签及时间格式随语言切换，偏好持久化到本地，也支持 `?locale=zh|en` 覆盖。
- **左侧**：关键汇率（7 对）+ **大宗商品**（WTI/布伦特/黄金/白银）+ 热点财经新闻流。热点财经支持按分类筛选，例如宏观、央行/利率、汇率/债券、股市/盘面、大宗商品等。
- **中央**：**关键数据条**（美元指数、VIX、WTI、黄金、在岸人民币等）+ 全球地图（**区域预设**：全球/美洲/欧洲/亚太/中国/中东/非洲，**视角 URL 同步**：`?lat=&lng=&zoom=` 可分享当前视角）+ 国家亮点，点击亮点进入地区情报抽屉；地区新闻同样会展示来源、分类与标签。
- **右侧**：全球股市指数 + **中国 A 股**（主要指数与 A 股资讯）。A 股资讯同样支持按分类筛选，例如 A 股盘面、A 股公司、中国宏观等。
- **底部条**：当前时间（UTC / 北京时）、**数据刷新**说明、**语言切换**（中文 / English）、即将到来的真实经济事件、**复制视角链接**（当 URL 带地图参数时可一键复制分享）；**快讯**跑马灯每条可点击在新标签打开原文。
- **数据刷新逻辑**：行情每 **3 秒** 轮询，新闻/快讯/日历每 **45 秒** 轮询；轮询已做超时、取消和防重入处理，页面隐藏时会暂停。
- **后端**：新闻多源 RSS 聚合 + 行情/利率/商品 Yahoo Finance 主源 + Frankfurter 汇率备用 + Trading Economics / EODHD 经济日历双源。

## 技术栈

- 前端：React 19 + TypeScript + Vite 5，Leaflet 地图，深色作战室主题；**无 mock，全部请求后端 API**
- 后端：Node + Express，rss-parser（新闻）、yahoo-finance2（行情），CORS

## 资讯说明

本产品资讯分为四块，数据来源与定位如下。

1. **地图**  
   聚合 Google News、MSN、Yahoo News、BBC、Reuters、WSJ、CNN、联合早报、纽约时报等国际门户的资讯，按**国家**切分展示，保证覆盖全球主要国家；点击地图上的国家亮点可查看「与该国相关」的新闻。

2. **快讯**  
   从上述各大门户提炼 **breaking news**，在页面底部以跑马灯形式滚动，便于第一时间了解全球重大事件与突发事件。

3. **热点财经**  
   覆盖上述国际门户中与**政治、经济、金融**相关的热点新闻与头条，按**时间**排序，支持在页面快速把握全球政经热点。

4. **A 股资讯**  
   仅从**中国国内**证券、金融、经济类门户获取数据，内容聚焦国内财经与证券。当前接入：新浪财经、中国新闻网、财新网、证券之星、每日经济新闻、凤凰财经、网易财经，以及通过 Google News 定向聚合补充的东方财富、财联社、同花顺财经、第一财经。热点财经不展示上述国内来源，避免与 A 股重复。

---

## 数据来源（技术）

- **新闻 / 快讯 / 地图**：RSS 聚合（Google News、Yahoo、BBC、Reuters、Guardian、CNBC、NPR、MarketWatch、Financial Times、Fortune、The Economist、Investing.com、AP Business、新浪财经、中国新闻网、财新网等），按 feed 与国家映射；快讯返回 title + link 支持点击打开
- **汇率 / 股市 / 大宗 / 关键指标 / 利率·波动率**：Yahoo Finance 实时行情；汇率在 Yahoo 失败时自动回退到 Frankfurter。
- **地图亮点数量**：由各地区新闻条数实时汇总；地区覆盖 **60+ 国家/地区**（台湾、香港、澳门、美国、加拿大、日韩俄、印度泰国、东欧西欧多国、中东多国、南美各国等），各地通过 Google News 按地名搜索或独立 RSS 拉取。
- **经济日历**：接入 Trading Economics 官方经济日历接口，失败时回退到 EODHD Economic Events；默认使用 `TRADING_ECONOMICS_API_KEY=guest:guest` 与 `EODHD_API_TOKEN=demo` 获取真实事件流，生产环境可替换为正式凭证。底部展示未来 7 天内、按时间临近排序的关键事件，并附 actual / forecast / previous。
- **源状态监控**：后端提供内部接口 `/api/source-health`，可查看 Yahoo Finance、Frankfurter、Trading Economics、EODHD 以及各 RSS 源的最近成功/失败状态，便于做 monitor 与告警；前端调试面板默认关闭，如需内部查看可设置 `VITE_SHOW_SOURCE_HEALTH=true`。
- **A 股资讯**：见下方「A 股资讯多源」说明。
- **资讯增强**：新闻聚合已加入源质量分层、重复事件去重、近似标题聚类以及规则分类（宏观、央行/利率、通胀/就业、汇率/债券、A 股盘面等），用于提升 monitor 的阅读效率。

### A 股资讯多源说明（解决仅显示中国新闻网的问题）

- **现状**：后端为 A 股资讯配置了多路 RSS 与定向聚合源（新浪财经、中国新闻网、财新网、证券之星、每日经济新闻、凤凰财经、网易财经、东方财富、财联社、同花顺财经、第一财经）。在**海外或未配置代理**的环境下，多数国内站会对非浏览器请求 403/超时，因此常只有**中国新闻网**等少数来源稳定返回；中国新闻网对海外访问相对友好。
- **建议**：  
  - **在海外部署**：在运行后端的机器上配置 `HTTPS_PROXY`（或 `HTTP_PROXY`）指向可访问国内网站的代理，然后重启后端，可显著提高多源命中率。  
  - **在国内部署**：多数源可直接连通，若个别源仍超时，属站点限流或 RSS 地址变更，可查看后端日志确认失败源。
- **可选扩展**：若需更多源（如东方财富、同花顺、财联社等），可自建 [RSSHub](https://github.com/DIYgod/RSSHub) 等聚合服务，将生成的 RSS 地址通过环境变量或配置加入后端的 A 股源列表（需自行改 `newsService.js` 中 `RSS_FEEDS` 与 `A_SHARE_ALLOWED_SOURCES`）。

## 后续可做

- 告警体系：把内部源状态监控继续演进成真正的告警规则、失败统计和恢复提示。
- 地图增强：可扩展更多信息图层、时间过滤和更细粒度的区域情报聚合。
- 资讯能力：继续扩新闻源、做更细主题标签与事件合并，提高同类事件的压缩率和检索效率。
