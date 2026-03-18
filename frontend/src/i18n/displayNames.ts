/**
 * 数据项显示名与单位：按当前语言返回中文或英文。
 * 后端返回的 name/unit 为中文，英文由前端映射。
 */

import type { Locale } from './translations'

/** 关键指标：API 只返回 name，按中文名映射英文 */
const KEY_METRIC_NAME_EN: Record<string, string> = {
  '美元指数': 'Dollar Index',
  'VIX': 'VIX',
  'WTI原油': 'WTI Crude',
  '黄金': 'Gold',
  '在岸人民币': 'CNY Onshore',
  '布伦特': 'Brent',
  '10Y美债': '10Y Treasury',
}

/** 全球股指：按 symbol 映射英文名（上证/深证用缩写避免两行换行） */
const STOCK_SYMBOL_EN: Record<string, string> = {
  '000001.SS': 'SSE Comp.',
  '399001.SZ': 'SZSE Comp.',
  '^HSI': 'Hang Seng',
  '^DJI': 'Dow Jones',
  '^IXIC': 'Nasdaq',
  '^GSPC': 'S&P 500',
  '^N225': 'Nikkei 225',
  '^GDAXI': 'DAX',
  '^FTSE': 'FTSE 100',
  '^FCHI': 'CAC 40',
  '^KS11': 'KOSPI',
  '^BSESN': 'Sensex',
}

/** 大宗商品名称与单位 */
const COMMODITY_NAME_EN: Record<string, string> = {
  'WTI原油': 'WTI Crude',
  '布伦特': 'Brent',
  '黄金': 'Gold',
  '白银': 'Silver',
}
const COMMODITY_UNIT_EN: Record<string, string> = {
  '美元/桶': '$/bbl',
  '美元/盎司': '$/oz',
}

/** A 股指数：按 symbol 映射英文名（上证/深证用缩写避免两行换行） */
const A_SHARE_SYMBOL_EN: Record<string, string> = {
  '000001.SS': 'SSE Comp.',
  '399001.SZ': 'SZSE Comp.',
  '000300.SS': 'CSI 300',
  '399006.SZ': 'ChiNext',
  '000688.SS': 'STAR 50',
  '899050.BJ': 'BSE 50',
}

/** 利率/波动率面板 */
const RATE_NAME_EN: Record<string, string> = {
  '10Y美债': '10Y Treasury',
  '3M美债': '3M Treasury',
  'VIX': 'VIX',
  '利差10Y-3M': '10Y-3M Spread',
}

/** 地区 id -> 英文名（与 mock MAP_SPOTS_DEFAULT 及后端 REGIONS 一致） */
const REGION_ID_EN: Record<string, string> = {
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru', EC: 'Ecuador', VE: 'Venezuela',
  UY: 'Uruguay', PY: 'Paraguay', BO: 'Bolivia', UK: 'United Kingdom', IE: 'Ireland',
  FR: 'France', DE: 'Germany', NL: 'Netherlands', BE: 'Belgium', AT: 'Austria',
  CH: 'Switzerland', IT: 'Italy', ES: 'Spain', PT: 'Portugal', SE: 'Sweden',
  NO: 'Norway', DK: 'Denmark', FI: 'Finland', IS: 'Iceland', PL: 'Poland',
  CZ: 'Czech Republic', SK: 'Slovakia', HU: 'Hungary', RO: 'Romania', BG: 'Bulgaria',
  GR: 'Greece', HR: 'Croatia', RS: 'Serbia', UA: 'Ukraine', RU: 'Russia', TR: 'Turkey',
  AE: 'UAE', SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', IL: 'Israel', JO: 'Jordan',
  EG: 'Egypt', CN: 'China', TW: 'Taiwan', HK: 'Hong Kong', MO: 'Macau', JP: 'Japan',
  KR: 'South Korea', IN: 'India', TH: 'Thailand', VN: 'Vietnam', SG: 'Singapore',
  MY: 'Malaysia', ID: 'Indonesia', PH: 'Philippines', AU: 'Australia', NZ: 'New Zealand',
  ZA: 'South Africa',
}

export function getKeyMetricDisplayName(name: string, locale: Locale): string {
  if (locale !== 'en') return name
  return KEY_METRIC_NAME_EN[name] ?? name
}

export function getStockDisplayName(name: string, symbol: string, locale: Locale): string {
  if (locale !== 'en') return name
  return STOCK_SYMBOL_EN[symbol] ?? name
}

export function getCommodityDisplayName(name: string, locale: Locale): string {
  if (locale !== 'en') return name
  return COMMODITY_NAME_EN[name] ?? name
}

export function getCommodityUnitDisplay(unit: string, locale: Locale): string {
  if (locale !== 'en') return unit
  return COMMODITY_UNIT_EN[unit] ?? unit
}

export function getAShareIndexDisplayName(name: string, symbol: string, locale: Locale): string {
  if (locale !== 'en') return name
  return A_SHARE_SYMBOL_EN[symbol] ?? name
}

export function getRateDisplayName(name: string, locale: Locale): string {
  if (locale !== 'en') return name
  return RATE_NAME_EN[name] ?? name
}

export function getRegionDisplayName(regionId: string, locale: Locale, fallbackName?: string): string {
  if (locale !== 'en') return fallbackName ?? regionId
  return REGION_ID_EN[regionId] ?? fallbackName ?? regionId
}

/** 新闻来源：后端返回原始来源名；中文界面显示中文名，英文界面显示英文/原名 */
const SOURCE_ZH: Record<string, string> = {
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
  '凤凰财经': '凤凰财经',
  '网易财经': '网易财经',
  '东方财富(聚合)': '东方财富',
  '财联社(聚合)': '财联社',
  '同花顺财经(聚合)': '同花顺财经',
  '第一财经(聚合)': '第一财经',
  '系统': '系统',
}
const SOURCE_EN: Record<string, string> = {
  '联合早报': 'Lianhe Zaobao',
  'Google 新闻': 'Google News',
  '新浪财经': 'Sina Finance',
  '中国新闻网': 'China News Network',
  '财新网': 'Caixin',
  '证券之星': 'Stockstar',
  '每日经济新闻': 'NBD',
  '凤凰财经': 'Phoenix Finance',
  '网易财经': 'NetEase Finance',
  '东方财富(聚合)': 'Eastmoney',
  '财联社(聚合)': 'Cailian Press',
  '同花顺财经(聚合)': '10jqka Finance',
  '第一财经(聚合)': 'Yicai',
  '系统': 'System',
}

const NEWS_CATEGORY_EN: Record<string, string> = {
  '宏观': 'Macro',
  '央行/利率': 'Central banks',
  '通胀/就业': 'Inflation & jobs',
  '汇率/债券': 'FX & bonds',
  '股市/盘面': 'Equities',
  '大宗商品': 'Commodities',
  '公司/财报': 'Companies',
  '地缘/政策': 'Geopolitics',
  '中国宏观': 'China macro',
  'A股盘面': 'A-share flow',
  'A股公司': 'A-share companies',
}

const NEWS_TAG_EN: Record<string, string> = {
  '美联储': 'Fed',
  '通胀': 'Inflation',
  '就业': 'Jobs',
  '人民币': 'CNY',
  '美债': 'Treasuries',
  '原油': 'Crude',
  '黄金': 'Gold',
  'A股': 'A-shares',
  '财联社': 'Cailian Press',
  '东方财富': 'Eastmoney',
  '科技股': 'Tech',
  '地产': 'Property',
}

const MARKET_SCOPE_EN: Record<string, string> = {
  global: 'Global',
  china: 'China',
  a_share: 'A-share',
}

export function getNewsSourceDisplay(source: string, locale: Locale): string {
  if (locale === 'zh') return SOURCE_ZH[source] ?? source
  return SOURCE_EN[source] ?? source
}

export function getNewsCategoryDisplay(category: string | undefined, locale: Locale): string {
  if (!category) return ''
  if (locale === 'zh') return category
  return NEWS_CATEGORY_EN[category] ?? category
}

export function getNewsTagDisplay(tag: string, locale: Locale): string {
  if (locale === 'zh') return tag
  return NEWS_TAG_EN[tag] ?? tag
}

export function getStoryClusterDisplay(sourceCount: number | undefined, locale: Locale): string {
  if (!sourceCount || sourceCount <= 1) return ''
  return locale === 'zh' ? `聚合 ${sourceCount} 源` : `${sourceCount} sources`
}

export function getMarketScopeDisplay(scope: string, locale: Locale): string {
  if (locale === 'zh') {
    if (scope === 'global') return '全球'
    if (scope === 'china') return '中国'
    if (scope === 'a_share') return 'A股'
    return scope
  }
  return MARKET_SCOPE_EN[scope] ?? scope
}
