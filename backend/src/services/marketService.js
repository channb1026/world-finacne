/**
 * 行情服务：从 Yahoo Finance 拉取真实汇率、股指、大宗、利率与波动率，无 mock。
 * 使用 yahoo-finance2 v3；统一 snapshot 缓存，避免同源 symbol 被多次抓取。
 * 汇率 Yahoo 失败时走 Frankfurter 备用。
 */

import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

const CACHE_MS = 3 * 1000 // 3 秒

/** 全量 symbol 集合（去重），一次请求拉取所有行情 */
const ALL_SYMBOLS = [
  ...new Set([
    'USDCNY=X', 'EURCNY=X', 'JPYCNY=X', 'GBPCNY=X', 'HKDCNY=X', 'AUDCNY=X', 'CADCNY=X',
    '000001.SS', '399001.SZ', '^HSI', '^DJI', '^IXIC', '^GSPC', '^N225', '^GDAXI', '^FTSE', '^FCHI', '^KS11', '^BSESN',
    '000300.SS', '399006.SZ', '000688.SS', '899050.BJ',
    'DX-Y.NYB', '^VIX', 'CL=F', 'GC=F', 'BZ=F', 'SI=F', '^TNX', '^IRX',
  ]),
]

let snapshot = { bySymbol: {}, updatedAt: 0 }
let refreshPromise = null

function isStale() {
  return !snapshot.updatedAt || Date.now() - snapshot.updatedAt > CACHE_MS
}

function round(v, digits = 4) {
  if (v == null || Number.isNaN(v)) return 0
  return Math.round(v * Math.pow(10, digits)) / Math.pow(10, digits)
}

async function quoteMulti(symbols) {
  const list = Array.isArray(symbols) ? symbols : [symbols]
  const quotes = await yf.quote(list)
  return Array.isArray(quotes) ? quotes : [quotes]
}

/** 单飞刷新：合并并发请求，一次 Yahoo 拉取全量 */
async function ensureSnapshot() {
  if (!isStale()) return
  if (refreshPromise) {
    await refreshPromise
    return
  }
  refreshPromise = (async () => {
    try {
      const quotes = await quoteMulti(ALL_SYMBOLS)
      const bySymbol = {}
      quotes.forEach((q) => { if (q?.symbol) bySymbol[q.symbol] = q })
      snapshot = { bySymbol, updatedAt: Date.now() }
    } catch (err) {
      console.warn('[market] snapshot refresh failed:', err.message)
      // 不更新 snapshot，保留旧数据
    } finally {
      refreshPromise = null
    }
  })()
  await refreshPromise
}

/** 后台定时预刷新：每 CACHE_MS 主动刷新 snapshot，请求只读内存，减少撞上刷新时刻 */
export function startMarketBackgroundRefresh() {
  ensureSnapshot().catch(() => {})
  setInterval(() => ensureSnapshot().catch(() => {}), CACHE_MS)
}

/** Frankfurter 备用：Yahoo 汇率失败时使用 */
async function fetchRatesFrankfurter() {
  const res = await fetch(
    'https://api.frankfurter.app/latest?base=USD&symbols=CNY,EUR,JPY,GBP,HKD,AUD,CAD'
  )
  if (!res.ok) throw new Error(`Frankfurter ${res.status}`)
  const json = await res.json()
  const rates = json?.rates
  if (!rates || typeof rates.CNY !== 'number') throw new Error('Frankfurter invalid response')
  const usdCny = rates.CNY
  const pairMap = [
    ['USD/CNY', usdCny],
    ['EUR/CNY', rates.EUR ? round(usdCny / rates.EUR, 4) : 0],
    ['JPY/CNY', rates.JPY ? round(usdCny / rates.JPY, 4) : 0],
    ['GBP/CNY', rates.GBP ? round(usdCny / rates.GBP, 4) : 0],
    ['HKD/CNY', rates.HKD ? round(usdCny / rates.HKD, 4) : 0],
    ['AUD/CNY', rates.AUD ? round(usdCny / rates.AUD, 4) : 0],
    ['CAD/CNY', rates.CAD ? round(usdCny / rates.CAD, 4) : 0],
  ]
  return pairMap.filter(([, r]) => r > 0).map(([pair, rate]) => ({
    pair,
    rate,
    change: 0,
    changePct: 0,
  }))
}

const RATE_SYMBOLS = ['USDCNY=X', 'EURCNY=X', 'JPYCNY=X', 'GBPCNY=X', 'HKDCNY=X', 'AUDCNY=X', 'CADCNY=X']
const RATE_PAIR_MAP = { 'USDCNY=X': 'USD/CNY', 'EURCNY=X': 'EUR/CNY', 'JPYCNY=X': 'JPY/CNY', 'GBPCNY=X': 'GBP/CNY', 'HKDCNY=X': 'HKD/CNY', 'AUDCNY=X': 'AUD/CNY', 'CADCNY=X': 'CAD/CNY' }

export async function getRates() {
  await ensureSnapshot()
  const { bySymbol } = snapshot
  const hasRates = RATE_SYMBOLS.some((s) => bySymbol[s]?.regularMarketPrice != null)
  if (!hasRates) {
    try {
      return await fetchRatesFrankfurter()
    } catch (err) {
      console.warn('[market] getRates Frankfurter fallback failed:', err.message)
      return []
    }
  }
  return RATE_SYMBOLS.map((sym) => {
    const q = bySymbol[sym]
    const rate = q?.regularMarketPrice ?? 0
    const prev = q?.regularMarketPreviousClose ?? rate
    const change = rate - prev
    const changePct = prev ? round((change / prev) * 100, 2) : 0
    return {
      pair: RATE_PAIR_MAP[sym] || sym,
      rate: round(rate, 4),
      change: round(change, 4),
      changePct,
    }
  }).filter((r) => r.rate > 0)
}

const STOCK_SYMBOLS = [
  { symbol: '000001.SS', name: '上证指数' },
  { symbol: '399001.SZ', name: '深证成指' },
  { symbol: '^HSI', name: '恒生指数' },
  { symbol: '^DJI', name: '道琼斯' },
  { symbol: '^IXIC', name: '纳斯达克' },
  { symbol: '^GSPC', name: '标普 500' },
  { symbol: '^N225', name: '日经 225' },
  { symbol: '^GDAXI', name: '德国 DAX' },
  { symbol: '^FTSE', name: '富时 100' },
  { symbol: '^FCHI', name: '法国 CAC40' },
  { symbol: '^KS11', name: '韩国综指' },
  { symbol: '^BSESN', name: '印度 Sensex' },
]

export async function getStocks() {
  await ensureSnapshot()
  const { bySymbol } = snapshot
  return STOCK_SYMBOLS.map(({ symbol, name }) => {
    const q = bySymbol[symbol]
    const value = q?.regularMarketPrice ?? 0
    const prev = q?.regularMarketPreviousClose ?? value
    const change = value - prev
    const changePct = prev ? round((change / prev) * 100, 2) : 0
    return { name, symbol, value: round(value, 2), change: round(change, 2), changePct }
  })
}

const KEY_METRIC_SYMBOLS = [
  { symbol: 'DX-Y.NYB', name: '美元指数' },
  { symbol: '^VIX', name: 'VIX' },
  { symbol: 'CL=F', name: 'WTI原油' },
  { symbol: 'GC=F', name: '黄金' },
  { symbol: 'USDCNY=X', name: '在岸人民币' },
  { symbol: 'BZ=F', name: '布伦特' },
  { symbol: '^TNX', name: '10Y美债' },
]

export async function getKeyMetrics() {
  await ensureSnapshot()
  const { bySymbol } = snapshot
  return KEY_METRIC_SYMBOLS.map(({ symbol, name }) => {
    const q = bySymbol[symbol]
    const v = q?.regularMarketPrice
    const prev = q?.regularMarketPreviousClose ?? v
    const changePct = v != null && prev ? round(((v - prev) / prev) * 100, 2) : 0
    let value = ''
    if (name === '10Y美债') value = v != null ? round(v, 2) + '%' : '-'
    else value = v != null ? String(round(v, 2)) : '-'
    return { name, value, changePct }
  })
}

const COMMODITY_SYMBOLS = [
  { symbol: 'CL=F', name: 'WTI原油', unit: '美元/桶' },
  { symbol: 'BZ=F', name: '布伦特', unit: '美元/桶' },
  { symbol: 'GC=F', name: '黄金', unit: '美元/盎司' },
  { symbol: 'SI=F', name: '白银', unit: '美元/盎司' },
]

export async function getCommodities() {
  await ensureSnapshot()
  const { bySymbol } = snapshot
  return COMMODITY_SYMBOLS.map(({ symbol, name, unit }) => {
    const q = bySymbol[symbol]
    const value = q?.regularMarketPrice ?? 0
    const prev = q?.regularMarketPreviousClose ?? value
    const changePct = prev ? round(((value - prev) / prev) * 100, 2) : 0
    return { name, value: round(value, 2), unit, changePct }
  })
}

const A_SHARE_SYMBOLS = [
  { symbol: '000001.SS', name: '上证指数' },
  { symbol: '399001.SZ', name: '深证成指' },
  { symbol: '000300.SS', name: '沪深300' },
  { symbol: '399006.SZ', name: '创业板指' },
  { symbol: '000688.SS', name: '科创50' },
  { symbol: '899050.BJ', name: '北证50' },
]

export async function getAShareIndices() {
  await ensureSnapshot()
  const { bySymbol } = snapshot
  return A_SHARE_SYMBOLS.map(({ symbol, name }) => {
    const q = bySymbol[symbol]
    const value = q?.regularMarketPrice ?? 0
    const prev = q?.regularMarketPreviousClose ?? value
    const change = value - prev
    const changePct = prev ? round((change / prev) * 100, 2) : 0
    return { name, symbol, value: round(value, 2), change: round(change, 2), changePct }
  })
}

export async function getRatesPanel() {
  await ensureSnapshot()
  const { bySymbol } = snapshot
  const tnx = bySymbol['^TNX']?.regularMarketPrice
  const irx = bySymbol['^IRX']?.regularMarketPrice
  const vixQ = bySymbol['^VIX']
  const vix = vixQ?.regularMarketPrice
  const vixPrev = vixQ?.regularMarketPreviousClose ?? vix
  const vixChg = vix != null && vixPrev ? round(((vix - vixPrev) / vixPrev) * 100, 2) : 0
  return [
    { name: '10Y美债', value: tnx != null ? round(tnx, 2) + '%' : '-', changePct: 0 },
    { name: '3M美债', value: irx != null ? round(irx, 2) + '%' : '-', changePct: 0 },
    { name: 'VIX', value: vix != null ? String(round(vix, 1)) : '-', changePct: vixChg },
    { name: '利差10Y-3M', value: (tnx != null && irx != null) ? Math.round((tnx - irx) * 100) + 'bp' : '-', changePct: 0 },
  ]
}

export async function getCalendar() {
  return []
}
