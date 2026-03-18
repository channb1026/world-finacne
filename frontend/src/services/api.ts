/**
 * API 调用：所有数据来自后端真实接口，无 mock 回退。
 */

import type { RegionId } from '../data/mock'
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
} from '../data/mock'

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

export async function fetchNews(signal?: AbortSignal): Promise<NewsItem[]> {
  const data = await fetchApi<NewsItem[]>('/news', signal)
  return Array.isArray(data) ? data : []
}

export async function fetchNewsByRegion(region: RegionId, signal?: AbortSignal): Promise<NewsItem[]> {
  const data = await fetchApi<NewsItem[]>(`/news?region=${region}`, signal)
  return Array.isArray(data) ? data : []
}

export async function fetchRates(signal?: AbortSignal): Promise<FxPair[]> {
  const data = await fetchApi<FxPair[]>('/rates', signal)
  return Array.isArray(data) ? data : []
}

export async function fetchRatesPanel(signal?: AbortSignal): Promise<RateItem[]> {
  const data = await fetchApi<RateItem[]>('/rates-panel', signal)
  return Array.isArray(data) ? data : []
}

export async function fetchStocks(signal?: AbortSignal): Promise<StockIndex[]> {
  const data = await fetchApi<StockIndex[]>('/stocks', signal)
  return Array.isArray(data) ? data : []
}

export async function fetchKeyMetrics(signal?: AbortSignal): Promise<KeyMetric[]> {
  const data = await fetchApi<KeyMetric[]>('/key-metrics', signal)
  return Array.isArray(data) ? data : []
}

export async function fetchCommodities(signal?: AbortSignal): Promise<Commodity[]> {
  const data = await fetchApi<Commodity[]>('/commodities', signal)
  return Array.isArray(data) ? data : []
}

export async function fetchAShareIndices(signal?: AbortSignal): Promise<AShareIndex[]> {
  const data = await fetchApi<AShareIndex[]>('/a-share/indices', signal)
  return Array.isArray(data) ? data : []
}

export async function fetchAShareNews(signal?: AbortSignal): Promise<AShareNewsItem[]> {
  const data = await fetchApi<AShareNewsItem[]>('/a-share/news', signal)
  return Array.isArray(data) ? data : []
}

export interface TickerItem {
  title: string
  link?: string
}

export async function fetchTicker(signal?: AbortSignal): Promise<TickerItem[]> {
  const data = await fetchApi<TickerItem[]>('/ticker', signal)
  if (!Array.isArray(data)) return []
  return data.map((x) => (typeof x === 'string' ? { title: x } : { title: x.title, link: x.link }))
}

export async function fetchMapSpots(signal?: AbortSignal): Promise<MapSpot[]> {
  const data = await fetchApi<MapSpot[]>('/map-spots', signal)
  return Array.isArray(data) ? data : []
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

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardPayload> {
  const data = await fetchApi<DashboardPayload>('/dashboard', signal)
  return data
}
