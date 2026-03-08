import { useState, useEffect, useRef } from 'react'
import type { RegionId } from '../data/mock'
import { MAP_SPOTS_DEFAULT } from '../data/mock'
import { fetchNewsByRegion, POLL_INTERVAL_NEWS } from '../services/api'
import type { NewsItem } from '../data/mock'
import { useLocale } from '../i18n/LocaleContext'
import { getRegionDisplayName, getNewsSourceDisplay } from '../i18n/displayNames'

interface RegionDrawerProps {
  regionId: RegionId | null
  onClose: () => void
}

export function RegionDrawer({ regionId, onClose }: RegionDrawerProps) {
  const { t, locale } = useLocale()
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

  const regionDisplayName = getRegionDisplayName(regionId, locale, region?.name)
  return (
    <div className="region-drawer">
      <div className="region-drawer__head">
        <span className="region-drawer__title">{regionDisplayName} · {t('regionDrawer.intel')}</span>
        <button type="button" className="region-drawer__close" onClick={onClose} aria-label={t('common.close')}>
          ×
        </button>
      </div>
      <div className="region-drawer__body">
        <div className="panel__title">{t('regionDrawer.regionNews')}</div>
        <div className="region-news">
          {loading ? (
            <div className="news-item">{t('common.loading')}</div>
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
                  <div className="news-item__meta">{getNewsSourceDisplay(n.source, locale)} · {n.time}</div>
                </div>
              )
            })
          ) : (
            <div className="news-item">
              <div className="news-item__title">{t('regionDrawer.noRegionNews')}</div>
              <div className="news-item__meta">—</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
