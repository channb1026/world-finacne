/**
 * API 调用：所有数据来自后端真实接口，无 mock 回退。
 */

import type {
  NewsItem,
  FxPair,
  StockIndex,
  KeyMetric,
  Commodity,
  AShareIndex,
  AShareNewsItem,
  MapSpot,
  RateItem,
  RegionId,
} from '../types/data'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'
const API_TIMEOUT_MS = 12 * 1000

export const POLL_INTERVAL_NEWS = 45 * 1000
export const POLL_INTERVAL_MARKET = 3 * 1000

async function fetchApi<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  const abortHandler = () => controller.abort()

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeout)
      controller.abort()
    } else {
      signal.addEventListener('abort', abortHandler, { once: true })
    }
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
    if (signal) signal.removeEventListener('abort', abortHandler)
  }
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export async function fetchNewsByRegion(region: RegionId, signal?: AbortSignal): Promise<NewsItem[]> {
  const data = await fetchApi<NewsItem[]>(`/news?region=${region}`, signal)
  return Array.isArray(data) ? data : []
}

export interface TickerItem {
  title: string
  link?: string
}

export interface CalendarEvent {
  id: string
  dateTime: string
  country: string
  event: string
  actual?: string
  forecast?: string
  previous?: string
  importance: number
  currency?: string
}

export async function fetchCalendar(locale: 'zh' | 'en', signal?: AbortSignal): Promise<CalendarEvent[]> {
  const data = await fetchApi<CalendarEvent[]>(`/calendar?lang=${locale}`, signal)
  return Array.isArray(data) ? data : []
}

export interface SourceHealthItem {
  key: string
  name: string
  category: string
  status: 'up' | 'down' | 'unknown'
  message: string
  lastSuccessAt: string | null
  lastFailureAt: string | null
  meta?: Record<string, string | number | boolean | null | undefined>
}

export interface SourceHealthPayload {
  ok: boolean
  ts: number
  sources: SourceHealthItem[]
}

export async function fetchSourceHealth(signal?: AbortSignal): Promise<SourceHealthPayload> {
  return fetchApi<SourceHealthPayload>('/source-health', signal)
}

export interface DashboardPayload {
  market: {
    rates: FxPair[]
    ratesPanel: RateItem[]
    stocks: StockIndex[]
    keyMetrics: KeyMetric[]
    commodities: Commodity[]
    aShareIndices: AShareIndex[]
  }
  news: {
    news: NewsItem[]
    ticker: TickerItem[]
    mapSpots: MapSpot[]
    aShareNews: AShareNewsItem[]
  }
}

export async function fetchDashboard(signal?: AbortSignal, scope: 'all' | 'market' | 'news' = 'all'): Promise<DashboardPayload> {
  const suffix = scope === 'all' ? '' : `?scope=${scope}`
  const data = await fetchApi<DashboardPayload>(`/dashboard${suffix}`, signal)
  if (!data || typeof data !== 'object') {
    return {
      market: { rates: [], ratesPanel: [], stocks: [], keyMetrics: [], commodities: [], aShareIndices: [] },
      news: { news: [], ticker: [], mapSpots: [], aShareNews: [] },
    }
  }

  return {
    market: {
      rates: Array.isArray(data.market?.rates) ? data.market.rates : [],
      ratesPanel: Array.isArray(data.market?.ratesPanel) ? data.market.ratesPanel : [],
      stocks: Array.isArray(data.market?.stocks) ? data.market.stocks : [],
      keyMetrics: Array.isArray(data.market?.keyMetrics) ? data.market.keyMetrics : [],
      commodities: Array.isArray(data.market?.commodities) ? data.market.commodities : [],
      aShareIndices: Array.isArray(data.market?.aShareIndices) ? data.market.aShareIndices : [],
    },
    news: {
      news: Array.isArray(data.news?.news) ? data.news.news : [],
      ticker: Array.isArray(data.news?.ticker) ? data.news.ticker : [],
      mapSpots: Array.isArray(data.news?.mapSpots) ? data.news.mapSpots : [],
      aShareNews: Array.isArray(data.news?.aShareNews) ? data.news.aShareNews : [],
    },
  }
}
