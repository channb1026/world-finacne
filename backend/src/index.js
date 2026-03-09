import express from 'express'
import cors from 'cors'
import { registerNewsRoutes } from './routes/news.js'
import { registerMarketRoutes } from './routes/market.js'
import { startMarketBackgroundRefresh } from './services/marketService.js'
import { startNewsBackgroundRefresh } from './services/newsService.js'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(cors())
app.use(express.json())

registerNewsRoutes(app)
registerMarketRoutes(app)

startMarketBackgroundRefresh()
startNewsBackgroundRefresh()

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() })
})

app.listen(PORT, () => {
  console.log(`Backend API http://localhost:${PORT} (GET /api/health, /api/news, /api/map-spots, /api/rates, ... /api/calendar)`)
})
