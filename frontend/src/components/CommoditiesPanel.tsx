import { useState, useEffect, useRef } from 'react'
import { fetchCommodities, POLL_INTERVAL_MARKET } from '../services/api'
import type { Commodity } from '../data/mock'

function formatLastUpdated(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function CommoditiesPanel() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  const load = () => {
    fetchCommodities()
      .then((data) => {
        if (hasLoadedRef.current) setFlash(true)
        setCommodities(data)
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

  if (commodities.length === 0) {
    const msg = !loadedOnce ? '加载中…' : error ? '加载失败' : '暂无数据'
    return (
      <div className="panel panel--min-height">
        <div className="panel__title">大宗商品</div>
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
    <div className="panel">
      <div className="panel__title">
        大宗商品
        {lastUpdated && <span className="panel__updated">更新 {formatLastUpdated(lastUpdated)}</span>}
      </div>
      <div className="panel__subtitle">主要品种</div>
      <div className={flash ? 'data-updated-flash' : ''}>
      {commodities.map((c) => (
        <div key={c.name} className="commodity-row">
          <span className="commodity-row__name">{c.name}</span>
          <span className="commodity-row__value">
            {typeof c.value === 'number' && c.value > 1000 ? c.value.toLocaleString() : c.value}
          </span>
          <span className="commodity-row__unit">{c.unit}</span>
          <span className={`commodity-row__chg ${c.changePct >= 0 ? 'up' : 'down'}`}>
            {c.changePct >= 0 ? '+' : ''}{c.changePct}%
          </span>
        </div>
      ))}
      </div>
    </div>
  )
}
