/**
 * 新闻服务：从各大门户 RSS 拉取真实资讯，无 mock。
 * 热点财经 = 财经类精选；地图按 feed 来源映射地区。
 * 来源名用 SOURCE_ZH 展示中文；标题保持原文，不接入翻译。
 * 若出现 TLS 断开/超时，可配置 HTTPS_PROXY 或在内网部署代理后重试。
 */

import https from 'https'
import Parser from 'rss-parser'
import {
  registerSource,
  markSourceSuccess,
  markSourceFailure,
} from '../sourceStatus.js'
import { classifyNewsItem } from './newsClassifier.js'

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

// 地图按国家/地区划分：台湾、香港、澳门、美加、日韩俄、印度泰国、东欧西欧、中东、南美等
const REGIONS = [
  'US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'EC', 'VE', 'UY', 'PY', 'BO',
  'UK', 'IE', 'FR', 'DE', 'NL', 'BE', 'AT', 'CH', 'IT', 'ES', 'PT', 'SE', 'NO', 'DK', 'FI', 'IS',
  'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'GR', 'HR', 'RS', 'UA', 'RU',
  'TR', 'AE', 'SA', 'QA', 'KW', 'IL', 'JO', 'EG',
  'CN', 'TW', 'HK', 'MO', 'JP', 'KR', 'IN', 'TH', 'VN', 'SG', 'MY', 'ID', 'PH', 'AU', 'NZ', 'ZA',
]

/** 地区情报用：各国/地区「与该地相关」的搜索词（Google News search） */
const REGION_SEARCH_QUERY = {
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina', CL: 'Chile', CO: 'Colombia', PE: 'Peru', EC: 'Ecuador', VE: 'Venezuela', UY: 'Uruguay', PY: 'Paraguay', BO: 'Bolivia',
  UK: 'United Kingdom', IE: 'Ireland', FR: 'France', DE: 'Germany', NL: 'Netherlands', BE: 'Belgium', AT: 'Austria', CH: 'Switzerland', IT: 'Italy', ES: 'Spain', PT: 'Portugal', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', IS: 'Iceland',
  PL: 'Poland', CZ: 'Czech Republic', SK: 'Slovakia', HU: 'Hungary', RO: 'Romania', BG: 'Bulgaria', GR: 'Greece', HR: 'Croatia', RS: 'Serbia', UA: 'Ukraine', RU: 'Russia',
  TR: 'Turkey', AE: 'UAE', SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', IL: 'Israel', JO: 'Jordan', EG: 'Egypt',
  CN: 'China', TW: 'Taiwan', HK: 'Hong Kong', MO: 'Macau', JP: 'Japan', KR: 'South Korea', IN: 'India', TH: 'Thailand', VN: 'Vietnam', SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia', PH: 'Philippines', AU: 'Australia', NZ: 'New Zealand', ZA: 'South Africa',
}

const GOOGLE_NEWS_SEARCH_BASE = 'https://news.google.com/rss/search?q='
const GOOGLE_NEWS_SEARCH_SUFFIX = '+when:7d&hl=en-US&gl=US&ceid=US:en'
const GOOGLE_NEWS_SEARCH_SUFFIX_ZH = '+when:7d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans'

const GLOBAL_FINANCE_SITE_FEEDS = [
  { site: 'marketwatch.com', source: 'MarketWatch (Aggregated)', region: 'US', query: 'markets OR economy OR federal reserve' },
  { site: 'ft.com', source: 'Financial Times (Aggregated)', region: 'UK', query: 'markets OR economy OR central bank' },
  { site: 'fortune.com', source: 'Fortune (Aggregated)', region: 'US', query: 'finance OR markets OR economy' },
  { site: 'economist.com', source: 'The Economist (Aggregated)', region: 'UK', query: 'finance OR markets OR economy' },
  { site: 'investing.com', source: 'Investing.com (Aggregated)', region: 'US', query: 'markets OR forex OR commodities' },
  { site: 'apnews.com', source: 'AP Business (Aggregated)', region: 'US', query: 'business OR economy OR inflation' },
]

const CN_MARKET_SITE_FEEDS = [
  { site: 'eastmoney.com', source: '东方财富(聚合)', query: 'A股 OR 沪深 OR 券商 OR 市场' },
  { site: 'cls.cn', source: '财联社(聚合)', query: 'A股 OR 上市公司 OR 盘面 OR 市场' },
  { site: '10jqka.com.cn', source: '同花顺财经(聚合)', query: 'A股 OR 沪深 OR 资金 OR 板块' },
  { site: 'yicai.com', source: '第一财经(聚合)', query: 'A股 OR 宏观 OR 金融市场' },
]

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
  // === 扩展国际财经源：通过 Google News 定向站点搜索补足热点财经覆盖 ===
  ...GLOBAL_FINANCE_SITE_FEEDS.map((feed) => ({
    url: GOOGLE_NEWS_SEARCH_BASE + encodeURIComponent(`${feed.query} site:${feed.site}`) + GOOGLE_NEWS_SEARCH_SUFFIX,
    source: feed.source,
    region: feed.region,
  })),
  // === 新加坡 联合早报（官网无公开 RSS，使用聚合源）===
  { url: 'https://feedx.site/rss/zaobao.xml', source: '联合早报', region: 'SG', breaking: true },
  // === 中国（仅国内证券/财经/经济门户，专供 A 股资讯 + 地图 CN；热点财经不展示此类来源避免重复）===
  // 海外或未配置代理时，多数国内源可能 403/超时，中国新闻网通常最稳定；配置 HTTPS_PROXY 可提高多源命中率
  { url: 'https://news.google.com/rss?hl=zh-CN&gl=CN&ceid=CN:zh-Hans', source: 'Google 新闻', region: 'CN', breaking: true },
  { url: 'https://rss.sina.com.cn/roll/finance/hot_roll.xml', source: '新浪财经', region: 'CN' },
  { url: 'https://rss.sina.com.cn/roll/stock/hot_roll.xml', source: '新浪财经', region: 'CN' },
  { url: 'https://www.chinanews.com.cn/rss/finance.xml', source: '中国新闻网', region: 'CN' },
  { url: 'https://www.chinanews.com.cn/rss/stock.xml', source: '中国新闻网', region: 'CN' },
  { url: 'https://feedx.net/rss/caixin.xml', source: '财新网', region: 'CN' },
  { url: 'https://news.stockstar.com/rss/xml.aspx?file=xml%2Ffocus%2F3393.xml', source: '证券之星', region: 'CN' },
  { url: 'https://www.nbd.com.cn/rss/toutiao/articles/1483884.html', source: '每日经济新闻', region: 'CN' },
  // 凤凰网财经、网易财经：增加 A 股资讯多样性；海外或受限时可能不可达
  { url: 'https://finance.ifeng.com/rss/stock.xml', source: '凤凰财经', region: 'CN' },
  { url: 'https://finance.ifeng.com/rss/finance.xml', source: '凤凰财经', region: 'CN' },
  { url: 'https://money.163.com/special/00252EQ2/moneyrss.xml', source: '网易财经', region: 'CN' },
  // === 扩展 A 股高频中文源：通过 Google News 定向站点搜索补足个股/盘面/宏观覆盖 ===
  ...CN_MARKET_SITE_FEEDS.map((feed) => ({
    url: GOOGLE_NEWS_SEARCH_BASE + encodeURIComponent(`${feed.query} site:${feed.site}`) + GOOGLE_NEWS_SEARCH_SUFFIX_ZH,
    source: feed.source,
    region: 'CN',
  })),
  // === 地区情报：各国「与该国相关」的新闻（Google News 按国家名搜索）；US/UK/CN/SG 已有多源，其余国家加搜索 ===
  ...REGIONS.filter((r) => !['US', 'UK', 'CN', 'SG'].includes(r) && REGION_SEARCH_QUERY[r]).map((region) => ({
    url: GOOGLE_NEWS_SEARCH_BASE + encodeURIComponent(REGION_SEARCH_QUERY[region]) + GOOGLE_NEWS_SEARCH_SUFFIX,
    source: 'Google News',
    region,
    breaking: true,
  })),
]

RSS_FEEDS.forEach((feed) => {
  registerSource(`news:${feed.url}`, {
    name: `${feed.source}${feed.region ? ` (${feed.region})` : ''}`,
    category: 'news',
    meta: {
      source: feed.source,
      region: feed.region,
      breaking: Boolean(feed.breaking),
      url: feed.url,
    },
  })
})

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
  'MarketWatch (Aggregated)': 'MarketWatch',
  'Financial Times (Aggregated)': '金融时报',
  'Fortune (Aggregated)': '财富',
  'The Economist (Aggregated)': '经济学人',
  'Investing.com (Aggregated)': 'Investing.com',
  'AP Business (Aggregated)': '美联社财经',
  '联合早报': '联合早报',
  'Google 新闻': '谷歌新闻',
  '新浪财经': '新浪财经',
  '中国新闻网': '中国新闻网',
  '财新网': '财新网',
  '证券之星': '证券之星',
  '每日经济新闻': '每日经济新闻',
  '东方财富(聚合)': '东方财富',
  '财联社(聚合)': '财联社',
  '同花顺财经(聚合)': '同花顺财经',
  '第一财经(聚合)': '第一财经',
}

/** 国内证券/财经/经济门户（仅用于 A 股资讯）；热点财经不展示这些来源，避免与 A 股资讯重复 */
const DOMESTIC_SOURCES = ['Google 新闻', '新浪财经', '中国新闻网', '财新网', '证券之星', '每日经济新闻', '凤凰财经', '网易财经', '东方财富(聚合)', '财联社(聚合)', '同花顺财经(聚合)', '第一财经(聚合)']
const HOT_SOURCE_PRIORITY = [
  'Reuters',
  'WSJ',
  'Yahoo Finance',
  'CNBC',
  'Financial Times (Aggregated)',
  'MarketWatch (Aggregated)',
  'BBC',
  'Guardian',
  'AP Business (Aggregated)',
  'Yahoo News',
  'NYT',
  'Google News',
  'NPR Business',
  'NPR',
  'Fortune (Aggregated)',
  'The Economist (Aggregated)',
  'Investing.com (Aggregated)',
  'CNN',
  'MSNBC',
  '联合早报',
]
const BREAKING_SOURCE_PRIORITY = [
  'Reuters',
  'WSJ',
  'BBC',
  'AP Business (Aggregated)',
  'Yahoo News',
  'Google News',
  'NYT',
  'Guardian',
  'NPR',
  'CNN',
  'MSNBC',
  '联合早报',
]
const A_SHARE_SOURCE_PRIORITY = [
  '财联社(聚合)',
  '东方财富(聚合)',
  '同花顺财经(聚合)',
  '第一财经(聚合)',
  '新浪财经',
  '财新网',
  '中国新闻网',
  '证券之星',
  '每日经济新闻',
  '凤凰财经',
  '网易财经',
]

function sortSourcesByPriority(names, priorityList) {
  const priority = new Map(priorityList.map((name, index) => [name, index]))
  return [...names].sort((a, b) => {
    const aRank = priority.has(a) ? priority.get(a) : Number.MAX_SAFE_INTEGER
    const bRank = priority.has(b) ? priority.get(b) : Number.MAX_SAFE_INTEGER
    if (aRank !== bRank) return aRank - bRank
    return a.localeCompare(b)
  })
}

let cache = { all: [], hot: [], breaking: [], byRegion: {}, updatedAt: 0 }
const CACHE_MS = 30 * 1000 // 30 秒
/** 单飞控制：缓存过期时多个接口并发请求只触发一次全量 RSS 抓取 */
let refreshPromise = null
const REGION_ITEMS_MAX = 30 // 地区情报最多返回条数
let failedSourcesLogged = new Set()

/** 按源熔断：每个 feed 的 url 独立计数，连续失败 N 次后暂停请求，COOLDOWN_MS 后再试 */
const CIRCUIT_FAILURE_THRESHOLD = 3
const CIRCUIT_COOLDOWN_MS = 5 * 60 * 1000 // 5 分钟
const circuitByUrl = new Map() // url -> { failures, lastAttempt }

function isCircuitOpen(url) {
  const state = circuitByUrl.get(url)
  if (!state) return false
  if (state.failures < CIRCUIT_FAILURE_THRESHOLD) return false
  if (Date.now() - state.lastAttempt >= CIRCUIT_COOLDOWN_MS) return false // 过了冷却期，可重试
  return true
}

function recordCircuitFailure(url) {
  const state = circuitByUrl.get(url) || { failures: 0, lastAttempt: 0 }
  state.failures = state.failures + 1
  state.lastAttempt = Date.now()
  circuitByUrl.set(url, state)
}

function recordCircuitSuccess(url) {
  circuitByUrl.set(url, { failures: 0, lastAttempt: Date.now() })
}

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

function normalizeHeadline(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/\s+-\s+(reuters|cnn|bbc|wsj|nyt|cnbc|yahoo|guardian|ap|marketwatch).*$/i, '')
    .replace(/[|｜丨]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function headlineTokens(title) {
  return normalizeHeadline(title)
    .split(' ')
    .filter((token) => token.length >= 2)
}

function headlineSignature(title) {
  const tokens = headlineTokens(title)
  return tokens.slice(0, 12).join(' ')
}

function jaccardSimilarity(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0
  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  let intersection = 0
  for (const token of setA) {
    if (setB.has(token)) intersection += 1
  }
  const union = new Set([...setA, ...setB]).size
  return union > 0 ? intersection / union : 0
}

function shareHeadlinePrefix(tokensA, tokensB, prefixLength = 4) {
  if (tokensA.length < prefixLength || tokensB.length < prefixLength) return false
  for (let i = 0; i < prefixLength; i++) {
    if (tokensA[i] !== tokensB[i]) return false
  }
  return true
}

function areLikelySameStory(candidate, existing) {
  const candidateLink = candidate.link ? candidate.link.replace(/[?#].*$/, '') : ''
  const existingLink = existing.link ? existing.link.replace(/[?#].*$/, '') : ''
  if (candidateLink && existingLink && candidateLink === existingLink) return true

  const candidateTokens = headlineTokens(candidate.title)
  const existingTokens = headlineTokens(existing.title)
  if (candidateTokens.length === 0 || existingTokens.length === 0) return false

  const similarity = jaccardSimilarity(candidateTokens, existingTokens)
  if (similarity >= 0.72) return true
  if (shareHeadlinePrefix(candidateTokens, existingTokens) && similarity >= 0.5) return true

  const timeDelta = Math.abs((candidate.pubDateMs || 0) - (existing.pubDateMs || 0))
  if (timeDelta <= 3 * 60 * 60 * 1000 && similarity >= 0.45) return true

  return false
}

function dedupeItems(items, { limit }) {
  const unique = []

  for (const item of items) {
    const signature = headlineSignature(item.title)
    if (!signature && !item.link && !item.title) continue
    if (unique.some((existing) => areLikelySameStory(item, existing))) continue
    unique.push(item)
    if (unique.length >= limit) break
  }

  return unique
}

function dedupeBucket(list) {
  const unique = []
  for (const item of list) {
    const signature = headlineSignature(item.title)
    if (!signature && !item.link && !item.title) continue
    if (unique.some((existing) => areLikelySameStory(item, existing))) continue
    unique.push(item)
  }
  return unique
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
    ).filter(Boolean).map(classifyNewsItem)
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
      if (isCircuitOpen(f.url)) {
        return { items: [], source: f.source, failed: false }
      }
      const { items, source, failed, err } = await fetchFeed(f, id)
      if (failed) {
        failedSources.push(source)
        recordCircuitFailure(f.url)
        markSourceFailure(`news:${f.url}`, err ?? 'fetch failed')
      } else {
        recordCircuitSuccess(f.url)
        markSourceSuccess(`news:${f.url}`, {
          meta: { items: items.length },
        })
      }
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
    bySource[name] = dedupeBucket(bySource[name])
  })
  const allNamesForHot = sortSourcesByPriority(
    Object.keys(bySource).filter((n) => (bySource[n] || []).length > 0 && !DOMESTIC_SOURCES.includes(n)),
    HOT_SOURCE_PRIORITY
  )
  const hotCandidates = []
  for (let round = 0; hotCandidates.length < HOT_TARGET * 3; round++) {
    let added = 0
    for (const name of allNamesForHot) {
      const list = bySource[name] || []
      if (list[round]) {
        hotCandidates.push(list[round])
        added++
        if (hotCandidates.length >= HOT_TARGET * 3) break
      }
    }
    if (added === 0) break
  }
  const hot = dedupeItems(hotCandidates, { limit: HOT_TARGET })

  // 快讯用：全球突发要闻（仅 breaking 源，按源轮询，与行业无关）
  const BREAKING_TARGET = 18
  const breakingSourceNames = sortSourcesByPriority(
    Object.keys(breakingItemsBySource).filter((n) => (breakingItemsBySource[n] || []).length > 0),
    BREAKING_SOURCE_PRIORITY
  )
  const breakingCandidates = []
  for (let round = 0; breakingCandidates.length < BREAKING_TARGET * 3; round++) {
    let added = 0
    for (const name of breakingSourceNames) {
      const list = breakingItemsBySource[name] || []
      if (list[round]) {
        breakingCandidates.push(list[round])
        added++
        if (breakingCandidates.length >= BREAKING_TARGET * 3) break
      }
    }
    if (added === 0) break
  }
  const breaking = dedupeItems(breakingCandidates, { limit: BREAKING_TARGET })

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

/** 确保缓存有效：过期时单飞刷新，并发请求共享同一 refreshPromise。
 * 刷新过程中如遇异常，保留旧缓存并记录日志，避免直接把错误抛给调用方。
 */
async function ensureCache() {
  if (Date.now() - cache.updatedAt <= CACHE_MS) return
  if (refreshPromise) {
    try {
      await refreshPromise
    } catch (err) {
      console.warn('[news] ensureCache shared refresh failed:', err?.message || err)
    }
    return
  }
  refreshPromise = (async () => {
    try {
      await refreshCache()
    } catch (err) {
      console.warn('[news] ensureCache refresh failed:', err?.message || err)
    } finally {
      refreshPromise = null
    }
  })()
  try {
    await refreshPromise
  } catch {
    // 已在上层统一记录日志，这里静默，调用方继续使用旧缓存
  }
}

/** 后台定时预刷新：每 CACHE_MS 主动刷新缓存，请求只读内存 */
export function startNewsBackgroundRefresh() {
  ensureCache().catch(() => {})
  setInterval(() => ensureCache().catch(() => {}), CACHE_MS)
}

/** 热点财经：返回原文来源，由前端按界面语言展示中文/英文 */
export async function getHotNews() {
  await ensureCache()
  return cache.hot.map((item) => ({ ...item }))
}

/** 地区情报：返回与该国相关的资讯；来源由前端按界面语言展示 */
export async function getNewsByRegion(region) {
  if (!REGIONS.includes(region)) return []
  await ensureCache()
  const raw = (cache.byRegion[region] || []).slice(0, REGION_ITEMS_MAX)
  return raw.map((item) => ({ ...item }))
}

export async function getAllNewsForMap() {
  await ensureCache()
  return cache.all
}

export function getRegionCounts() {
  const counts = {}
  REGIONS.forEach((r) => { counts[r] = (cache.byRegion[r] || []).length })
  return counts
}

const SPOT_NAMES = {
  US: '美国', CA: '加拿大', MX: '墨西哥', BR: '巴西', AR: '阿根廷', CL: '智利', CO: '哥伦比亚', PE: '秘鲁', EC: '厄瓜多尔', VE: '委内瑞拉', UY: '乌拉圭', PY: '巴拉圭', BO: '玻利维亚',
  UK: '英国', IE: '爱尔兰', FR: '法国', DE: '德国', NL: '荷兰', BE: '比利时', AT: '奥地利', CH: '瑞士', IT: '意大利', ES: '西班牙', PT: '葡萄牙', SE: '瑞典', NO: '挪威', DK: '丹麦', FI: '芬兰', IS: '冰岛',
  PL: '波兰', CZ: '捷克', SK: '斯洛伐克', HU: '匈牙利', RO: '罗马尼亚', BG: '保加利亚', GR: '希腊', HR: '克罗地亚', RS: '塞尔维亚', UA: '乌克兰', RU: '俄罗斯',
  TR: '土耳其', AE: '阿联酋', SA: '沙特', QA: '卡塔尔', KW: '科威特', IL: '以色列', JO: '约旦', EG: '埃及',
  CN: '中国', TW: '台湾', HK: '香港', MO: '澳门', JP: '日本', KR: '韩国', IN: '印度', TH: '泰国', VN: '越南', SG: '新加坡', MY: '马来西亚', ID: '印尼', PH: '菲律宾', AU: '澳大利亚', NZ: '新西兰', ZA: '南非',
}
const SPOT_COORDS = {
  US: [40.7, -74], CA: [43.65, -79.38], MX: [19.43, -99.13], BR: [-23.55, -46.63], AR: [-34.6, -58.38], CL: [-33.45, -70.67], CO: [4.71, -74.07], PE: [-12.05, -77.05], EC: [-0.22, -78.51], VE: [10.48, -66.9], UY: [-34.9, -56.16], PY: [-25.3, -57.58], BO: [-16.5, -68.15],
  UK: [51.5, -0.1], IE: [53.35, -6.26], FR: [48.86, 2.35], DE: [52.52, 13.4], NL: [52.37, 4.89], BE: [50.85, 4.35], AT: [48.21, 16.37], CH: [46.95, 7.45], IT: [41.9, 12.5], ES: [40.42, -3.7], PT: [38.72, -9.13], SE: [59.33, 18.07], NO: [59.91, 10.75], DK: [55.68, 12.57], FI: [60.17, 24.94], IS: [64.15, -21.95],
  PL: [52.23, 21.01], CZ: [50.08, 14.43], SK: [48.15, 17.11], HU: [47.5, 19.08], RO: [44.43, 26.1], BG: [42.7, 23.32], GR: [37.98, 23.73], HR: [45.81, 15.98], RS: [44.82, 20.46], UA: [50.45, 30.52], RU: [55.75, 37.62],
  TR: [39.93, 32.85], AE: [25.2, 55.3], SA: [24.71, 46.68], QA: [25.29, 51.53], KW: [29.38, 47.99], IL: [32.09, 34.78], JO: [31.95, 35.93], EG: [30.04, 31.24],
  CN: [31.2, 121.5], TW: [25.03, 121.56], HK: [22.28, 114.16], MO: [22.2, 113.55], JP: [35.7, 139.7], KR: [37.57, 126.98], IN: [19.08, 72.88], TH: [13.75, 100.5], VN: [21.03, 105.85], SG: [1.35, 103.8], MY: [3.14, 101.69], ID: [-6.2, 106.82], PH: [14.6, 120.98], AU: [-33.87, 151.21], NZ: [-36.85, 174.76], ZA: [-33.92, 18.42],
}

export async function getMapSpots() {
  await ensureCache()
  const counts = getRegionCounts()
  return REGIONS.map((id) => ({
    id,
    name: SPOT_NAMES[id] || id,
    lat: SPOT_COORDS[id][0],
    lng: SPOT_COORDS[id][1],
    count: counts[id] || 0,
  }))
}

/** A 股资讯：仅展示国内证券/财经/经济门户。新浪/财新/证券之星/每日经济新闻等源可能因网络或反爬不可达，中国新闻网通常最稳定；可配置 HTTPS_PROXY 后重启尝试。凤凰财经、网易财经为补充源。 */
const A_SHARE_ALLOWED_SOURCES = ['新浪财经', '中国新闻网', '财新网', '证券之星', '每日经济新闻', '凤凰财经', '网易财经', '东方财富(聚合)', '财联社(聚合)', '同花顺财经(聚合)', '第一财经(聚合)']

export async function getAShareNews() {
  await ensureCache()
  const cnRaw = cache.byRegion.CN || []
  const cn = cnRaw.filter((item) => A_SHARE_ALLOWED_SOURCES.includes(item.source))
  if (cn.length === 0) {
    return [{ id: '0', title: '暂无国内资讯。请检查网络或配置 HTTPS_PROXY 后重启后端（详见 README「A 股资讯多源」）。', source: '系统', time: '—' }]
  }
  const bySource = {}
  cn.forEach((item) => {
    if (!bySource[item.source]) bySource[item.source] = []
    bySource[item.source].push(item)
  })
  const allNames = sortSourcesByPriority(
    Object.keys(bySource).filter((n) => (bySource[n] || []).length > 0),
    A_SHARE_SOURCE_PRIORITY
  )
  const aShareCandidates = []
  const A_SHARE_TARGET = 15
  for (let round = 0; aShareCandidates.length < A_SHARE_TARGET * 3; round++) {
    let added = 0
    for (const name of allNames) {
      const list = bySource[name] || []
      if (list[round]) {
        aShareCandidates.push(list[round])
        added++
        if (aShareCandidates.length >= A_SHARE_TARGET * 3) break
      }
    }
    if (added === 0) break
  }
  const aShare = dedupeItems(aShareCandidates, { limit: A_SHARE_TARGET })
  const toItem = (n) => ({
    id: n.id,
    title: n.title,
    source: n.source,
    time: n.time,
    link: n.link,
    category: n.category,
    tags: n.tags,
    marketScope: n.marketScope,
  })
  return aShare.map(toItem)
}

/** 快讯：全球突发要闻（仅综合/国际源），供底部单行滚动；返回 title + link 以支持点击打开 */
export async function getTickerTitles() {
  await ensureCache()
  return (cache.breaking || []).slice(0, 18).map((n) => ({ title: n.title, link: n.link || '' }))
}
