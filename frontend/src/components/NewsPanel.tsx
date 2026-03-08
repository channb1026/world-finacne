import { useState, useEffect, useRef } from 'react'
import { fetchNews, POLL_INTERVAL_NEWS } from '../services/api'
import type { NewsItem } from '../data/mock'

function formatLastUpdated(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState(false)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  const load = () => {
    setLoading(true)
    fetchNews()
      .then((data) => {
        if (hasLoadedRef.current) setFlash(true)
        setNews(data)
        setLastUpdated(new Date())
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => { setLoading(false); hasLoadedRef.current = true })
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

  return (
    <div className="panel panel--fill">
      <div className="panel__title">
        热点财经
        {lastUpdated && <span className="panel__updated">更新 {formatLastUpdated(lastUpdated)}</span>}
      </div>
      <div className={`news-list ${flash ? 'data-updated-flash' : ''}`}>
        {loading && news.length === 0 ? (
          <div className="news-item">加载中…</div>
        ) : error && news.length === 0 ? (
          <div className="news-item">加载失败</div>
        ) : (
          news.map((n) => (
            <div key={n.id} className="news-item">
              <div className="news-item__title">
                {n.link ? (
                  <a href={n.link} target="_blank" rel="noopener noreferrer" className="news-item__link">{n.title}</a>
                ) : (
                  n.title
                )}
              </div>
              <div className="news-item__meta">{n.source} · {n.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
