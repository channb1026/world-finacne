import {
  rates,
  stocks,
  keyMetrics,
  commodities,
  aShareIndices,
  ratesPanel,
  calendar,
} from '../data/market.js'
import { hotNews, aShareNews, tickerTitles, mapSpots } from '../data/news.js'

const CACHE_MARKET_SEC = 3
const CACHE_NEWS_SEC = 45

function cacheHeader(sec) {
  return { 'Cache-Control': `public, max-age=${sec}` }
}

function getSettledValue(result, fallback) {
  return result.status === 'fulfilled' ? result.value : fallback
}

export function registerMarketRoutes(app) {
  app.get('/api/dashboard', async (req, res) => {
    try {
      const requestedScope = req?.query?.scope
      const scope = requestedScope === 'market' || requestedScope === 'news'
        ? requestedScope
        : 'all'
      const [marketResults, newsResults] = await Promise.all([
        scope === 'news'
          ? null
          : Promise.allSettled([
              rates(),
              ratesPanel(),
              stocks(),
              keyMetrics(),
              commodities(),
              aShareIndices(),
            ]),
        scope === 'market'
          ? null
          : Promise.allSettled([
              hotNews(),
              tickerTitles(),
              mapSpots(),
              aShareNews(),
            ]),
      ])

      res.set(cacheHeader(Math.max(CACHE_MARKET_SEC, CACHE_NEWS_SEC)))
      res.json({
        market: {
          rates: getSettledValue(marketResults?.[0] ?? { status: 'rejected' }, []),
          ratesPanel: getSettledValue(marketResults?.[1] ?? { status: 'rejected' }, []),
          stocks: getSettledValue(marketResults?.[2] ?? { status: 'rejected' }, []),
          keyMetrics: getSettledValue(marketResults?.[3] ?? { status: 'rejected' }, []),
          commodities: getSettledValue(marketResults?.[4] ?? { status: 'rejected' }, []),
          aShareIndices: getSettledValue(marketResults?.[5] ?? { status: 'rejected' }, []),
        },
        news: {
          news: getSettledValue(newsResults?.[0] ?? { status: 'rejected' }, []),
          ticker: getSettledValue(newsResults?.[1] ?? { status: 'rejected' }, []),
          mapSpots: getSettledValue(newsResults?.[2] ?? { status: 'rejected' }, []),
          aShareNews: getSettledValue(newsResults?.[3] ?? { status: 'rejected' }, []),
        },
      })
    } catch (err) {
      console.warn('[api] /api/dashboard error:', err.message)
      res.status(500).json({ market: {}, news: {} })
    }
  })

  app.get('/api/rates', async (_req, res) => {
    try {
      res.set(cacheHeader(CACHE_MARKET_SEC))
      res.json(await rates())
    } catch (err) {
      console.warn('[api] /api/rates error:', err.message)
      res.status(500).json([])
    }
  })

  app.get('/api/rates-panel', async (_req, res) => {
    try {
      res.set(cacheHeader(CACHE_MARKET_SEC))
      res.json(await ratesPanel())
    } catch (err) {
      console.warn('[api] /api/rates-panel error:', err.message)
      res.status(500).json([])
    }
  })

  app.get('/api/stocks', async (_req, res) => {
    try {
      res.set(cacheHeader(CACHE_MARKET_SEC))
      res.json(await stocks())
    } catch (err) {
      console.warn('[api] /api/stocks error:', err.message)
      res.status(500).json([])
    }
  })

  app.get('/api/key-metrics', async (_req, res) => {
    try {
      res.set(cacheHeader(CACHE_MARKET_SEC))
      res.json(await keyMetrics())
    } catch (err) {
      console.warn('[api] /api/key-metrics error:', err.message)
      res.status(500).json([])
    }
  })

  app.get('/api/commodities', async (_req, res) => {
    try {
      res.set(cacheHeader(CACHE_MARKET_SEC))
      res.json(await commodities())
    } catch (err) {
      console.warn('[api] /api/commodities error:', err.message)
      res.status(500).json([])
    }
  })

  app.get('/api/a-share/indices', async (_req, res) => {
    try {
      res.set(cacheHeader(CACHE_MARKET_SEC))
      res.json(await aShareIndices())
    } catch (err) {
      console.warn('[api] /api/a-share/indices error:', err.message)
      res.status(500).json([])
    }
  })

  app.get('/api/a-share/news', async (_req, res) => {
    try {
      res.set(cacheHeader(CACHE_NEWS_SEC))
      res.json(await aShareNews())
    } catch (err) {
      console.warn('[api] /api/a-share/news error:', err.message)
      res.status(500).json([])
    }
  })

  app.get('/api/ticker', async (_req, res) => {
    try {
      res.set(cacheHeader(CACHE_NEWS_SEC))
      res.json(await tickerTitles())
    } catch (err) {
      console.warn('[api] /api/ticker error:', err.message)
      res.status(500).json([])
    }
  })

  app.get('/api/calendar', async (_req, res) => {
    try {
      const lang = _req.query.lang === 'zh' ? 'zh' : 'en'
      res.set(cacheHeader(CACHE_NEWS_SEC))
      res.json(await calendar(lang))
    } catch (err) {
      console.warn('[api] /api/calendar error:', err.message)
      res.status(500).json([])
    }
  })
}
