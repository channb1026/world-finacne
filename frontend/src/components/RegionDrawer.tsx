import { useState, useEffect, useMemo, useRef } from 'react'
import type { RegionId, NewsItem } from '../types/data'
import { MAP_SPOTS_DEFAULT } from '../data/mock'
import { fetchNewsByRegion } from '../services/api'
import { useLocale } from '../i18n/LocaleContext'
import { useMarketData, useVisibility } from '../state/DataContext'
import { getMarketScopeDisplay, getNewsCategoryDisplay, getRegionDisplayName } from '../i18n/displayNames'
import { NewsEventCard } from './NewsEventCard'
import { isMarketMovingItem, rankNewsWithMarketContext, summarizeAssetImpacts } from '../utils/newsContextRanking'
import { buildLeadSummary, summarizeScopeMix, summarizeThemeMix } from '../utils/newsOverview'
import { filterNewsByWindow, type TimeWindowKey } from '../utils/newsTimeWindow'
import { summarizeNewsTimeline } from '../utils/newsTimeline'

interface RegionDrawerProps {
  regionId: RegionId | null
  onClose: () => void
}

const REGION_POLL_MS = 45 * 1000

export function RegionDrawer({ regionId, onClose }: RegionDrawerProps) {
  const { t, locale } = useLocale()
  const isVisible = useVisibility()
  const { keyMetrics, commodities, aShareIndices } = useMarketData()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWindow, setSelectedWindow] = useState<TimeWindowKey>('24h')
  const [marketMovingOnly, setMarketMovingOnly] = useState(false)
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

  const rankedNews = useMemo(
    () => rankNewsWithMarketContext(news, { keyMetrics, commodities, aShareIndices }, locale),
    [aShareIndices, commodities, keyMetrics, locale, news],
  )
  const visibleNews = useMemo(
    () => {
      const windowed = filterNewsByWindow(rankedNews.items, selectedWindow)
      return marketMovingOnly ? windowed.filter(isMarketMovingItem) : windowed
    },
    [marketMovingOnly, rankedNews.items, selectedWindow],
  )
  const impactOverview = useMemo(
    () => summarizeAssetImpacts(visibleNews, locale).slice(0, 4),
    [locale, visibleNews],
  )
  const timeline = useMemo(
    () => summarizeNewsTimeline(rankedNews.items),
    [rankedNews.items],
  )
  const themeMix = useMemo(
    () => summarizeThemeMix(visibleNews, 3),
    [visibleNews],
  )
  const scopeMix = useMemo(
    () => summarizeScopeMix(visibleNews, 3),
    [visibleNews],
  )
  const leadSummary = useMemo(
    () => buildLeadSummary({
      locale,
      signals: rankedNews.signals,
      themeMix,
      scopeMix,
      timeline,
      itemCount: visibleNews.length,
    }),
    [locale, rankedNews.signals, scopeMix, themeMix, timeline, visibleNews.length],
  )
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
        <div className="panel__filters" aria-label={t('panel.filterByWindow')}>
          {(['1h', '4h', '24h', 'all'] as TimeWindowKey[]).map((windowKey) => (
            <button
              key={windowKey}
              type="button"
              className={`panel__filter-btn ${selectedWindow === windowKey ? 'is-active' : ''}`}
              onClick={() => setSelectedWindow(windowKey)}
            >
              {t(`panel.window.${windowKey}`)}
            </button>
          ))}
          <button
            type="button"
            className={`panel__filter-btn ${marketMovingOnly ? 'is-active' : ''}`}
            onClick={() => setMarketMovingOnly((value) => !value)}
          >
            {t('panel.filterMarketMoving')}
          </button>
        </div>
        {rankedNews.signals.length > 0 && (
          <>
            <div className="news-lead-summary">
              <span className="news-lead-summary__label">{t('news.leadSummary')}</span>
              <div className="news-lead-summary__text">{leadSummary}</div>
            </div>
            <div className="news-context-summary">
              {t('news.currentTheme')}: {rankedNews.signals.map((signal) => signal.label).join(' / ')}
            </div>
            <div className="news-context-bar news-context-bar--compact">
              {rankedNews.signals.map((signal) => (
                <span key={signal.id} className="news-context-bar__chip">{signal.label}</span>
              ))}
            </div>
          </>
        )}
        {impactOverview.length > 0 && (
          <div className="news-impact-overview" aria-label={t('news.assetOverview')}>
            {impactOverview.map((impact) => (
              <span key={impact.id} className="news-impact-overview__chip">
                {impact.label}
                <span className="news-impact-overview__count">{impact.count}</span>
              </span>
            ))}
          </div>
        )}
        {themeMix.length > 0 && (
          <div className="news-overview-row" aria-label={t('news.themeMix')}>
            {themeMix.map((entry) => (
              <span key={entry.key} className="news-overview-chip">
                <span className="news-overview-chip__label">{getNewsCategoryDisplay(entry.key, locale)}</span>
                {entry.count}
              </span>
            ))}
          </div>
        )}
        {scopeMix.length > 0 && (
          <div className="news-overview-row" aria-label={t('news.scopeMix')}>
            {scopeMix.map((entry) => (
              <span key={entry.key} className="news-overview-chip">
                <span className="news-overview-chip__label">{getMarketScopeDisplay(entry.key, locale)}</span>
                {entry.count}
              </span>
            ))}
          </div>
        )}
        {timeline.some((bucket) => bucket.count > 0) && (
          <div className="news-timeline" aria-label={t('news.timeline')}>
            {timeline.map((bucket) => (
              <div key={bucket.key} className="news-timeline__bucket">
                <div className="news-timeline__window">{t(`panel.window.${bucket.key}`)}</div>
                <div className="news-timeline__count">{bucket.count}</div>
                <div className="news-timeline__category">
                  {bucket.topCategory ? getNewsCategoryDisplay(bucket.topCategory, locale) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="region-news">
          {loading ? (
            <div className="news-item">{t('common.loading')}</div>
          ) : visibleNews.length ? (
            visibleNews.map((n) => <NewsEventCard key={n.id} item={n} />)
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
