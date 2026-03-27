/**
 * 行情服务：从 Yahoo Finance 拉取真实汇率、股指、大宗、利率与波动率，无 mock。
 * 使用 yahoo-finance2 v3；统一 snapshot 缓存，避免同源 symbol 被多次抓取。
 * 汇率 Yahoo 失败时走 Frankfurter 备用。
 */

import YahooFinance from 'yahoo-finance2'
import {
  registerSource,
  markSourceSuccess,
  markSourceFailure,
} from '../sourceStatus.js'
import { withTimeout } from '../utils/withTimeout.js'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

const CACHE_MS = 3 * 1000 // 3 秒
const SNAPSHOT_TIMEOUT_MS = 8 * 1000
const FRANKFURTER_TIMEOUT_MS = 8 * 1000
const CALENDAR_CACHE_MS = 45 * 1000
const CALENDAR_SOURCE_TIMEOUT_MS = 10 * 1000
const CALENDAR_REFRESH_TIMEOUT_MS = 15 * 1000
const CALENDAR_API_BASE = 'https://api.tradingeconomics.com/calendar'
const CALENDAR_DEFAULT_LIMIT = 8
const CALENDAR_EODHD_BASE = 'https://eodhd.com/api/economic-events'
const MARKET_CIRCUIT_BASE_MS = 15 * 1000
const MARKET_CIRCUIT_MAX_MS = 90 * 1000

registerSource('market:yahoo-finance', {
  name: 'Yahoo Finance',
  category: 'market',
  meta: { role: 'primary quotes' },
})
registerSource('market:frankfurter', {
  name: 'Frankfurter',
  category: 'market',
  meta: { role: 'fx fallback' },
})
registerSource('calendar:tradingeconomics', {
  name: 'Trading Economics',
  category: 'calendar',
  meta: { role: 'primary calendar' },
})
registerSource('calendar:eodhd', {
  name: 'EODHD Economic Events',
  category: 'calendar',
  meta: { role: 'calendar fallback' },
})

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
let marketCircuit = { failures: 0, openUntil: 0 }

function isStale() {
  return !snapshot.updatedAt || Date.now() - snapshot.updatedAt > CACHE_MS
}

function round(v, digits = 4) {
  if (v == null || Number.isNaN(v)) return 0
  return Math.round(v * Math.pow(10, digits)) / Math.pow(10, digits)
}

function isMarketCircuitOpen() {
  return Date.now() < marketCircuit.openUntil
}

function recordMarketCircuitSuccess() {
  marketCircuit = { failures: 0, openUntil: 0 }
}

function recordMarketCircuitFailure() {
  const failures = marketCircuit.failures + 1
  const backoffMs = Math.min(MARKET_CIRCUIT_MAX_MS, MARKET_CIRCUIT_BASE_MS * failures)
  marketCircuit = {
    failures,
    openUntil: Date.now() + backoffMs,
  }
}

async function quoteMulti(symbols) {
  const list = Array.isArray(symbols) ? symbols : [symbols]
  const quotes = await withTimeout(yf.quote(list), SNAPSHOT_TIMEOUT_MS, 'Yahoo Finance quote')
  return Array.isArray(quotes) ? quotes : [quotes]
}

/** 单飞刷新：合并并发请求，一次 Yahoo 拉取全量 */
async function ensureSnapshot() {
  if (!isStale()) return
  if (refreshPromise) {
    try {
      await refreshPromise
    } catch {
      // 刷新链路内部已经记录过日志；共享等待方只需要尽快返回旧快照。
    }
    return
  }
  if (isMarketCircuitOpen()) {
    return
  }
  refreshPromise = (async () => {
    try {
      const quotes = await quoteMulti(ALL_SYMBOLS)
      const bySymbol = {}
      quotes.forEach((q) => { if (q?.symbol) bySymbol[q.symbol] = q })
      snapshot = { bySymbol, updatedAt: Date.now() }
      recordMarketCircuitSuccess()
      markSourceSuccess('market:yahoo-finance', {
        meta: { symbols: ALL_SYMBOLS.length },
      })
    } catch (err) {
      recordMarketCircuitFailure()
      console.warn('[market] snapshot refresh failed:', err.message)
      markSourceFailure('market:yahoo-finance', err)
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
  return setInterval(() => ensureSnapshot().catch(() => {}), CACHE_MS)
}

/** Frankfurter 备用：Yahoo 汇率失败时使用 */
async function fetchRatesFrankfurter() {
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?base=USD&symbols=CNY,EUR,JPY,GBP,HKD,AUD,CAD',
      { signal: AbortSignal.timeout(FRANKFURTER_TIMEOUT_MS) },
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
    markSourceSuccess('market:frankfurter')
    return pairMap.filter(([, r]) => r > 0).map(([pair, rate]) => ({
      pair,
      rate,
      change: 0,
      changePct: 0,
    }))
  } catch (err) {
    markSourceFailure('market:frankfurter', err)
    throw err
  }
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
  { symbol: '^HSI', name: '恒生指数' },
  { symbol: '^DJI', name: '道琼斯' },
  { symbol: '^IXIC', name: '纳斯达克' },
  { symbol: '^GSPC', name: '标普 500' },
  { symbol: '^N225', name: '日经 225' },
  { symbol: '^KS11', name: '韩国综指' },
  { symbol: '^BSESN', name: '印度 Sensex' },
  { symbol: '^GDAXI', name: '德国 DAX' },
  { symbol: '^FTSE', name: '富时 100' },
  { symbol: '^FCHI', name: '法国 CAC40' },
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

const calendarCacheByLang = new Map()
const calendarRefreshByLang = new Map()

const CALENDAR_CIRCUIT_BASE_MS = 30 * 1000
const CALENDAR_CIRCUIT_MAX_MS = 5 * 60 * 1000
const calendarCircuitBySource = new Map()

function isCalendarCircuitOpen(source) {
  const c = calendarCircuitBySource.get(source)
  return c ? Date.now() < c.openUntil : false
}

function recordCalendarCircuitFailure(source) {
  const prev = calendarCircuitBySource.get(source) || { failures: 0, openUntil: 0 }
  const failures = prev.failures + 1
  const backoffMs = Math.min(CALENDAR_CIRCUIT_MAX_MS, CALENDAR_CIRCUIT_BASE_MS * Math.pow(2, failures - 1))
  calendarCircuitBySource.set(source, { failures, openUntil: Date.now() + backoffMs })
}

function recordCalendarCircuitSuccess(source) {
  calendarCircuitBySource.delete(source)
}

function getCalendarCredentials() {
  return process.env.TRADING_ECONOMICS_API_KEY ?? 'guest:guest'
}

function getEodhdToken() {
  return process.env.EODHD_API_TOKEN ?? 'demo'
}

function getCalendarLanguage(lang = 'en') {
  return lang === 'zh' ? 'zh' : 'en'
}

function formatCalendarDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

function formatCalendarMetric(value) {
  if (value == null || value === '') return undefined
  return String(value)
}

function parseImportance(value) {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 0
  return Math.max(0, Math.min(3, Math.round(numeric)))
}

function normalizeCalendarItem(item) {
  const dateTime = formatCalendarDate(item?.Date || item?.date)
  const country = item?.Country || item?.country || ''
  const event = item?.Event || item?.event || ''
  if (!dateTime || !country || !event) return null

  return {
    id: String(item?.CalendarId ?? `${country}-${event}-${dateTime}`),
    dateTime,
    country,
    event,
    actual: formatCalendarMetric(item?.Actual),
    forecast: formatCalendarMetric(item?.Forecast),
    previous: formatCalendarMetric(item?.Previous),
    importance: parseImportance(item?.Importance),
    currency: item?.Currency || undefined,
  }
}

function rankCalendarItem(item, nowMs) {
  const eventMs = new Date(item.dateTime).getTime()
  if (eventMs >= nowMs) return eventMs - nowMs
  return 7 * 24 * 60 * 60 * 1000 + (nowMs - eventMs)
}

async function refreshCalendar(lang) {
  let lastError = null

  if (!isCalendarCircuitOpen('tradingeconomics')) {
    try {
      await refreshCalendarFromTradingEconomics(lang)
      recordCalendarCircuitSuccess('tradingeconomics')
      return
    } catch (err) {
      lastError = err
      recordCalendarCircuitFailure('tradingeconomics')
      markSourceFailure('calendar:tradingeconomics', err)
    }
  }

  if (!isCalendarCircuitOpen('eodhd')) {
    try {
      await refreshCalendarFromEodhd(lang)
      recordCalendarCircuitSuccess('eodhd')
      return
    } catch (err) {
      recordCalendarCircuitFailure('eodhd')
      markSourceFailure('calendar:eodhd', err)
      throw lastError || err
    }
  }

  if (lastError) throw lastError
  throw new Error('All calendar sources circuit-open')
}

async function refreshCalendarFromTradingEconomics(lang) {
  const url = new URL(CALENDAR_API_BASE)
  url.searchParams.set('c', getCalendarCredentials())
  url.searchParams.set('f', 'json')
  url.searchParams.set('lang', getCalendarLanguage(lang))

  const res = await fetch(url, {
    signal: AbortSignal.timeout(CALENDAR_SOURCE_TIMEOUT_MS),
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'world-finance-monitor/1.0',
    },
  })
  if (!res.ok) throw new Error(`TradingEconomics ${res.status}`)

  const payload = await res.json()
  const items = Array.isArray(payload) ? payload.map(normalizeCalendarItem).filter(Boolean) : []
  markSourceSuccess('calendar:tradingeconomics', {
    meta: { items: items.length, lang: getCalendarLanguage(lang) },
  })
  setCalendarCache(lang, items)
}

function normalizeEodhdCalendarItem(item) {
  const dateTime = formatCalendarDate(item?.date || item?.Date)
  const country = item?.country || item?.Country || item?.country_name || ''
  const event = item?.event || item?.Event || item?.title || ''
  if (!dateTime || !country || !event) return null
  return {
    id: String(item?.id ?? item?.event_id ?? `${country}-${event}-${dateTime}`),
    dateTime,
    country,
    event,
    actual: formatCalendarMetric(item?.actual || item?.Actual),
    forecast: formatCalendarMetric(item?.estimate || item?.forecast || item?.Forecast),
    previous: formatCalendarMetric(item?.previous || item?.Previous),
    importance: parseImportance(item?.importance || item?.Importance),
    currency: item?.currency || item?.Currency || undefined,
  }
}

async function refreshCalendarFromEodhd(lang) {
  const url = new URL(CALENDAR_EODHD_BASE)
  url.searchParams.set('api_token', getEodhdToken())
  url.searchParams.set('fmt', 'json')
  url.searchParams.set('from', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().slice(0, 10))
  url.searchParams.set('to', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  url.searchParams.set('lang', getCalendarLanguage(lang))

  const res = await fetch(url, {
    signal: AbortSignal.timeout(CALENDAR_SOURCE_TIMEOUT_MS),
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'world-finance-monitor/1.0',
    },
  })
  if (!res.ok) throw new Error(`EODHD ${res.status}`)

  const payload = await res.json()
  const items = Array.isArray(payload) ? payload.map(normalizeEodhdCalendarItem).filter(Boolean) : []
  markSourceSuccess('calendar:eodhd', {
    meta: { items: items.length, lang: getCalendarLanguage(lang) },
  })
  setCalendarCache(lang, items)
}

function setCalendarCache(lang, items) {
  const nowMs = Date.now()
  const filtered = items
    .filter((item) => {
      const eventMs = new Date(item.dateTime).getTime()
      return eventMs >= nowMs - 2 * 60 * 60 * 1000 && eventMs <= nowMs + 7 * 24 * 60 * 60 * 1000
    })
    .sort((a, b) => rankCalendarItem(a, nowMs) - rankCalendarItem(b, nowMs))
    .slice(0, CALENDAR_DEFAULT_LIMIT)

  calendarCacheByLang.set(lang, {
    items: filtered,
    updatedAt: nowMs,
  })
}

async function ensureCalendar(lang) {
  const cache = calendarCacheByLang.get(lang)
  if (cache && Date.now() - cache.updatedAt <= CALENDAR_CACHE_MS) {
    return
  }
  if (calendarRefreshByLang.has(lang)) {
    await calendarRefreshByLang.get(lang)
    return
  }

  const refreshPromise = withTimeout(refreshCalendar(lang), CALENDAR_REFRESH_TIMEOUT_MS, `calendar(${lang})`)
    .catch((err) => {
      console.warn('[market] calendar refresh failed:', err.message)
    })
    .finally(() => {
      calendarRefreshByLang.delete(lang)
    })

  calendarRefreshByLang.set(lang, refreshPromise)
  await refreshPromise
}

export async function getCalendar(lang = 'en') {
  const normalizedLang = getCalendarLanguage(lang)
  await ensureCalendar(normalizedLang)
  const cache = calendarCacheByLang.get(normalizedLang)
  return cache?.items ? cache.items.map((item) => ({ ...item })) : []
}
