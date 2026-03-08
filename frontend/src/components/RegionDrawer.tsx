import { useState, useEffect, useRef } from 'react'
import type { RegionId } from '../data/mock'
import { MAP_SPOTS_DEFAULT } from '../data/mock'
import { fetchNewsByRegion, POLL_INTERVAL_NEWS } from '../services/api'
import type { NewsItem } from '../data/mock'

interface RegionDrawerProps {
  regionId: RegionId | null
  onClose: () => void
}

export function RegionDrawer({ regionId, onClose }: RegionDrawerProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (!regionId) return
    const load = () => {
      setLoading(true)
      fetchNewsByRegion(regionId)
        .then((data) => { setNews(data) })
        .catch(() => setNews([]))
        .finally(() => setLoading(false))
    }
    load()
    intervalRef.current = setInterval(load, POLL_INTERVAL_NEWS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [regionId])

  if (!regionId) return null
  const region = MAP_SPOTS_DEFAULT.find((s) => s.id === regionId)

  return (
    <div className="region-drawer">
      <div className="region-drawer__head">
        <span className="region-drawer__title">{region?.name ?? regionId} · 地区情报</span>
        <button type="button" className="region-drawer__close" onClick={onClose} aria-label="关闭">
          ×
        </button>
      </div>
      <div className="region-drawer__body">
        <div className="panel__title">该地区资讯</div>
        <div className="region-news">
          {loading ? (
            <div className="news-item">加载中…</div>
          ) : news.length ? (
            news.map((n) => {
              const href = n.link && n.link.startsWith('http') ? n.link : undefined
              return (
                <div key={n.id} className="news-item">
                  <div className="news-item__row">
                    <div className="news-item__title">
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="news-item__link">{n.title}</a>
                      ) : (
                        n.title
                      )}
                    </div>
                    {n.category && (
                      <span className="news-item__tag" data-category={n.category}>{n.category}</span>
                    )}
                  </div>
                  <div className="news-item__meta">{n.source} · {n.time}</div>
                </div>
              )
            })
          ) : (
            <div className="news-item">
              <div className="news-item__title">暂无该地区最新情报</div>
              <div className="news-item__meta">—</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
