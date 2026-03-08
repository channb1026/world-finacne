import { hotNews, newsByRegion, mapSpots } from '../data/news.js'

const CACHE_MAX_AGE_SEC = 30

export function registerNewsRoutes(app) {
  app.get('/api/news', async (req, res) => {
    try {
      const region = req.query.region
      const data = region ? await newsByRegion(region) : await hotNews()
      res.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SEC}`)
      res.json(data)
    } catch (err) {
      console.warn('[api] /api/news error:', err.message)
      res.status(500).json([])
    }
  })

  app.get('/api/map-spots', async (_req, res) => {
    try {
      res.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SEC}`)
      res.json(await mapSpots())
    } catch (err) {
      console.warn('[api] /api/map-spots error:', err.message)
      res.status(500).json([])
    }
  })
}
