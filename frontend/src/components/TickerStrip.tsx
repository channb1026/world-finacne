import { useState, useEffect, useRef } from 'react'
import { fetchTicker, POLL_INTERVAL_NEWS, type TickerItem } from '../services/api'

export function TickerStrip() {
  const [items, setItems] = useState<TickerItem[]>([])
  const [error, setError] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  const load = () => {
    fetchTicker()
      .then((data) => {
        if (hasLoadedRef.current) setFlash(true)
        setItems(data)
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
    intervalRef.current = setInterval(load, POLL_INTERVAL_NEWS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (items.length === 0) {
    const msg = !loadedOnce ? '加载中…' : error ? '加载失败' : '暂无数据'
    return (
      <div className="ticker-strip">
        <span className="ticker-strip__label">快讯</span>
        <div className="ticker-strip__viewport ticker-strip__viewport--static">
          <span>{msg}</span>
          {loadedOnce && (
            <button type="button" className="panel__retry" onClick={load}>重试</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`ticker-strip ${flash ? 'data-updated-flash' : ''}`}>
      <span className="ticker-strip__label">快讯</span>
      <div className="ticker-strip__viewport">
        <div className="ticker-strip__track">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="ticker-strip__item">
              {item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="ticker-strip__link">
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
