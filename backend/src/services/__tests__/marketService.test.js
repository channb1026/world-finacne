/**
 * 行情服务关键单测：getRatesPanel 映射项、snapshot 多接口复用。
 * 使用 mock 避免依赖真实 Yahoo 网络。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const MOCK_BY_SYMBOL = {
  '^TNX': { symbol: '^TNX', regularMarketPrice: 4.5, regularMarketPreviousClose: 4.4 },
  '^IRX': { symbol: '^IRX', regularMarketPrice: 5.2, regularMarketPreviousClose: 5.1 },
  '^VIX': { symbol: '^VIX', regularMarketPrice: 15, regularMarketPreviousClose: 14 },
  'USDCNY=X': { symbol: 'USDCNY=X', regularMarketPrice: 7.25, regularMarketPreviousClose: 7.24 },
  'EURCNY=X': { symbol: 'EURCNY=X', regularMarketPrice: 7.8, regularMarketPreviousClose: 7.79 },
  'JPYCNY=X': { symbol: 'JPYCNY=X', regularMarketPrice: 0.048, regularMarketPreviousClose: 0.047 },
  'GBPCNY=X': { symbol: 'GBPCNY=X', regularMarketPrice: 9.1, regularMarketPreviousClose: 9.09 },
  'HKDCNY=X': { symbol: 'HKDCNY=X', regularMarketPrice: 0.93, regularMarketPreviousClose: 0.92 },
  'AUDCNY=X': { symbol: 'AUDCNY=X', regularMarketPrice: 4.7, regularMarketPreviousClose: 4.69 },
  'CADCNY=X': { symbol: 'CADCNY=X', regularMarketPrice: 5.3, regularMarketPreviousClose: 5.29 },
  '000001.SS': { symbol: '000001.SS', regularMarketPrice: 3200, regularMarketPreviousClose: 3180 },
  '399001.SZ': { symbol: '399001.SZ', regularMarketPrice: 10500, regularMarketPreviousClose: 10480 },
  '^HSI': { symbol: '^HSI', regularMarketPrice: 18000, regularMarketPreviousClose: 17900 },
  '^DJI': { symbol: '^DJI', regularMarketPrice: 40000, regularMarketPreviousClose: 39800 },
  '^IXIC': { symbol: '^IXIC', regularMarketPrice: 16500, regularMarketPreviousClose: 16400 },
  '^GSPC': { symbol: '^GSPC', regularMarketPrice: 5200, regularMarketPreviousClose: 5180 },
  '^N225': { symbol: '^N225', regularMarketPrice: 38500, regularMarketPreviousClose: 38400 },
  '^GDAXI': { symbol: '^GDAXI', regularMarketPrice: 18200, regularMarketPreviousClose: 18100 },
  '^FTSE': { symbol: '^FTSE', regularMarketPrice: 7650, regularMarketPreviousClose: 7640 },
  '^FCHI': { symbol: '^FCHI', regularMarketPrice: 8000, regularMarketPreviousClose: 7980 },
  '^KS11': { symbol: '^KS11', regularMarketPrice: 2650, regularMarketPreviousClose: 2640 },
  '^BSESN': { symbol: '^BSESN', regularMarketPrice: 72000, regularMarketPreviousClose: 71800 },
  'CL=F': { symbol: 'CL=F', regularMarketPrice: 75, regularMarketPreviousClose: 74 },
  'GC=F': { symbol: 'GC=F', regularMarketPrice: 2650, regularMarketPreviousClose: 2640 },
  'BZ=F': { symbol: 'BZ=F', regularMarketPrice: 80, regularMarketPreviousClose: 79 },
  'SI=F': { symbol: 'SI=F', regularMarketPrice: 32, regularMarketPreviousClose: 31 },
  'DX-Y.NYB': { symbol: 'DX-Y.NYB', regularMarketPrice: 104, regularMarketPreviousClose: 103 },
}

let yahooQuoteCallCount = 0
const yahooQuoteMock = vi.fn()
const fetchMock = vi.fn()
vi.mock('yahoo-finance2', () => ({
  default: class MockYahooFinance {
    async quote(syms) {
      yahooQuoteCallCount += 1
      return yahooQuoteMock(syms)
    }
  },
}))

describe('marketService', () => {
  beforeEach(() => {
    vi.resetModules()
    yahooQuoteCallCount = 0
    yahooQuoteMock.mockReset()
    yahooQuoteMock.mockImplementation((syms) => {
      const list = Array.isArray(syms) ? syms : [syms]
      return list.map((s) => MOCK_BY_SYMBOL[s] ?? { symbol: s, regularMarketPrice: 1, regularMarketPreviousClose: 1 })
    })
    fetchMock.mockReset()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(0)
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('getRates、getStocks、getKeyMetrics 共享 snapshot，Yahoo 只调一次', async () => {
    const market = await import('../marketService.js')
    const [rates, stocks, metrics] = await Promise.all([
      market.getRates(),
      market.getStocks(),
      market.getKeyMetrics(),
    ])
    expect(rates.length).toBeGreaterThan(0)
    expect(stocks.length).toBeGreaterThan(0)
    expect(metrics.length).toBeGreaterThan(0)
    expect(yahooQuoteCallCount).toBe(1)
  })

  it('getRatesPanel 返回 3M美债、利差10Y-3M 等关键映射项', async () => {
    const { getRatesPanel } = await import('../marketService.js')
    const panel = await getRatesPanel()
    const names = panel.map((p) => p.name)
    expect(names).toContain('10Y美债')
    expect(names).toContain('3M美债')
    expect(names).toContain('VIX')
    expect(names).toContain('利差10Y-3M')

    const spread = panel.find((p) => p.name === '利差10Y-3M')
    expect(spread).toBeDefined()
    expect(spread?.value).toMatch(/\d+bp|^-$/)
  })

  it('getCalendar 返回真实接口格式化后的经济事件', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          CalendarId: 1,
          Date: '1970-01-01T01:00:00.000Z',
          Country: 'United States',
          Event: 'CPI YoY',
          Actual: '3.2%',
          Forecast: '3.1%',
          Previous: '3.0%',
          Importance: 3,
          Currency: 'USD',
        },
      ]),
    })

    const { getCalendar } = await import('../marketService.js')
    const events = await getCalendar('en')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(events).toEqual([
      {
        id: '1',
        dateTime: '1970-01-01T01:00:00.000Z',
        country: 'United States',
        event: 'CPI YoY',
        actual: '3.2%',
        forecast: '3.1%',
        previous: '3.0%',
        importance: 3,
        currency: 'USD',
      },
    ])
  })

  it('getCalendar 在上游挂起时会超时返回，避免单飞永久阻塞', async () => {
    fetchMock.mockImplementation((_url, options = {}) => (
      new Promise((_, reject) => {
        options.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      })
    ))

    const { getCalendar } = await import('../marketService.js')
    const eventsPromise = getCalendar('zh')

    await vi.advanceTimersByTimeAsync(15 * 1000)
    await expect(eventsPromise).resolves.toEqual([])
  })

  it('Frankfurter fallback 请求带超时 signal，避免备用源挂死', async () => {
    yahooQuoteMock.mockImplementation(() => {
      const list = Array.from({ length: 31 }, (_, index) => ({
        symbol: index === 0 ? '000001.SS' : `SYM${index}`,
        regularMarketPrice: 1,
        regularMarketPreviousClose: 1,
      }))
      return list
    })
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        rates: { CNY: 7.2, EUR: 0.93, JPY: 157, GBP: 0.79, HKD: 7.8, AUD: 1.52, CAD: 1.36 },
      }),
    })

    const { getRates } = await import('../marketService.js')
    await getRates()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('frankfurter.app/latest'),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('snapshot 刷新超时后不会永久卡住后续请求', async () => {
    yahooQuoteMock.mockImplementationOnce(() => new Promise(() => {}))

    const market = await import('../marketService.js')
    const ratesPromise = market.getRates()
    await vi.advanceTimersByTimeAsync(8 * 1000)
    await expect(ratesPromise).resolves.toEqual([])

    await vi.advanceTimersByTimeAsync(15 * 1000)
    const stocks = await market.getStocks()
    expect(Array.isArray(stocks)).toBe(true)
    expect(yahooQuoteCallCount).toBe(2)
  })

  it('snapshot 失败后会进入短暂退避，避免立即重试 Yahoo', async () => {
    yahooQuoteMock.mockRejectedValueOnce(new Error('yahoo down'))

    const market = await import('../marketService.js')
    const first = await market.getRates()
    const second = await market.getRates()

    expect(first).toEqual([])
    expect(second).toEqual([])
    expect(yahooQuoteCallCount).toBe(1)

    await vi.advanceTimersByTimeAsync(15 * 1000)
    await market.getRates()
    expect(yahooQuoteCallCount).toBe(2)
  })
})
