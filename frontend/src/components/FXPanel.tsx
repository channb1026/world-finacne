import { useState, useEffect, useRef } from 'react'
import { fetchRates, POLL_INTERVAL_MARKET } from '../services/api'
import type { FxPair } from '../data/mock'

function formatLastUpdated(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function FXPanel() {
  const [rates, setRates] = useState<FxPair[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  const load = () => {
    fetchRates()
      .then((data) => {
        if (hasLoadedRef.current) setFlash(true)
        setRates(data)
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

  if (rates.length === 0) {
    const msg = !loadedOnce ? '加载中…' : error ? '加载失败' : '暂无数据'
    return (
      <div className="panel panel--min-height">
        <div className="panel__title">关键汇率 · 对人民币</div>
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
        关键汇率 · 对人民币
        {lastUpdated && <span className="panel__updated">更新 {formatLastUpdated(lastUpdated)}</span>}
      </div>
      <div className="panel__subtitle">主要汇率</div>
      <div className={flash ? 'data-updated-flash' : ''}>
      {rates.map((fx) => (
        <div key={fx.pair} className="fx-row">
          <span className="fx-pair">{fx.pair}</span>
          <span className="fx-rate">{fx.rate.toFixed(4)}</span>
          <span className={`fx-change ${fx.change >= 0 ? 'up' : 'down'}`}>
            {fx.change >= 0 ? '+' : ''}{fx.change.toFixed(4)} ({fx.changePct >= 0 ? '+' : ''}{fx.changePct}%)
          </span>
        </div>
      ))}
      </div>
    </div>
  )
}
