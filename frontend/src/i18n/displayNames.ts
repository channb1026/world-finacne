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

/** 全球股指：按 symbol 映射英文名 */
const STOCK_SYMBOL_EN: Record<string, string> = {
  '000001.SS': 'Shanghai Composite',
  '399001.SZ': 'Shenzhen Component',
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

/** A 股指数：按 symbol 映射英文名 */
const A_SHARE_SYMBOL_EN: Record<string, string> = {
  '000001.SS': 'Shanghai Composite',
  '399001.SZ': 'Shenzhen Component',
  '000300.SS': 'CSI 300',
  '399006.SZ': 'ChiNext',
  '000688.SS': 'STAR 50',
  '899050.BJ': 'BSE 50',
}

/** 利率/波动率面板 */
const RATE_NAME_EN: Record<string, string> = {
  '10Y美债': '10Y Treasury',
  '2Y美债': '2Y Treasury',
  'VIX': 'VIX',
  '利差10Y-2Y': '10Y-2Y Spread',
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
