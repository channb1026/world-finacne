/**
 * 行情服务：从 Yahoo Finance 拉取真实汇率、股指、大宗、利率与波动率，无 mock。
 * 使用 yahoo-finance2 v3（new YahooFinance()）；Yahoo 失败时汇率走 Frankfurter 备用。
 */

import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

let cache = {}
const CACHE_MS = 3 * 1000 // 3 秒，贴近实时

function isStale(key) {
  return !cache[key] || Date.now() - cache[key].updatedAt > CACHE_MS
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

/** 备用：Frankfurter 免费汇率 API（JSON，无 key），Yahoo 解析失败时使用 */
async function fetchRatesFrankfurter() {
  const res = await fetch(
    'https://api.frankfurter.app/latest?base=USD&symbols=CNY,EUR,JPY,GBP,HKD,AUD,CAD'
  )
  if (!res.ok) throw new Error(`Frankfurter ${res.status}`)
  const json = await res.json()
  const rates = json?.rates
  if (!rates || typeof rates.CNY !== 'number') throw new Error('Frankfurter invalid response')
  const usdCny = rates.CNY
  const pairs = [
    { pair: 'USD/CNY', rate: usdCny },
    { pair: 'EUR/CNY', rate: rates.EUR ? round(usdCny / rates.EUR, 4) : 0 },
    { pair: 'JPY/CNY', rate: rates.JPY ? round(usdCny / rates.JPY, 4) : 0 },
    { pair: 'GBP/CNY', rate: rates.GBP ? round(usdCny / rates.GBP, 4) : 0 },
    { pair: 'HKD/CNY', rate: rates.HKD ? round(usdCny / rates.HKD, 4) : 0 },
    { pair: 'AUD/CNY', rate: rates.AUD ? round(usdCny / rates.AUD, 4) : 0 },
    { pair: 'CAD/CNY', rate: rates.CAD ? round(usdCny / rates.CAD, 4) : 0 },
  ]
  return pairs.filter((r) => r.rate > 0).map((r) => ({
    pair: r.pair,
    rate: r.rate,
    change: 0,
    changePct: 0,
  }))
}

export async function getRates() {
  if (!isStale('rates')) return cache.rates.data
  const symbols = ['USDCNY=X', 'EURCNY=X', 'JPYCNY=X', 'GBPCNY=X', 'HKDCNY=X', 'AUDCNY=X', 'CADCNY=X']
  try {
    const quotes = await quoteMulti(symbols)
    const pairMap = { 'USDCNY=X': 'USD/CNY', 'EURCNY=X': 'EUR/CNY', 'JPYCNY=X': 'JPY/CNY', 'GBPCNY=X': 'GBP/CNY', 'HKDCNY=X': 'HKD/CNY', 'AUDCNY=X': 'AUD/CNY', 'CADCNY=X': 'CAD/CNY' }
    const data = quotes.map((q) => {
      const rate = q?.regularMarketPrice ?? 0
      const prev = q?.regularMarketPreviousClose ?? rate
      const change = rate - prev
      const changePct = prev ? round((change / prev) * 100, 2) : 0
      return {
        pair: pairMap[q?.symbol] || q?.symbol,
        rate: round(rate, 4),
        change: round(change, 4),
        changePct,
      }
    }).filter((r) => r.pair)
    cache.rates = { data, updatedAt: Date.now() }
    return data
  } catch (err) {
    console.warn('[market] getRates (Yahoo) failed:', err.message)
    try {
      const data = await fetchRatesFrankfurter()
      if (data.length > 0) {
        cache.rates = { data, updatedAt: Date.now() }
        return data
      }
    } catch (fallbackErr) {
      console.warn('[market] getRates (Frankfurter fallback) failed:', fallbackErr.message)
    }
    return []
  }
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
  if (!isStale('stocks')) return cache.stocks.data
  try {
    const symbols = STOCK_SYMBOLS.map((s) => s.symbol)
    const quotes = await quoteMulti(symbols)
    const bySymbol = {}
    quotes.forEach((q) => { if (q?.symbol) bySymbol[q.symbol] = q })
    const data = STOCK_SYMBOLS.map(({ symbol, name }) => {
      const q = bySymbol[symbol]
      const value = q?.regularMarketPrice ?? 0
      const prev = q?.regularMarketPreviousClose ?? value
      const change = value - prev
      const changePct = prev ? round((change / prev) * 100, 2) : 0
      return { name, symbol, value: round(value, 2), change: round(change, 2), changePct }
    })
    cache.stocks = { data, updatedAt: Date.now() }
    return data
  } catch (err) {
    console.warn('[market] getStocks failed:', err.message)
    return []
  }
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
  if (!isStale('keyMetrics')) return cache.keyMetrics.data
  try {
    const symbols = KEY_METRIC_SYMBOLS.map((s) => s.symbol)
    const quotes = await quoteMulti(symbols)
    const bySymbol = {}
    quotes.forEach((q) => { if (q?.symbol) bySymbol[q.symbol] = q })
    const data = KEY_METRIC_SYMBOLS.map(({ symbol, name }) => {
      const q = bySymbol[symbol]
      const v = q?.regularMarketPrice
      const prev = q?.regularMarketPreviousClose ?? v
      const changePct = v != null && prev ? round(((v - prev) / prev) * 100, 2) : 0
      let value = ''
      if (name === '10Y美债') value = v != null ? round(v, 2) + '%' : '-'
      else value = v != null ? String(round(v, 2)) : '-'
      return { name, value, changePct }
    })
    cache.keyMetrics = { data, updatedAt: Date.now() }
    return data
  } catch (err) {
    console.warn('[market] getKeyMetrics failed:', err.message)
    return []
  }
}

const COMMODITY_SYMBOLS = [
  { symbol: 'CL=F', name: 'WTI原油', unit: '美元/桶' },
  { symbol: 'BZ=F', name: '布伦特', unit: '美元/桶' },
  { symbol: 'GC=F', name: '黄金', unit: '美元/盎司' },
  { symbol: 'SI=F', name: '白银', unit: '美元/盎司' },
]

export async function getCommodities() {
  if (!isStale('commodities')) return cache.commodities.data
  try {
    const symbols = COMMODITY_SYMBOLS.map((s) => s.symbol)
    const quotes = await quoteMulti(symbols)
    const bySymbol = {}
    quotes.forEach((q) => { if (q?.symbol) bySymbol[q.symbol] = q })
    const data = COMMODITY_SYMBOLS.map(({ symbol, name, unit }) => {
      const q = bySymbol[symbol]
      const value = q?.regularMarketPrice ?? 0
      const prev = q?.regularMarketPreviousClose ?? value
      const changePct = prev ? round(((value - prev) / prev) * 100, 2) : 0
      return { name, value: round(value, 2), unit, changePct }
    })
    cache.commodities = { data, updatedAt: Date.now() }
    return data
  } catch (err) {
    console.warn('[market] getCommodities failed:', err.message)
    return []
  }
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
  if (!isStale('aShareIndices')) return cache.aShareIndices.data
  try {
    const symbols = A_SHARE_SYMBOLS.map((s) => s.symbol)
    const quotes = await quoteMulti(symbols)
    const bySymbol = {}
    quotes.forEach((q) => { if (q?.symbol) bySymbol[q.symbol] = q })
    const data = A_SHARE_SYMBOLS.map(({ symbol, name }) => {
      const q = bySymbol[symbol]
      const value = q?.regularMarketPrice ?? 0
      const prev = q?.regularMarketPreviousClose ?? value
      const change = value - prev
      const changePct = prev ? round((change / prev) * 100, 2) : 0
      return { name, symbol, value: round(value, 2), change: round(change, 2), changePct }
    })
    cache.aShareIndices = { data, updatedAt: Date.now() }
    return data
  } catch (err) {
    console.warn('[market] getAShareIndices failed:', err.message)
    return []
  }
}

const RATES_SYMBOLS = [
  { symbol: '^TNX', name: '10Y美债' },
  { symbol: '^IRX', name: '2Y美债' },
  { symbol: '^VIX', name: 'VIX' },
]

export async function getRatesPanel() {
  if (!isStale('ratesPanel')) return cache.ratesPanel.data
  try {
    const symbols = RATES_SYMBOLS.map((s) => s.symbol)
    const quotes = await quoteMulti(symbols)
    const bySymbol = {}
    quotes.forEach((q) => { if (q?.symbol) bySymbol[q.symbol] = q })
    let tnx = bySymbol['^TNX']?.regularMarketPrice
    let irx = bySymbol['^IRX']?.regularMarketPrice
    const vixQ = bySymbol['^VIX']
    const vix = vixQ?.regularMarketPrice
    const vixPrev = vixQ?.regularMarketPreviousClose ?? vix
    const vixChg = vix != null && vixPrev ? round(((vix - vixPrev) / vixPrev) * 100, 2) : 0
    const data = [
      { name: '10Y美债', value: tnx != null ? round(tnx, 2) + '%' : '-', changePct: 0 },
      { name: '2Y美债', value: irx != null ? round(irx, 2) + '%' : '-', changePct: 0 },
      { name: 'VIX', value: vix != null ? String(round(vix, 1)) : '-', changePct: vixChg },
      { name: '利差10Y-2Y', value: (tnx != null && irx != null) ? Math.round((tnx - irx) * 100) + 'bp' : '-', changePct: 0 },
    ]
    cache.ratesPanel = { data, updatedAt: Date.now() }
    return data
  } catch (err) {
    console.warn('[market] getRatesPanel failed:', err.message)
    return []
  }
}

export async function getCalendar() {
  return []
}
