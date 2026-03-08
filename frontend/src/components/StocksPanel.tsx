import { useState, useEffect, useRef } from 'react'
import { fetchStocks, POLL_INTERVAL_MARKET } from '../services/api'
import type { StockIndex } from '../data/mock'

function formatLastUpdated(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function StocksPanel() {
  const [stocks, setStocks] = useState<StockIndex[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  const load = () => {
    fetchStocks()
      .then((data) => {
        if (hasLoadedRef.current) setFlash(true)
        setStocks(data)
        setLastUpdated(new Date())
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => { setLoadedOnce(true); hasLoadedRef.current = true })
  }

  useEffect(() => {
    if (flash) {
      const t = setTimeout(() => setFlash(false), 560)
      return () => clearTimeout(t)
    }
  }, [flash])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, POLL_INTERVAL_MARKET)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (stocks.length === 0) {
    const msg = !loadedOnce ? '加载中…' : error ? '加载失败' : '暂无数据'
    return (
      <div className="panel panel--min-height">
        <div className="panel__title">全球股市</div>
        <div className="panel__state">
          <span>{msg}</span>
          {loadedOnce && (
            <button type="button" className="panel__retry" onClick={load}>重试</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="panel stocks-panel">
      <div className="panel__title">
        全球股市
        {lastUpdated && <span className="panel__updated">更新 {formatLastUpdated(lastUpdated)}</span>}
      </div>
      <div className="panel__subtitle">主要指数</div>
      <div className={`stocks-list ${flash ? 'data-updated-flash' : ''}`}>
        {stocks.map((s) => (
          <div key={s.symbol} className="stock-row">
            <span className="stock-name">{s.name}</span>
            <span className="stock-value">{s.value.toLocaleString()}</span>
            <span className={`stock-change ${s.change >= 0 ? 'up' : 'down'}`}>
              {s.change >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
