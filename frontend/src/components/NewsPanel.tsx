import { useMemo, useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useMarketData, useNewsData } from '../state/DataContext'
import { getMarketScopeDisplay, getNewsCategoryDisplay } from '../i18n/displayNames'
import { NewsEventCard } from './NewsEventCard'
import { isMarketMovingItem, rankNewsWithMarketContext, summarizeAssetImpacts } from '../utils/newsContextRanking'
import { buildLeadSummary, summarizeScopeMix, summarizeThemeMix } from '../utils/newsOverview'
import { filterNewsByWindow, type TimeWindowKey } from '../utils/newsTimeWindow'
import { summarizeNewsTimeline } from '../utils/newsTimeline'
import { formatLastUpdated } from '../utils/format'

export function NewsPanel() {
  const { locale, t } = useLocale()
  const { refreshNews } = useDataActions()
  const { news, lastUpdated, error, loaded } = useNewsData()
  const { keyMetrics, commodities, aShareIndices } = useMarketData()
  const loadedOnce = loaded.news
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedWindow, setSelectedWindow] = useState<TimeWindowKey>('24h')
  const [marketMovingOnly, setMarketMovingOnly] = useState(false)

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of news) {
      if (!item.category) continue
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([category]) => category)
  }, [news])

  const activeCategory = selectedCategory !== 'all' && !categories.includes(selectedCategory)
    ? 'all'
    : selectedCategory

  const rankedNews = useMemo(() => (
    rankNewsWithMarketContext(news, { keyMetrics, commodities, aShareIndices }, locale)
  ), [aShareIndices, commodities, keyMetrics, locale, news])

  const windowedNews = useMemo(
    () => filterNewsByWindow(rankedNews.items, selectedWindow),
    [rankedNews.items, selectedWindow],
  )

  const visibleNews = useMemo(() => {
    const categoryFiltered = activeCategory === 'all'
      ? windowedNews
      : windowedNews.filter((item) => item.category === activeCategory)
    return marketMovingOnly ? categoryFiltered.filter(isMarketMovingItem) : categoryFiltered
  }, [activeCategory, marketMovingOnly, windowedNews])
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

  return (
    <div className="panel panel--fill">
      <div className="panel__title">
        {t('panel.news')}
        {lastUpdated && <span className="panel__updated">{t('common.updated')} {formatLastUpdated(lastUpdated, locale)}</span>}
      </div>
      {categories.length > 0 && (
        <div className="panel__filters" aria-label={t('panel.filterByCategory')}>
          <button
            type="button"
            className={`panel__filter-btn ${activeCategory === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            {t('panel.filterAll')}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`panel__filter-btn ${activeCategory === category ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {getNewsCategoryDisplay(category, locale)}
            </button>
          ))}
        </div>
      )}
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
          <div className="news-context-bar">
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
      <div className="news-list">
        {news.length === 0 ? (
          <div className="news-item">
            {!loadedOnce ? t('common.loading') : error.news ? t('common.loadFailed') : t('common.noData')}
            {loadedOnce && error.news && (
              <button type="button" className="panel__retry" onClick={refreshNews}>{t('common.retry')}</button>
            )}
          </div>
        ) : visibleNews.length === 0 ? (
          <div className="news-item">{t('common.noData')}</div>
        ) : (
          visibleNews.map((n) => <NewsEventCard key={n.id} item={n} />)
        )}
      </div>
    </div>
  )
}
