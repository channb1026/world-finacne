import {
  rates,
  stocks,
  keyMetrics,
  commodities,
  aShareIndices,
  ratesPanel,
  calendar,
} from '../data/market.js'
import { aShareNews, tickerTitles } from '../data/news.js'

const CACHE_MARKET_SEC = 3
const CACHE_NEWS_SEC = 45

function cacheHeader(sec) {
  return { 'Cache-Control': `public, max-age=${sec}` }
}

export function registerMarketRoutes(app) {
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
      res.set(cacheHeader(CACHE_NEWS_SEC))
      res.json(await calendar())
    } catch (err) {
      res.status(500).json([])
    }
  })
}
