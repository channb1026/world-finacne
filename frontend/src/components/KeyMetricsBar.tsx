import { useState, useEffect, useRef } from 'react'
import { fetchKeyMetrics, POLL_INTERVAL_MARKET } from '../services/api'
import type { KeyMetric } from '../data/mock'

function formatLastUpdated(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function KeyMetricsBar() {
  const [metrics, setMetrics] = useState<KeyMetric[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  const load = () => {
    fetchKeyMetrics()
      .then((data) => {
        if (hasLoadedRef.current) setFlash(true)
        setMetrics(data)
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

  if (metrics.length === 0) {
    const msg = !loadedOnce ? '加载中…' : error ? '加载失败' : '暂无数据'
    return (
      <div className="key-metrics-bar">
        <span>{msg}</span>
        {loadedOnce && (
          <button type="button" className="panel__retry" onClick={load}>重试</button>
        )}
      </div>
    )
  }

  return (
    <div className={`key-metrics-bar ${flash ? 'data-updated-flash' : ''}`}>
      {lastUpdated && (
        <span className="key-metrics-bar__updated">更新 {formatLastUpdated(lastUpdated)}</span>
      )}
      {metrics.map((m) => (
        <div key={m.name} className="key-metrics-bar__item">
          <span className="key-metrics-bar__name">{m.name}</span>
          <span className="key-metrics-bar__value">{m.value}</span>
          <span className={`key-metrics-bar__chg ${m.changePct >= 0 ? 'up' : 'down'}`}>
            {m.changePct >= 0 ? '+' : ''}{m.changePct}%
          </span>
        </div>
      ))}
    </div>
  )
}
