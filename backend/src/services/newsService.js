/**
 * 新闻服务：从各大门户 RSS 拉取真实资讯，无 mock。
 * 热点财经 = 财经类精选；地图按 feed 来源映射地区。
 * 来源名用 SOURCE_ZH 展示中文；标题保持原文，不接入翻译。
 * 若出现 TLS 断开/超时，可配置 HTTPS_PROXY 或在内网部署代理后重试。
 */

import https from 'https'
import Parser from 'rss-parser'

// 统一 HTTPS Agent：延长超时、保持连接，缓解 TLS 握手被中断或慢速网络
const httpsAgent = new https.Agent({
  keepAlive: true,
  timeout: 28000,
})

// 国内站点常屏蔽默认 User-Agent；requestOptions 传入 agent 以减轻 TLS 断开
const parser = new Parser({
  timeout: 25000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  requestOptions: { agent: httpsAgent },
})

// 地图按国家划分：点击显示「与该国相关」的资讯（Google News 按国家名搜索），非「该国可读」的资讯
const REGIONS = [
  'US', 'UK', 'CN', 'CA', 'DE', 'FR', 'IT', 'ES', 'NL', 'RU',
  'JP', 'KR', 'IN', 'AU', 'BR', 'MX', 'AE', 'SA', 'TR', 'PL', 'SG', 'ID', 'TH', 'VN',
]

/** 地区情报用：各国「与该国相关」的搜索词（Google News search），地图点数与侧栏内容均据此 */
const REGION_SEARCH_QUERY = {
  US: 'United States', UK: 'United Kingdom', CN: 'China', CA: 'Canada', DE: 'Germany', FR: 'France', IT: 'Italy', ES: 'Spain', NL: 'Netherlands', RU: 'Russia',
  JP: 'Japan', KR: 'South Korea', IN: 'India', AU: 'Australia', BR: 'Brazil', MX: 'Mexico', AE: 'UAE', SA: 'Saudi Arabia', TR: 'Turkey', PL: 'Poland',
  SG: 'Singapore', ID: 'Indonesia', TH: 'Thailand', VN: 'Vietnam',
}

const GOOGLE_NEWS_SEARCH_BASE = 'https://news.google.com/rss/search?q='
const GOOGLE_NEWS_SEARCH_SUFFIX = '+when:7d&hl=en-US&gl=US&ceid=US:en'

/**
 * RSS 源：地图聚合国际门户按国家切分；快讯 = 各门户 breaking；热点财经 = 政经金融头条按时间排序；A 股仅用国内证券财经源。
 * 国际门户：Google News, MSNBC, Yahoo News, BBC, Reuters, WSJ, CNN, 联合早报, NYT 等。
 */
const RSS_FEEDS = [
  // === 美国（多源，供快讯 + 热点财经 + 地图 US）===
  { url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', source: 'Google News', region: 'US', breaking: true },
  { url: 'https://news.yahoo.com/rss', source: 'Yahoo News', region: 'US', breaking: true },
  { url: 'https://finance.yahoo.com/news/rssindex', source: 'Yahoo Finance', region: 'US' },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC', region: 'US' },
  { url: 'https://feeds.npr.org/1001/rss.xml', source: 'NPR', region: 'US', breaking: true },
  { url: 'https://feeds.npr.org/1006/rss.xml', source: 'NPR Business', region: 'US' },
  { url: 'http://rss.cnn.com/rss/cnn_topstories.rss', source: 'CNN', region: 'US', breaking: true },
  { url: 'http://rss.cnn.com/rss/cnn_world.rss', source: 'CNN', region: 'US' },
  { url: 'http://rss.cnn.com/rss/money_news_international.rss', source: 'CNN', region: 'US' },
  { url: 'https://feeds.content.dowjones.io/public/rss/RSSWorldNews', source: 'WSJ', region: 'US', breaking: true },
  { url: 'https://feeds.content.dowjones.io/public/rss/RSSMarketsMain', source: 'WSJ', region: 'US' },
  { url: 'https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness', source: 'WSJ', region: 'US' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', source: 'NYT', region: 'US', breaking: true },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NYT', region: 'US' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', source: 'NYT', region: 'US' },
  { url: 'http://on.msnbc.com/rss', source: 'MSNBC', region: 'US', breaking: true },
  // === 英国 ===
  { url: 'https://news.google.com/rss?hl=en-GB&gl=GB&ceid=GB:en', source: 'Google News', region: 'UK', breaking: true },
  { url: 'https://www.theguardian.com/world/rss', source: 'Guardian', region: 'UK', breaking: true },
  { url: 'https://www.theguardian.com/business/rss', source: 'Guardian', region: 'UK' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC', region: 'UK', breaking: true },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC', region: 'UK' },
  { url: 'https://feeds.bbci.co.uk/news/business/economy/rss.xml', source: 'BBC', region: 'UK' },
  // === Reuters（全球，供快讯+热点）===
  { url: 'https://www.reutersagency.com/feed/', source: 'Reuters', region: 'US', breaking: true },
  // === 新加坡 联合早报（官网无公开 RSS，使用聚合源）===
  { url: 'https://feedx.site/rss/zaobao.xml', source: '联合早报', region: 'SG', breaking: true },
  // === 中国（仅国内证券/财经/经济门户，专供 A 股资讯 + 地图 CN；热点财经不展示此类来源避免重复）===
  { url: 'https://news.google.com/rss?hl=zh-CN&gl=CN&ceid=CN:zh-Hans', source: 'Google 新闻', region: 'CN', breaking: true },
  { url: 'https://rss.sina.com.cn/roll/finance/hot_roll.xml', source: '新浪财经', region: 'CN' },
  { url: 'https://rss.sina.com.cn/roll/stock/hot_roll.xml', source: '新浪财经', region: 'CN' },
  { url: 'https://www.chinanews.com.cn/rss/finance.xml', source: '中国新闻网', region: 'CN' },
  { url: 'https://www.chinanews.com.cn/rss/stock.xml', source: '中国新闻网', region: 'CN' },
  { url: 'https://feedx.net/rss/caixin.xml', source: '财新网', region: 'CN' },
  { url: 'https://news.stockstar.com/rss/xml.aspx?file=xml%2Ffocus%2F3393.xml', source: '证券之星', region: 'CN' },
  { url: 'http://www.nbd.com.cn/rss/toutiao/articles/1483884.html', source: '每日经济新闻', region: 'CN' },
  // === 地区情报：各国「与该国相关」的新闻（Google News 按国家名搜索）；US/UK/CN/SG 已有多源，其余国家加搜索 ===
  ...REGIONS.filter((r) => !['US', 'UK', 'CN', 'SG'].includes(r) && REGION_SEARCH_QUERY[r]).map((region) => ({
    url: GOOGLE_NEWS_SEARCH_BASE + encodeURIComponent(REGION_SEARCH_QUERY[region]) + GOOGLE_NEWS_SEARCH_SUFFIX,
    source: 'Google News',
    region,
    breaking: true,
  })),
]

/** 来源名称简体中文展示（适应国内用户） */
const SOURCE_ZH = {
  'Google News': '谷歌新闻',
  'Yahoo News': '雅虎新闻',
  'Yahoo Finance': '雅虎财经',
  'Guardian': '卫报',
  'CNBC': 'CNBC',
  'NPR': '美国国家公共电台',
  'NPR Business': 'NPR 财经',
  'CNN': 'CNN',
  'WSJ': '华尔街日报',
  'NYT': '纽约时报',
  'MSNBC': 'MSNBC',
  'BBC': 'BBC',
  'Reuters': '路透社',
  '联合早报': '联合早报',
  'Google 新闻': '谷歌新闻',
  '新浪财经': '新浪财经',
  '中国新闻网': '中国新闻网',
  '财新网': '财新网',
  '证券之星': '证券之星',
  '每日经济新闻': '每日经济新闻',
}

/** 国内证券/财经/经济门户（仅用于 A 股资讯）；热点财经不展示这些来源，避免与 A 股资讯重复 */
const DOMESTIC_SOURCES = ['Google 新闻', '新浪财经', '中国新闻网', '财新网', '证券之星', '每日经济新闻']

let cache = { all: [], hot: [], breaking: [], byRegion: {}, updatedAt: 0 }
const CACHE_MS = 30 * 1000 // 30 秒
const REGION_ITEMS_MAX = 30 // 地区情报最多返回条数
let failedSourcesLogged = new Set()

function formatTime(pubDate) {
  if (!pubDate) return ''
  try {
    const d = new Date(pubDate)
    const now = new Date()
    const diff = (now - d) / 60000
    if (diff < 60) return `${Math.floor(diff)} 分钟前`
    if (diff < 1440) return `${Math.floor(diff / 60)} 小时前`
    return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function normalizeItem(entry, source, region, id, baseUrl) {
  const title = (entry.title || '').trim()
  if (!title) return null
  const pubDateMs = entry.pubDate ? new Date(entry.pubDate).getTime() : 0
  let link = entry.link || (entry.links && entry.links[0] && (typeof entry.links[0] === 'string' ? entry.links[0] : entry.links[0].href)) || ''
  if (link && typeof link === 'string') {
    link = link.trim()
    if (link && baseUrl && !link.startsWith('http')) {
      try {
        link = new URL(link, baseUrl).href
      } catch {
        link = ''
      }
    }
  } else {
    link = ''
  }
  return {
    id: String(id),
    title,
    source,
    time: formatTime(entry.pubDate) || '—',
    region,
    link,
    pubDateMs: Number.isNaN(pubDateMs) ? 0 : pubDateMs,
  }
}

async function fetchFeed(feedConfig, idStart) {
  try {
    const feed = await parser.parseURL(feedConfig.url)
    let baseUrl
    try {
      baseUrl = new URL(feedConfig.url).origin
    } catch {
      baseUrl = feedConfig.url
    }
    const items = (feed.items || []).slice(0, 25).map((entry, i) =>
      normalizeItem(entry, feedConfig.source, feedConfig.region, idStart + i, baseUrl)
    ).filter(Boolean)
    return { items, source: feedConfig.source, failed: false }
  } catch (err) {
    return { items: [], source: feedConfig.source, failed: true, err: err.message }
  }
}

async function refreshCache() {
  let id = 1
  const all = []
  const byRegion = {}
  const failedSources = []
  REGIONS.forEach((r) => { byRegion[r] = [] })

  const breakingItemsBySource = {}
  await Promise.all(
    RSS_FEEDS.map(async (f) => {
      const { items, source, failed } = await fetchFeed(f, id)
      if (failed) failedSources.push(source)
      items.forEach((item) => {
        item.id = String(id++)
        all.push(item)
        if (item.region && byRegion[item.region]) byRegion[item.region].push(item)
        if (f.breaking) {
          if (!breakingItemsBySource[source]) breakingItemsBySource[source] = []
          breakingItemsBySource[source].push(item)
        }
      })
    })
  )

  if (failedSources.length) {
    const unique = [...new Set(failedSources)]
    const newFailed = unique.filter((s) => !failedSourcesLogged.has(s))
    if (newFailed.length > 0) {
      newFailed.forEach((s) => failedSourcesLogged.add(s))
      console.warn(`[news] 不可达 (${newFailed.length} 个源):`, newFailed.join(', '))
    }
  }

  // 全量与分地区均按发布时间新→旧排序
  all.sort((a, b) => (b.pubDateMs - a.pubDateMs))
  Object.keys(byRegion).forEach((r) => {
    byRegion[r].sort((a, b) => (b.pubDateMs - a.pubDateMs))
    byRegion[r] = byRegion[r].slice(0, 80)
  })

  // 热点财经：按来源轮询取条，保证多门户均衡；每条按发布时间新→旧排序
  const HOT_TARGET = 20
  const bySource = {}
  all.forEach((item) => {
    if (!bySource[item.source]) bySource[item.source] = []
    bySource[item.source].push(item)
  })
  Object.keys(bySource).forEach((name) => {
    bySource[name].sort((a, b) => (b.pubDateMs - a.pubDateMs))
  })
  const sourceNames = ['Google News', 'Yahoo News', 'Yahoo Finance', 'Guardian', 'CNBC', 'NPR', 'NPR Business', 'CNN', 'WSJ', 'NYT', 'MSNBC', 'BBC', 'Reuters', '联合早报']
  const restNames = Object.keys(bySource).filter((n) => !sourceNames.includes(n))
  const allNamesForHot = [...sourceNames, ...restNames].filter((n) => (bySource[n] || []).length > 0 && !DOMESTIC_SOURCES.includes(n))
  const hot = []
  for (let round = 0; hot.length < HOT_TARGET; round++) {
    let added = 0
    for (const name of allNamesForHot) {
      const list = bySource[name] || []
      if (list[round]) {
        hot.push(list[round])
        added++
        if (hot.length >= HOT_TARGET) break
      }
    }
    if (added === 0) break
  }
  hot.sort((a, b) => (b.pubDateMs - a.pubDateMs))

  // 快讯用：全球突发要闻（仅 breaking 源，按源轮询，与行业无关）
  const BREAKING_TARGET = 18
  const breakingSourceNames = Object.keys(breakingItemsBySource).filter((n) => (breakingItemsBySource[n] || []).length > 0)
  const breaking = []
  for (let round = 0; breaking.length < BREAKING_TARGET; round++) {
    let added = 0
    for (const name of breakingSourceNames) {
      const list = breakingItemsBySource[name] || []
      if (list[round]) {
        breaking.push(list[round])
        added++
        if (breaking.length >= BREAKING_TARGET) break
      }
    }
    if (added === 0) break
  }

  cache = {
    all: all.slice(0, 300),
    hot: hot.slice(0, HOT_TARGET),
    breaking: breaking.slice(0, BREAKING_TARGET),
    byRegion,
    updatedAt: Date.now(),
  }
  const cnCount = (byRegion.CN || []).length
  if (cnCount > 0) {
    console.log(`[news] cache refreshed: CN=${cnCount} total=${all.length}`)
  } else {
    console.warn('[news] cache refreshed but CN=0。若多为 TLS 断开/超时，可尝试：配置环境变量 HTTPS_PROXY 后重启，或在内网可访问外网的机器上运行后端。')
  }
}

export async function getHotNews() {
  if (Date.now() - cache.updatedAt > CACHE_MS) await refreshCache()
  return cache.hot.map((item) => ({
    ...item,
    source: SOURCE_ZH[item.source] ?? item.source,
  }))
}

/** 地区情报：返回与该国相关的资讯；为求打开速度不做标题翻译，直接返回原文（来源仍用 SOURCE_ZH） */
export async function getNewsByRegion(region) {
  if (!REGIONS.includes(region)) return []
  if (Date.now() - cache.updatedAt > CACHE_MS) await refreshCache()
  const raw = (cache.byRegion[region] || []).slice(0, REGION_ITEMS_MAX)
  return raw.map((item) => ({
    ...item,
    source: SOURCE_ZH[item.source] ?? item.source,
  }))
}

export async function getAllNewsForMap() {
  if (Date.now() - cache.updatedAt > CACHE_MS) await refreshCache()
  return cache.all
}

export function getRegionCounts() {
  const counts = {}
  REGIONS.forEach((r) => { counts[r] = (cache.byRegion[r] || []).length })
  return counts
}

const SPOT_NAMES = {
  US: '美国', UK: '英国', CN: '中国', CA: '加拿大', DE: '德国', FR: '法国', IT: '意大利', ES: '西班牙', NL: '荷兰', RU: '俄罗斯',
  JP: '日本', KR: '韩国', IN: '印度', AU: '澳大利亚', BR: '巴西', MX: '墨西哥', AE: '阿联酋', SA: '沙特', TR: '土耳其', PL: '波兰',
  SG: '新加坡', ID: '印尼', TH: '泰国', VN: '越南',
}
const SPOT_COORDS = {
  US: [40.7, -74], UK: [51.5, -0.1], CN: [31.2, 121.5], CA: [43.65, -79.38], DE: [52.52, 13.4], FR: [48.86, 2.35], IT: [41.9, 12.5], ES: [40.42, -3.7], NL: [52.37, 4.89], RU: [55.75, 37.62],
  JP: [35.7, 139.7], KR: [37.57, 126.98], IN: [19.08, 72.88], AU: [-33.87, 151.21], BR: [-23.55, -46.63], MX: [19.43, -99.13], AE: [25.2, 55.3], SA: [24.71, 46.68], TR: [39.93, 32.85], PL: [52.23, 21.01],
  SG: [1.35, 103.8], ID: [-6.2, 106.82], TH: [13.75, 100.5], VN: [21.03, 105.85],
}

export async function getMapSpots() {
  if (Date.now() - cache.updatedAt > CACHE_MS) await refreshCache()
  const counts = getRegionCounts()
  return REGIONS.map((id) => ({
    id,
    name: SPOT_NAMES[id] || id,
    lat: SPOT_COORDS[id][0],
    lng: SPOT_COORDS[id][1],
    count: counts[id] || 0,
  }))
}

/** A 股资讯：仅展示国内证券/财经/经济门户（与 DOMESTIC_SOURCES 一致；证券时报/上海证券报/中证网/和讯/东方财富/证监会/中金/新华网/中国财经等暂无稳定公开 RSS，有再补） */
const A_SHARE_ALLOWED_SOURCES = ['新浪财经', '中国新闻网', '财新网', '证券之星', '每日经济新闻']
const A_SHARE_SOURCE_ORDER = ['新浪财经', '中国新闻网', '财新网', '证券之星', '每日经济新闻']

export async function getAShareNews() {
  if (Date.now() - cache.updatedAt > CACHE_MS) await refreshCache()
  const cnRaw = cache.byRegion.CN || []
  const cn = cnRaw.filter((item) => A_SHARE_ALLOWED_SOURCES.includes(item.source))
  if (cn.length === 0) {
    return [{ id: '0', title: '暂无国内资讯。新浪财经、中国新闻网、财新网、证券之星、每日经济新闻等源当前不可达，请检查网络或配置 HTTPS_PROXY 后重启后端。', source: '系统', time: '—' }]
  }
  const bySource = {}
  cn.forEach((item) => {
    if (!bySource[item.source]) bySource[item.source] = []
    bySource[item.source].push(item)
  })
  const sourceNames = [...A_SHARE_SOURCE_ORDER]
  const restNames = Object.keys(bySource).filter((n) => !sourceNames.includes(n))
  const allNames = [...sourceNames, ...restNames].filter((n) => (bySource[n] || []).length > 0)
  const aShare = []
  const A_SHARE_TARGET = 15
  for (let round = 0; aShare.length < A_SHARE_TARGET; round++) {
    let added = 0
    for (const name of allNames) {
      const list = bySource[name] || []
      if (list[round]) {
        aShare.push(list[round])
        added++
        if (aShare.length >= A_SHARE_TARGET) break
      }
    }
    if (added === 0) break
  }
  aShare.sort((a, b) => (b.pubDateMs - a.pubDateMs))
  const toItem = (n) => ({
    id: n.id,
    title: n.title,
    source: SOURCE_ZH[n.source] ?? n.source,
    time: n.time,
    link: n.link,
  })
  return aShare.slice(0, A_SHARE_TARGET).map(toItem)
}

/** 快讯：全球突发要闻（仅综合/国际源），供底部单行滚动；返回 title + link 以支持点击打开 */
export async function getTickerTitles() {
  if (Date.now() - cache.updatedAt > CACHE_MS) await refreshCache()
  return (cache.breaking || []).slice(0, 18).map((n) => ({ title: n.title, link: n.link || '' }))
}
