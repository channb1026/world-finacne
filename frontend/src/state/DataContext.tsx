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
  useMemo,
  type ReactNode,
} from 'react'
import {
  fetchDashboard,
  fetchSourceHealth,
  POLL_INTERVAL_MARKET,
  POLL_INTERVAL_NEWS,
  type DashboardPayload,
  type SourceHealthItem,
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
} from '../types/data'
import type { TickerItem } from '../services/api'

const MARKET_MS = POLL_INTERVAL_MARKET
const NEWS_MS = POLL_INTERVAL_NEWS
const SOURCE_HEALTH_MS = 60 * 1000

type DataSetter = React.Dispatch<React.SetStateAction<DataState>>

function cloneState(prev: DataState): DataState {
  return {
    ...prev,
    lastUpdated: { ...prev.lastUpdated },
    error: { ...prev.error },
    loaded: { ...prev.loaded },
  }
}

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
  sourceHealth: SourceHealthItem[]
  lastUpdated: { market: Date | null; news: Date | null; sourceHealth: Date | null }
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
    sourceHealth: boolean
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
    sourceHealth: boolean
  }
}

export interface MarketDataSlice {
  rates: FxPair[]
  ratesPanel: RateItem[]
  stocks: StockIndex[]
  keyMetrics: KeyMetric[]
  commodities: Commodity[]
  aShareIndices: AShareIndex[]
  lastUpdated: Date | null
  error: Pick<DataState['error'], 'rates' | 'ratesPanel' | 'stocks' | 'keyMetrics' | 'commodities' | 'aShareIndices'>
  loaded: Pick<DataState['loaded'], 'rates' | 'ratesPanel' | 'stocks' | 'keyMetrics' | 'commodities' | 'aShareIndices'>
}

export interface NewsDataSlice {
  news: NewsItem[]
  ticker: TickerItem[]
  mapSpots: MapSpot[]
  aShareNews: AShareNewsItem[]
  lastUpdated: Date | null
  error: Pick<DataState['error'], 'news' | 'ticker' | 'mapSpots' | 'aShareNews'>
  loaded: Pick<DataState['loaded'], 'news' | 'ticker' | 'mapSpots' | 'aShareNews'>
}

export interface SourceHealthDataSlice {
  sourceHealth: SourceHealthItem[]
  lastUpdated: Date | null
  error: Pick<DataState['error'], 'sourceHealth'>
  loaded: Pick<DataState['loaded'], 'sourceHealth'>
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
  sourceHealth: [],
  lastUpdated: { market: null, news: null, sourceHealth: null },
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
    sourceHealth: false,
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
    sourceHealth: false,
  },
}

const MarketDataContext = createContext<MarketDataSlice>({
  rates: initial.rates,
  ratesPanel: initial.ratesPanel,
  stocks: initial.stocks,
  keyMetrics: initial.keyMetrics,
  commodities: initial.commodities,
  aShareIndices: initial.aShareIndices,
  lastUpdated: initial.lastUpdated.market,
  error: initial.error,
  loaded: initial.loaded,
})

const NewsDataContext = createContext<NewsDataSlice>({
  news: initial.news,
  ticker: initial.ticker,
  mapSpots: initial.mapSpots,
  aShareNews: initial.aShareNews,
  lastUpdated: initial.lastUpdated.news,
  error: initial.error,
  loaded: initial.loaded,
})

const DataActionsContext = createContext<{
  refreshMarket: () => void
  refreshNews: () => void
  refreshSourceHealth: () => void
}>({
  refreshMarket: () => {},
  refreshNews: () => {},
  refreshSourceHealth: () => {},
})

const VisibilityContext = createContext(true)
const SourceHealthContext = createContext<SourceHealthDataSlice>({
  sourceHealth: initial.sourceHealth,
  lastUpdated: null,
  error: { sourceHealth: initial.error.sourceHealth },
  loaded: { sourceHealth: initial.loaded.sourceHealth },
})

async function loadMarket(set: DataSetter, signal?: AbortSignal) {
  const now = new Date()
  try {
    const dash = await fetchDashboard(signal, 'market')

    if (signal?.aborted) return

    set((prev) => {
      const next = cloneState(prev)
      next.rates = dash.market.rates
      next.ratesPanel = dash.market.ratesPanel
      next.stocks = dash.market.stocks
      next.keyMetrics = dash.market.keyMetrics
      next.commodities = dash.market.commodities
      next.aShareIndices = dash.market.aShareIndices
      next.error.rates = false
      next.error.ratesPanel = false
      next.error.stocks = false
      next.error.keyMetrics = false
      next.error.commodities = false
      next.error.aShareIndices = false
      next.loaded.rates = true
      next.loaded.ratesPanel = true
      next.loaded.stocks = true
      next.loaded.keyMetrics = true
      next.loaded.commodities = true
      next.loaded.aShareIndices = true
      next.lastUpdated.market = now
      return next
    })
  } catch {
    if (signal?.aborted) return
    set((prev) => {
      const next = cloneState(prev)
      next.error.rates = true
      next.error.ratesPanel = true
      next.error.stocks = true
      next.error.keyMetrics = true
      next.error.commodities = true
      next.error.aShareIndices = true
      next.loaded.rates = true
      next.loaded.ratesPanel = true
      next.loaded.stocks = true
      next.loaded.keyMetrics = true
      next.loaded.commodities = true
      next.loaded.aShareIndices = true
      return next
    })
  }
}

async function loadNews(set: DataSetter, signal?: AbortSignal) {
  const now = new Date()
  try {
    const dash = await fetchDashboard(signal, 'news')

    if (signal?.aborted) return

    set((prev) => {
      const next = cloneState(prev)
      next.news = dash.news.news
      next.ticker = dash.news.ticker
      next.mapSpots = dash.news.mapSpots
      next.aShareNews = dash.news.aShareNews
      next.error.news = false
      next.error.ticker = false
      next.error.mapSpots = false
      next.error.aShareNews = false
      next.loaded.news = true
      next.loaded.ticker = true
      next.loaded.mapSpots = true
      next.loaded.aShareNews = true
      next.lastUpdated.news = now
      return next
    })
  } catch {
    if (signal?.aborted) return
    set((prev) => {
      const next = cloneState(prev)
      next.error.news = true
      next.error.ticker = true
      next.error.mapSpots = true
      next.error.aShareNews = true
      next.loaded.news = true
      next.loaded.ticker = true
      next.loaded.mapSpots = true
      next.loaded.aShareNews = true
      return next
    })
  }
}

async function loadSourceHealth(set: DataSetter, signal?: AbortSignal) {
  const now = new Date()
  try {
    const payload = await fetchSourceHealth(signal)
    if (signal?.aborted) return
    set((prev) => {
      const next = cloneState(prev)
      next.sourceHealth = Array.isArray(payload?.sources) ? payload.sources : []
      next.error.sourceHealth = false
      next.loaded.sourceHealth = true
      next.lastUpdated.sourceHealth = now
      return next
    })
  } catch {
    if (signal?.aborted) return
    set((prev) => {
      const next = cloneState(prev)
      next.error.sourceHealth = true
      next.loaded.sourceHealth = true
      return next
    })
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataState>(initial)
  const [isVisible, setIsVisible] = useState(
    () => (typeof document !== 'undefined' ? document.visibilityState === 'visible' : true)
  )
  const marketTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const newsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sourceHealthTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const marketAbortRef = useRef<AbortController | null>(null)
  const newsAbortRef = useRef<AbortController | null>(null)
  const sourceHealthAbortRef = useRef<AbortController | null>(null)
  const marketInFlightRef = useRef(false)
  const newsInFlightRef = useRef(false)
  const sourceHealthInFlightRef = useRef(false)

  const clearMarketTimer = useCallback(() => {
    if (marketTimerRef.current) {
      clearTimeout(marketTimerRef.current)
      marketTimerRef.current = null
    }
  }, [])

  const clearNewsTimer = useCallback(() => {
    if (newsTimerRef.current) {
      clearTimeout(newsTimerRef.current)
      newsTimerRef.current = null
    }
  }, [])

  const clearSourceHealthTimer = useCallback(() => {
    if (sourceHealthTimerRef.current) {
      clearTimeout(sourceHealthTimerRef.current)
      sourceHealthTimerRef.current = null
    }
  }, [])

  const refreshMarket = useCallback(async () => {
    if (marketInFlightRef.current) return
    marketInFlightRef.current = true
    marketAbortRef.current?.abort()
    const controller = new AbortController()
    marketAbortRef.current = controller
    try {
      await loadMarket(setData, controller.signal)
    } finally {
      if (marketAbortRef.current === controller) {
        marketAbortRef.current = null
      }
      marketInFlightRef.current = false
    }
  }, [])

  const refreshNews = useCallback(async () => {
    if (newsInFlightRef.current) return
    newsInFlightRef.current = true
    newsAbortRef.current?.abort()
    const controller = new AbortController()
    newsAbortRef.current = controller
    try {
      await loadNews(setData, controller.signal)
    } finally {
      if (newsAbortRef.current === controller) {
        newsAbortRef.current = null
      }
      newsInFlightRef.current = false
    }
  }, [])

  const refreshSourceHealth = useCallback(async () => {
    if (sourceHealthInFlightRef.current) return
    sourceHealthInFlightRef.current = true
    sourceHealthAbortRef.current?.abort()
    const controller = new AbortController()
    sourceHealthAbortRef.current = controller
    try {
      await loadSourceHealth(setData, controller.signal)
    } finally {
      if (sourceHealthAbortRef.current === controller) {
        sourceHealthAbortRef.current = null
      }
      sourceHealthInFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    // 首屏优先尝试 /api/dashboard 聚合接口，失败再回退到拆分拉取
    const controller = new AbortController()
    ;(async () => {
      try {
        const dash: DashboardPayload = await fetchDashboard(controller.signal, 'all')
        if (controller.signal.aborted || !dash) return
        setData((prev) => ({
          ...cloneState(prev),
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
          lastUpdated: { market: new Date(), news: new Date(), sourceHealth: null },
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
            sourceHealth: false,
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
            sourceHealth: false,
          },
        }))
      } catch {
        if (controller.signal.aborted) return
        await Promise.allSettled([refreshMarket(), refreshNews(), refreshSourceHealth()])
      }
    })()
    return () => {
      controller.abort()
    }
  }, [refreshMarket, refreshNews, refreshSourceHealth])

  useEffect(() => {
    const scheduleMarket = () => {
      clearMarketTimer()
      marketTimerRef.current = setTimeout(async () => {
        await refreshMarket()
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          scheduleMarket()
        }
      }, MARKET_MS)
    }

    const scheduleNews = () => {
      clearNewsTimer()
      newsTimerRef.current = setTimeout(async () => {
        await refreshNews()
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          scheduleNews()
        }
      }, NEWS_MS)
    }

    const scheduleSourceHealth = () => {
      clearSourceHealthTimer()
      sourceHealthTimerRef.current = setTimeout(async () => {
        await refreshSourceHealth()
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          scheduleSourceHealth()
        }
      }, SOURCE_HEALTH_MS)
    }

    const onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      setIsVisible(visible)
      if (!visible) {
        clearMarketTimer()
        clearNewsTimer()
        clearSourceHealthTimer()
        marketAbortRef.current?.abort()
        newsAbortRef.current?.abort()
        sourceHealthAbortRef.current?.abort()
      } else {
        void refreshMarket()
        void refreshNews()
        void refreshSourceHealth()
        scheduleMarket()
        scheduleNews()
        scheduleSourceHealth()
      }
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      scheduleMarket()
      scheduleNews()
      scheduleSourceHealth()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearMarketTimer()
      clearNewsTimer()
      clearSourceHealthTimer()
      marketAbortRef.current?.abort()
      newsAbortRef.current?.abort()
      sourceHealthAbortRef.current?.abort()
    }
  }, [clearMarketTimer, clearNewsTimer, clearSourceHealthTimer, refreshMarket, refreshNews, refreshSourceHealth])

  const marketValue = useMemo<MarketDataSlice>(
    () => ({
      rates: data.rates,
      ratesPanel: data.ratesPanel,
      stocks: data.stocks,
      keyMetrics: data.keyMetrics,
      commodities: data.commodities,
      aShareIndices: data.aShareIndices,
      lastUpdated: data.lastUpdated.market,
      error: {
        rates: data.error.rates,
        ratesPanel: data.error.ratesPanel,
        stocks: data.error.stocks,
        keyMetrics: data.error.keyMetrics,
        commodities: data.error.commodities,
        aShareIndices: data.error.aShareIndices,
      },
      loaded: {
        rates: data.loaded.rates,
        ratesPanel: data.loaded.ratesPanel,
        stocks: data.loaded.stocks,
        keyMetrics: data.loaded.keyMetrics,
        commodities: data.loaded.commodities,
        aShareIndices: data.loaded.aShareIndices,
      },
    }),
    [
      data.rates,
      data.ratesPanel,
      data.stocks,
      data.keyMetrics,
      data.commodities,
      data.aShareIndices,
      data.lastUpdated.market,
      data.error.rates,
      data.error.ratesPanel,
      data.error.stocks,
      data.error.keyMetrics,
      data.error.commodities,
      data.error.aShareIndices,
      data.loaded.rates,
      data.loaded.ratesPanel,
      data.loaded.stocks,
      data.loaded.keyMetrics,
      data.loaded.commodities,
      data.loaded.aShareIndices,
    ]
  )

  const newsValue = useMemo<NewsDataSlice>(
    () => ({
      news: data.news,
      ticker: data.ticker,
      mapSpots: data.mapSpots,
      aShareNews: data.aShareNews,
      lastUpdated: data.lastUpdated.news,
      error: {
        news: data.error.news,
        ticker: data.error.ticker,
        mapSpots: data.error.mapSpots,
        aShareNews: data.error.aShareNews,
      },
      loaded: {
        news: data.loaded.news,
        ticker: data.loaded.ticker,
        mapSpots: data.loaded.mapSpots,
        aShareNews: data.loaded.aShareNews,
      },
    }),
    [
      data.news,
      data.ticker,
      data.mapSpots,
      data.aShareNews,
      data.lastUpdated.news,
      data.error.news,
      data.error.ticker,
      data.error.mapSpots,
      data.error.aShareNews,
      data.loaded.news,
      data.loaded.ticker,
      data.loaded.mapSpots,
      data.loaded.aShareNews,
    ]
  )

  const actionsValue = useMemo(
    () => ({ refreshMarket, refreshNews, refreshSourceHealth }),
    [refreshMarket, refreshNews, refreshSourceHealth]
  )

  const sourceHealthValue = useMemo<SourceHealthDataSlice>(
    () => ({
      sourceHealth: data.sourceHealth,
      lastUpdated: data.lastUpdated.sourceHealth,
      error: {
        sourceHealth: data.error.sourceHealth,
      },
      loaded: {
        sourceHealth: data.loaded.sourceHealth,
      },
    }),
    [data.sourceHealth, data.lastUpdated.sourceHealth, data.error.sourceHealth, data.loaded.sourceHealth]
  )

  return (
    <VisibilityContext.Provider value={isVisible}>
      <DataActionsContext.Provider value={actionsValue}>
        <MarketDataContext.Provider value={marketValue}>
          <NewsDataContext.Provider value={newsValue}>
            <SourceHealthContext.Provider value={sourceHealthValue}>
              {children}
            </SourceHealthContext.Provider>
          </NewsDataContext.Provider>
        </MarketDataContext.Provider>
      </DataActionsContext.Provider>
    </VisibilityContext.Provider>
  )
}

export function useMarketData() {
  return useContext(MarketDataContext)
}

export function useNewsData() {
  return useContext(NewsDataContext)
}

export function useDataActions() {
  return useContext(DataActionsContext)
}

export function useVisibility() {
  return useContext(VisibilityContext)
}

export function useSourceHealth() {
  return useContext(SourceHealthContext)
}

export function useData() {
  const market = useMarketData()
  const news = useNewsData()
  const sourceHealth = useSourceHealth()
  const actions = useDataActions()
  const isVisible = useVisibility()

  return {
    data: {
      ...market,
      ...news,
      sourceHealth: sourceHealth.sourceHealth,
      lastUpdated: {
        market: market.lastUpdated,
        news: news.lastUpdated,
        sourceHealth: sourceHealth.lastUpdated,
      },
    },
    ...actions,
    isVisible,
  }
}
