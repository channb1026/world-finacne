import express from 'express'
import cors from 'cors'
import { registerNewsRoutes } from './routes/news.js'
import { registerMarketRoutes } from './routes/market.js'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(cors())
app.use(express.json())

registerNewsRoutes(app)
registerMarketRoutes(app)

app.listen(PORT, () => {
  console.log(`Backend API http://localhost:${PORT} (GET /api/news, /api/map-spots, /api/rates, /api/rates-panel, /api/stocks, /api/key-metrics, /api/commodities, /api/a-share/indices, /api/a-share/news, /api/ticker, /api/calendar)`)
})
