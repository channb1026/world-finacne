import express from 'express'
import cors from 'cors'
import { pathToFileURL } from 'url'
import { registerNewsRoutes } from './routes/news.js'
import { registerMarketRoutes } from './routes/market.js'
import { startMarketBackgroundRefresh } from './services/marketService.js'
import { startNewsBackgroundRefresh } from './services/newsService.js'
import { createCorsOptions, createRateLimiter } from './security.js'
import { getSourceStatuses } from './sourceStatus.js'

export function createApp({ startBackgroundRefresh = true } = {}) {
  const app = express()

  app.use(cors(createCorsOptions()))
  app.use(createRateLimiter())
  app.use(express.json())

  registerNewsRoutes(app)
  registerMarketRoutes(app)

  if (startBackgroundRefresh) {
    startMarketBackgroundRefresh()
    startNewsBackgroundRefresh()
  }

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: Date.now() })
  })

  app.get('/api/source-health', (_req, res) => {
    res.json({
      ok: true,
      ts: Date.now(),
      sources: getSourceStatuses(),
    })
  })

  return app
}

const entryHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : ''

if (import.meta.url === entryHref) {
  const app = createApp()
  const PORT = process.env.PORT ?? 3000

  app.listen(PORT, () => {
    console.log(`Backend API http://localhost:${PORT} (GET /api/health, /api/news, /api/map-spots, /api/rates, ... /api/calendar)`)
  })
}
