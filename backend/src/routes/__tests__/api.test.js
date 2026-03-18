import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockNewsByRegion,
  mockHotNews,
  mockMapSpots,
  mockAShareNews,
  mockTickerTitles,
  mockRates,
  mockRatesPanel,
  mockStocks,
  mockKeyMetrics,
  mockCommodities,
  mockAShareIndices,
  mockCalendar,
} = vi.hoisted(() => ({
  mockNewsByRegion: vi.fn(),
  mockHotNews: vi.fn(),
  mockMapSpots: vi.fn(),
  mockAShareNews: vi.fn(),
  mockTickerTitles: vi.fn(),
  mockRates: vi.fn(),
  mockRatesPanel: vi.fn(),
  mockStocks: vi.fn(),
  mockKeyMetrics: vi.fn(),
  mockCommodities: vi.fn(),
  mockAShareIndices: vi.fn(),
  mockCalendar: vi.fn(),
}))

vi.mock('../../data/news.js', () => ({
  hotNews: mockHotNews,
  newsByRegion: mockNewsByRegion,
  mapSpots: mockMapSpots,
  aShareNews: mockAShareNews,
  tickerTitles: mockTickerTitles,
}))

vi.mock('../../data/market.js', () => ({
  rates: mockRates,
  ratesPanel: mockRatesPanel,
  stocks: mockStocks,
  keyMetrics: mockKeyMetrics,
  commodities: mockCommodities,
  aShareIndices: mockAShareIndices,
  calendar: mockCalendar,
}))

import { registerNewsRoutes } from '../news.js'
import { registerMarketRoutes } from '../market.js'
import { createApp } from '../../index.js'

function createAppHarness() {
  const routes = {}
  return {
    routes,
    app: {
      get(path, handler) {
        routes[path] = handler
      },
    },
  }
}

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    set(field, value) {
      if (typeof field === 'string') {
        this.headers[field] = value
      } else {
        Object.assign(this.headers, field)
      }
      return this
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

describe('api routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockHotNews.mockResolvedValue([{ id: 'hot-1', title: 'Hot', source: 'Mock', time: 'now', category: '宏观', tags: [], marketScope: 'global' }])
    mockNewsByRegion.mockResolvedValue([{ id: 'region-1', title: 'Region', source: 'Mock', time: 'now', category: '地缘/政策', tags: [], marketScope: 'global' }])
    mockMapSpots.mockResolvedValue([{ id: 'US', name: '美国', lat: 1, lng: 2, count: 3 }])
    mockAShareNews.mockResolvedValue([{ id: 'ashare-1', title: 'A Share', source: 'Mock', time: 'now', category: 'A股盘面', tags: ['A股'], marketScope: 'a_share' }])
    mockTickerTitles.mockResolvedValue([{ title: 'Ticker', link: 'https://example.com' }])

    mockRates.mockResolvedValue([{ pair: 'USD/CNY', rate: 7.2, change: 0.01, changePct: 0.1 }])
    mockRatesPanel.mockResolvedValue([{ name: 'VIX', value: '15', changePct: -0.2 }])
    mockStocks.mockResolvedValue([{ name: '纳斯达克', symbol: '^IXIC', value: 1, change: 1, changePct: 1 }])
    mockKeyMetrics.mockResolvedValue([{ name: 'VIX', value: '15', changePct: -0.2 }])
    mockCommodities.mockResolvedValue([{ name: '黄金', value: 2000, unit: '美元/盎司', changePct: 0.5 }])
    mockAShareIndices.mockResolvedValue([{ name: '上证指数', symbol: '000001.SS', value: 1, change: 1, changePct: 1 }])
    mockCalendar.mockResolvedValue([])
  })

  it('GET /api/news?region=US returns region data with cache header', async () => {
    const { app, routes } = createAppHarness()
    registerNewsRoutes(app)
    const res = createRes()

    await routes['/api/news']({ query: { region: 'US' } }, res)

    expect(res.statusCode).toBe(200)
    expect(res.headers['Cache-Control']).toContain('max-age=30')
    expect(res.body).toEqual([{ id: 'region-1', title: 'Region', source: 'Mock', time: 'now', category: '地缘/政策', tags: [], marketScope: 'global' }])
    expect(mockNewsByRegion).toHaveBeenCalledWith('US')
  })

  it('GET /api/dashboard aggregates market and news payloads', async () => {
    const { app, routes } = createAppHarness()
    registerMarketRoutes(app)
    const res = createRes()

    await routes['/api/dashboard']({}, res)

    expect(res.statusCode).toBe(200)
    expect(res.headers['Cache-Control']).toContain('max-age=45')
    expect(res.body.market.rates).toHaveLength(1)
    expect(res.body.market.ratesPanel).toHaveLength(1)
    expect(res.body.news.news).toHaveLength(1)
    expect(res.body.news.ticker).toHaveLength(1)
    expect(res.body.news.mapSpots).toHaveLength(1)
    expect(res.body.news.aShareNews).toHaveLength(1)
  })

  it('GET /api/news falls back to hotNews when region is absent', async () => {
    const { app, routes } = createAppHarness()
    registerNewsRoutes(app)
    const res = createRes()

    await routes['/api/news']({ query: {} }, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([{ id: 'hot-1', title: 'Hot', source: 'Mock', time: 'now', category: '宏观', tags: [], marketScope: 'global' }])
    expect(mockHotNews).toHaveBeenCalledTimes(1)
    expect(mockNewsByRegion).not.toHaveBeenCalled()
  })

  it('GET /api/calendar forwards lang to data layer', async () => {
    const { app, routes } = createAppHarness()
    registerMarketRoutes(app)
    const res = createRes()
    mockCalendar.mockResolvedValue([{ id: 'cal-1' }])

    await routes['/api/calendar']({ query: { lang: 'zh' } }, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([{ id: 'cal-1' }])
    expect(mockCalendar).toHaveBeenCalledWith('zh')
  })

  it('createApp exposes /api/source-health', async () => {
    const app = createApp({ startBackgroundRefresh: false })
    const layer = app._router.stack.find((entry) => entry.route?.path === '/api/source-health')
    const handler = layer.route.stack[0].handle
    const res = createRes()

    await handler({}, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.sources)).toBe(true)
  })
})
