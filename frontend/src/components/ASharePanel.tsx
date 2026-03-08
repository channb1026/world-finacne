import { useState, useEffect, useRef } from 'react'
// 中国 A 股：指数每 3 秒轮询（与全球股市一致），资讯每 45 秒轮询
import { fetchAShareIndices, fetchAShareNews, POLL_INTERVAL_MARKET, POLL_INTERVAL_NEWS } from '../services/api'
import type { AShareIndex, AShareNewsItem } from '../data/mock'

function formatLastUpdated(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function ASharePanel() {
  const [indices, setIndices] = useState<AShareIndex[]>([])
  const [news, setNews] = useState<AShareNewsItem[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState(false)
  const [newsError, setNewsError] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [flashIndices, setFlashIndices] = useState(false)
  const [flashNews, setFlashNews] = useState(false)
  const marketRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const newsRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedMarketRef = useRef(false)
  const hasLoadedNewsRef = useRef(false)

  const loadMarket = () => {
    fetchAShareIndices()
      .then((data) => {
        if (hasLoadedMarketRef.current) setFlashIndices(true)
        setIndices(data)
        setLastUpdated(new Date())
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => { setLoadedOnce(true); hasLoadedMarketRef.current = true })
  }
  const loadNews = () => {
    fetchAShareNews()
      .then((data) => {
        if (hasLoadedNewsRef.current) setFlashNews(true)
        setNews(Array.isArray(data) ? data : [])
        setLastUpdated(new Date())
        setNewsError(false)
      })
      .catch(() => setNewsError(true))
      .finally(() => { hasLoadedNewsRef.current = true })
  }

  useEffect(() => {
    if (flashIndices) {
      const t = setTimeout(() => setFlashIndices(false), 620)
      return () => clearTimeout(t)
    }
  }, [flashIndices])
  useEffect(() => {
    if (flashNews) {
      const t = setTimeout(() => setFlashNews(false), 620)
      return () => clearTimeout(t)
    }
  }, [flashNews])

  useEffect(() => {
    loadMarket()
    loadNews()
    marketRef.current = setInterval(loadMarket, POLL_INTERVAL_MARKET)
    newsRef.current = setInterval(loadNews, POLL_INTERVAL_NEWS)
    return () => {
      if (marketRef.current) clearInterval(marketRef.current)
      if (newsRef.current) clearInterval(newsRef.current)
    }
  }, [])

  return (
    <div className="panel panel--fill a-share-panel">
      <div className="panel__title">
        中国 A 股
        {lastUpdated && <span className="panel__updated">更新 {formatLastUpdated(lastUpdated)}</span>}
      </div>
      <div className={`a-share-panel__indices ${flashIndices ? 'data-updated-flash' : ''}`}>
        <div className="a-share-panel__subtitle">主要指数</div>
        {indices.length === 0 ? (
          <div className="panel__state a-share-row">
            <span>{!loadedOnce ? '加载中…' : error ? '加载失败' : '暂无数据'}</span>
            {loadedOnce && (
              <button type="button" className="panel__retry" onClick={loadMarket}>重试</button>
            )}
          </div>
        ) : (
          indices.map((idx) => (
            <div key={idx.symbol} className="a-share-row">
              <span className="a-share-row__name">{idx.name}</span>
              <span className="a-share-row__value">{idx.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
              <span className={`a-share-row__chg ${idx.changePct >= 0 ? 'up' : 'down'}`}>
                {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({idx.changePct >= 0 ? '+' : ''}{idx.changePct.toFixed(2)}%)
              </span>
            </div>
          ))
        )}
      </div>
      <div className={`a-share-panel__news ${flashNews ? 'data-updated-flash' : ''}`}>
        <div className="a-share-panel__subtitle">A 股资讯</div>
        <ul className="a-share-news-list">
          {news.length === 0 ? (
            <li className="a-share-news-item">
              <span>{newsError ? '加载失败' : '暂无 A 股资讯（部分 RSS 可能无法连接）'}</span>
              <button type="button" className="panel__retry" onClick={loadNews}>重试</button>
            </li>
          ) : (
            news.map((n) => {
              const href = n.link && n.link.startsWith('http') ? n.link : undefined
              return (
                <li key={n.id} className="a-share-news-item">
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="a-share-news-item__title a-share-news-item__link">
                      {n.title}
                    </a>
                  ) : (
                    <span className="a-share-news-item__title">{n.title}</span>
                  )}
                  <span className="a-share-news-item__meta">{n.source} · {n.time}</span>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
