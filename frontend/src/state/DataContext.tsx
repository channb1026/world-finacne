/* eslint-disable react-refresh/only-export-components */
/**
 * 共享数据轮询层：market 3s、news 45s，页面隐藏时暂停。
 * 各面板订阅 Context，不再各自 setInterval。
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import {
  fetchRates,
  fetchStocks,
  fetchKeyMetrics,
  fetchCommodities,
  fetchRatesPanel,
  fetchAShareIndices,
  fetchNews,
  fetchTicker,
  fetchMapSpots,
  fetchAShareNews,
  fetchDashboard,
  type DashboardPayload,
} from '../services/api'
import type {
  FxPair,
  StockIndex,
  KeyMetric,
  Commodity,
  RateItem,
  AShareIndex,
  NewsItem,
  MapSpot,
  AShareNewsItem,
} from '../data/mock'
import type { TickerItem } from '../services/api'

const MARKET_MS = 3 * 1000
const NEWS_MS = 45 * 1000

export interface DataState {
  rates: FxPair[]
  ratesPanel: RateItem[]
  stocks: StockIndex[]
  keyMetrics: KeyMetric[]
  commodities: Commodity[]
  aShareIndices: AShareIndex[]
  news: NewsItem[]
  ticker: TickerItem[]
  mapSpots: MapSpot[]
  aShareNews: AShareNewsItem[]
  lastUpdated: { market: Date | null; news: Date | null }
  error: {
    rates: boolean
    ratesPanel: boolean
    stocks: boolean
    keyMetrics: boolean
    commodities: boolean
    aShareIndices: boolean
    news: boolean
    ticker: boolean
    mapSpots: boolean
    aShareNews: boolean
  }
  loaded: {
    rates: boolean
    ratesPanel: boolean
    stocks: boolean
    keyMetrics: boolean
    commodities: boolean
    aShareIndices: boolean
    news: boolean
    ticker: boolean
    mapSpots: boolean
    aShareNews: boolean
  }
}

const initial: DataState = {
  rates: [],
  ratesPanel: [],
  stocks: [],
  keyMetrics: [],
  commodities: [],
  aShareIndices: [],
  news: [],
  ticker: [],
  mapSpots: [],
  aShareNews: [],
  lastUpdated: { market: null, news: null },
  error: {
    rates: false,
    ratesPanel: false,
    stocks: false,
    keyMetrics: false,
    commodities: false,
    aShareIndices: false,
    news: false,
    ticker: false,
    mapSpots: false,
    aShareNews: false,
  },
  loaded: {
    rates: false,
    ratesPanel: false,
    stocks: false,
    keyMetrics: false,
    commodities: false,
    aShareIndices: false,
    news: false,
    ticker: false,
    mapSpots: false,
    aShareNews: false,
  },
}

const DataContext = createContext<{
  data: DataState
  refreshMarket: () => void
  refreshNews: () => void
  isVisible: boolean
}>({
  data: initial,
  refreshMarket: () => {},
  refreshNews: () => {},
  isVisible: true,
})

function loadMarket(set: React.Dispatch<React.SetStateAction<DataState>>) {
  const now = new Date()
  Promise.allSettled([
    fetchRates(),
    fetchRatesPanel(),
    fetchStocks(),
    fetchKeyMetrics(),
    fetchCommodities(),
    fetchAShareIndices(),
  ]).then((results) => {
    set((prev) => {
      const [ratesR, ratesPanelR, stocksR, keyMetricsR, commoditiesR, aShareIndicesR] = results
      const next: DataState = { ...prev }

      if (ratesR.status === 'fulfilled') {
        next.rates = Array.isArray(ratesR.value) ? ratesR.value : []
        next.error.rates = false
        next.loaded.rates = true
      } else {
        next.error.rates = true
        next.loaded.rates = true
      }

      if (ratesPanelR.status === 'fulfilled') {
        next.ratesPanel = Array.isArray(ratesPanelR.value) ? ratesPanelR.value : []
        next.error.ratesPanel = false
        next.loaded.ratesPanel = true
      } else {
        next.error.ratesPanel = true
        next.loaded.ratesPanel = true
      }

      if (stocksR.status === 'fulfilled') {
        next.stocks = Array.isArray(stocksR.value) ? stocksR.value : []
        next.error.stocks = false
        next.loaded.stocks = true
      } else {
        next.error.stocks = true
        next.loaded.stocks = true
      }

      if (keyMetricsR.status === 'fulfilled') {
        next.keyMetrics = Array.isArray(keyMetricsR.value) ? keyMetricsR.value : []
        next.error.keyMetrics = false
        next.loaded.keyMetrics = true
      } else {
        next.error.keyMetrics = true
        next.loaded.keyMetrics = true
      }

      if (commoditiesR.status === 'fulfilled') {
        next.commodities = Array.isArray(commoditiesR.value) ? commoditiesR.value : []
        next.error.commodities = false
        next.loaded.commodities = true
      } else {
        next.error.commodities = true
        next.loaded.commodities = true
      }

      if (aShareIndicesR.status === 'fulfilled') {
        next.aShareIndices = Array.isArray(aShareIndicesR.value) ? aShareIndicesR.value : []
        next.error.aShareIndices = false
        next.loaded.aShareIndices = true
      } else {
        next.error.aShareIndices = true
        next.loaded.aShareIndices = true
      }

      // 若至少有一类成功，更新 market 时间戳
      if (
        [ratesR, ratesPanelR, stocksR, keyMetricsR, commoditiesR, aShareIndicesR].some(
          (r) => r.status === 'fulfilled'
        )
      ) {
        next.lastUpdated = { ...next.lastUpdated, market: now }
      }

      return next
    })
  })
}

function loadNews(set: React.Dispatch<React.SetStateAction<DataState>>) {
  const now = new Date()
  Promise.allSettled([fetchNews(), fetchTicker(), fetchMapSpots(), fetchAShareNews()]).then((results) => {
    set((prev) => {
      const [newsR, tickerR, mapSpotsR, aShareNewsR] = results
      const next: DataState = { ...prev }

      if (newsR.status === 'fulfilled') {
        next.news = Array.isArray(newsR.value) ? newsR.value : []
        next.error.news = false
        next.loaded.news = true
      } else {
        next.error.news = true
        next.loaded.news = true
      }
      if (tickerR.status === 'fulfilled') {
        next.ticker = Array.isArray(tickerR.value) ? tickerR.value : []
        next.error.ticker = false
        next.loaded.ticker = true
      } else {
        next.error.ticker = true
        next.loaded.ticker = true
      }
      if (mapSpotsR.status === 'fulfilled') {
        next.mapSpots = Array.isArray(mapSpotsR.value) ? mapSpotsR.value : []
        next.error.mapSpots = false
        next.loaded.mapSpots = true
      } else {
        next.error.mapSpots = true
        next.loaded.mapSpots = true
      }
      if (aShareNewsR.status === 'fulfilled') {
        next.aShareNews = Array.isArray(aShareNewsR.value) ? aShareNewsR.value : []
        next.error.aShareNews = false
        next.loaded.aShareNews = true
      } else {
        next.error.aShareNews = true
        next.loaded.aShareNews = true
      }

      // 若至少有一类成功，更新 news 时间戳
      if (
        [newsR, tickerR, mapSpotsR, aShareNewsR].some(
          (r) => r.status === 'fulfilled'
        )
      ) {
        next.lastUpdated = { ...next.lastUpdated, news: now }
      }

      return next
    })
  })
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataState>(initial)
  const [isVisible, setIsVisible] = useState(
    () => (typeof document !== 'undefined' ? document.visibilityState === 'visible' : true)
  )
  const marketTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const newsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshMarket = useCallback(() => loadMarket(setData), [])
  const refreshNews = useCallback(() => loadNews(setData), [])

  useEffect(() => {
    // 首屏优先尝试 /api/dashboard 聚合接口，失败再回退到拆分拉取
    let cancelled = false
    ;(async () => {
      try {
        const dash: DashboardPayload = await fetchDashboard()
        if (cancelled || !dash) return
        setData((prev) => ({
          ...prev,
          rates: Array.isArray(dash.market.rates) ? dash.market.rates : [],
          ratesPanel: Array.isArray(dash.market.ratesPanel) ? dash.market.ratesPanel : [],
          stocks: Array.isArray(dash.market.stocks) ? dash.market.stocks : [],
          keyMetrics: Array.isArray(dash.market.keyMetrics) ? dash.market.keyMetrics : [],
          commodities: Array.isArray(dash.market.commodities) ? dash.market.commodities : [],
          aShareIndices: Array.isArray(dash.market.aShareIndices) ? dash.market.aShareIndices : [],
          news: Array.isArray(dash.news.news) ? dash.news.news : [],
          ticker: Array.isArray(dash.news.ticker) ? dash.news.ticker : [],
          mapSpots: Array.isArray(dash.news.mapSpots) ? dash.news.mapSpots : [],
          aShareNews: Array.isArray(dash.news.aShareNews) ? dash.news.aShareNews : [],
          lastUpdated: { market: new Date(), news: new Date() },
          error: {
            rates: false,
            ratesPanel: false,
            stocks: false,
            keyMetrics: false,
            commodities: false,
            aShareIndices: false,
            news: false,
            ticker: false,
            mapSpots: false,
            aShareNews: false,
          },
          loaded: {
            rates: true,
            ratesPanel: true,
            stocks: true,
            keyMetrics: true,
            commodities: true,
            aShareIndices: true,
            news: true,
            ticker: true,
            mapSpots: true,
            aShareNews: true,
          },
        }))
      } catch {
        if (cancelled) return
        loadMarket(setData)
        loadNews(setData)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      setIsVisible(visible)
      if (!visible) {
        if (marketTimerRef.current) {
          clearInterval(marketTimerRef.current)
          marketTimerRef.current = null
        }
        if (newsTimerRef.current) {
          clearInterval(newsTimerRef.current)
          newsTimerRef.current = null
        }
      } else {
        marketTimerRef.current = setInterval(() => loadMarket(setData), MARKET_MS)
        newsTimerRef.current = setInterval(() => loadNews(setData), NEWS_MS)
      }
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      marketTimerRef.current = setInterval(() => loadMarket(setData), MARKET_MS)
      newsTimerRef.current = setInterval(() => loadNews(setData), NEWS_MS)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (marketTimerRef.current) clearInterval(marketTimerRef.current)
      if (newsTimerRef.current) clearInterval(newsTimerRef.current)
    }
  }, [])

  return (
    <DataContext.Provider value={{ data, refreshMarket, refreshNews, isVisible }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
