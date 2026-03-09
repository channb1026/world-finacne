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

export const POLL_INTERVAL_NEWS = 45 * 1000
export const POLL_INTERVAL_MARKET = 3 * 1000

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export async function fetchNews(): Promise<NewsItem[]> {
  const data = await fetchApi<NewsItem[]>('/news')
  return Array.isArray(data) ? data : []
}

export async function fetchNewsByRegion(region: RegionId): Promise<NewsItem[]> {
  const data = await fetchApi<NewsItem[]>(`/news?region=${region}`)
  return Array.isArray(data) ? data : []
}

export async function fetchRates(): Promise<FxPair[]> {
  const data = await fetchApi<FxPair[]>('/rates')
  return Array.isArray(data) ? data : []
}

export async function fetchRatesPanel(): Promise<RateItem[]> {
  const data = await fetchApi<RateItem[]>('/rates-panel')
  return Array.isArray(data) ? data : []
}

export async function fetchStocks(): Promise<StockIndex[]> {
  const data = await fetchApi<StockIndex[]>('/stocks')
  return Array.isArray(data) ? data : []
}

export async function fetchKeyMetrics(): Promise<KeyMetric[]> {
  const data = await fetchApi<KeyMetric[]>('/key-metrics')
  return Array.isArray(data) ? data : []
}

export async function fetchCommodities(): Promise<Commodity[]> {
  const data = await fetchApi<Commodity[]>('/commodities')
  return Array.isArray(data) ? data : []
}

export async function fetchAShareIndices(): Promise<AShareIndex[]> {
  const data = await fetchApi<AShareIndex[]>('/a-share/indices')
  return Array.isArray(data) ? data : []
}

export async function fetchAShareNews(): Promise<AShareNewsItem[]> {
  const data = await fetchApi<AShareNewsItem[]>('/a-share/news')
  return Array.isArray(data) ? data : []
}

export interface TickerItem {
  title: string
  link?: string
}

export async function fetchTicker(): Promise<TickerItem[]> {
  const data = await fetchApi<TickerItem[]>('/ticker')
  if (!Array.isArray(data)) return []
  return data.map((x) => (typeof x === 'string' ? { title: x } : { title: x.title, link: x.link }))
}

export async function fetchMapSpots(): Promise<MapSpot[]> {
  const data = await fetchApi<MapSpot[]>('/map-spots')
  return Array.isArray(data) ? data : []
}

export interface CalendarEvent {
  date: string
  event: string
  time: string
}

export async function fetchCalendar(): Promise<CalendarEvent[]> {
  const data = await fetchApi<CalendarEvent[]>('/calendar')
  return Array.isArray(data) ? data : []
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

export async function fetchDashboard(): Promise<DashboardPayload> {
  const data = await fetchApi<DashboardPayload>('/dashboard')
  return data
}
