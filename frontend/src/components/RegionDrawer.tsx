import { useState, useEffect, useRef } from 'react'
import type { RegionId } from '../data/mock'
import { MAP_SPOTS_DEFAULT } from '../data/mock'
import { fetchNewsByRegion } from '../services/api'
import type { NewsItem } from '../data/mock'
import { useLocale } from '../i18n/LocaleContext'
import { useVisibility } from '../state/DataContext'
import { getRegionDisplayName, getNewsCategoryDisplay, getNewsSourceDisplay, getNewsTagDisplay, getStoryClusterDisplay } from '../i18n/displayNames'
import { isSafeLink } from '../utils/linkSafety'

interface RegionDrawerProps {
  regionId: RegionId | null
  onClose: () => void
}

const REGION_POLL_MS = 45 * 1000

export function RegionDrawer({ regionId, onClose }: RegionDrawerProps) {
  const { t, locale } = useLocale()
  const isVisible = useVisibility()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!regionId) return
    const load = async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const data = await fetchNewsByRegion(regionId, controller.signal)
        if (!controller.signal.aborted) {
          setNews(data)
        }
      } catch {
        if (!controller.signal.aborted) {
          setNews([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    const schedule = () => {
      if (!isVisible) return
      timerRef.current = setTimeout(async () => {
        await load()
        schedule()
      }, REGION_POLL_MS)
    }

    void load()
    if (isVisible) {
      schedule()
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      abortRef.current?.abort()
    }
  }, [regionId, isVisible])

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
              const href = isSafeLink(n.link) ? n.link : undefined
              const clusterLabel = getStoryClusterDisplay(n.sourceCount, locale)
              const relatedSources = (n.relatedSources || [])
                .map((source) => getNewsSourceDisplay(source, locale))
                .filter(Boolean)
              const visibleSources = relatedSources.slice(0, 3)
              const remainingSources = Math.max(0, relatedSources.length - visibleSources.length)
              const clusterTitle = relatedSources.length > 1 ? relatedSources.join(' / ') : undefined
              const impactLabel = n.impactLevel === 'high'
                ? t('news.impact.high')
                : n.impactLevel === 'medium'
                  ? t('news.impact.medium')
                  : ''
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
                      <span className="news-item__tag" data-category={n.category}>
                        {getNewsCategoryDisplay(n.category, locale)}
                      </span>
                    )}
                    {impactLabel && (
                      <span className={`news-item__impact news-item__impact--${n.impactLevel}`}>
                        {impactLabel}
                      </span>
                    )}
                  </div>
                  <div className="news-item__meta" title={clusterTitle}>
                    {getNewsSourceDisplay(n.source, locale)} · {n.time}
                    {clusterLabel ? ` · ${clusterLabel}` : ''}
                    {n.tags && n.tags.length > 0 ? ` · ${n.tags.slice(0, 2).map((tag) => getNewsTagDisplay(tag, locale)).join(' / ')}` : ''}
                  </div>
                  {relatedSources.length > 1 && (
                    <div className="news-item__sources" title={clusterTitle}>
                      {visibleSources.map((source) => (
                        <span key={source} className="news-item__source-chip">{source}</span>
                      ))}
                      {remainingSources > 0 && (
                        <span className="news-item__source-chip news-item__source-chip--more">+{remainingSources}</span>
                      )}
                    </div>
                  )}
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
