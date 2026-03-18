import { useMemo, useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useMarketData, useNewsData } from '../state/DataContext'
import { getAShareIndexDisplayName, getMarketScopeDisplay, getNewsCategoryDisplay } from '../i18n/displayNames'
import { NewsEventCard } from './NewsEventCard'
import { isMarketMovingItem, rankNewsWithMarketContext, summarizeAssetImpacts } from '../utils/newsContextRanking'
import { buildLeadSummary, summarizeScopeMix, summarizeThemeMix } from '../utils/newsOverview'
import { filterNewsByWindow, type TimeWindowKey } from '../utils/newsTimeWindow'
import { summarizeNewsTimeline } from '../utils/newsTimeline'
import { formatLastUpdated } from '../utils/format'

function AShareIndexRow({
  name,
  symbol,
  value,
  change,
  changePct,
  locale,
  animate,
}: {
  name: string
  symbol: string
  value: number
  change: number
  changePct: number
  locale: 'zh' | 'en'
  animate: boolean
}) {
  return (
    <div className="a-share-row">
      <span className="a-share-row__name">{getAShareIndexDisplayName(name, symbol, locale)}</span>
      <span key={`${symbol}-${value}`} className={`a-share-row__value ${animate ? 'value-flash' : ''}`}>
        {value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
      </span>
      <span key={`${symbol}-${changePct}`} className={`a-share-row__chg ${changePct >= 0 ? 'up' : 'down'} ${animate ? 'value-flash' : ''}`}>
        {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
      </span>
    </div>
  )
}

export function ASharePanel() {
  const { locale, t } = useLocale()
  const { refreshMarket, refreshNews } = useDataActions()
  const { aShareIndices, lastUpdated: marketUpdated, error: marketError, loaded: marketLoaded } = useMarketData()
  const { aShareNews, lastUpdated: newsUpdated, error: newsError, loaded: newsLoaded } = useNewsData()
  const loadedOnceIndices = marketLoaded.aShareIndices
  const loadedOnceNews = newsLoaded.aShareNews
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedWindow, setSelectedWindow] = useState<TimeWindowKey>('24h')
  const [marketMovingOnly, setMarketMovingOnly] = useState(false)

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of aShareNews) {
      if (!item.category) continue
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([category]) => category)
  }, [aShareNews])

  const activeCategory = selectedCategory !== 'all' && !categories.includes(selectedCategory)
    ? 'all'
    : selectedCategory

  const rankedNews = useMemo(() => (
    rankNewsWithMarketContext(aShareNews, { keyMetrics: [], commodities: [], aShareIndices }, locale)
  ), [aShareIndices, aShareNews, locale])

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
    <div className="panel panel--fill a-share-panel">
      <div className="panel__title">
        {t('panel.aShare')}
        {(marketUpdated || newsUpdated) && (
          <span className="panel__updated">
            {t('common.updated')}{' '}
            {formatLastUpdated(marketUpdated || newsUpdated!, locale)}
          </span>
        )}
      </div>
      <div className="a-share-panel__indices">
        <div className="a-share-panel__subtitle">{t('panel.mainIndices')}</div>
        {aShareIndices.length === 0 ? (
          <div className="panel__state a-share-row">
            <span>{!loadedOnceIndices ? t('common.loading') : marketError.aShareIndices ? t('common.loadFailed') : t('common.noData')}</span>
            {loadedOnceIndices && (
              <button type="button" className="panel__retry" onClick={refreshMarket}>{t('common.retry')}</button>
            )}
          </div>
        ) : (
          aShareIndices.map((idx) => (
            <AShareIndexRow key={idx.symbol} {...idx} locale={locale} animate={loadedOnceIndices} />
          ))
        )}
      </div>
      <div className="a-share-panel__news">
        <div className="a-share-panel__subtitle">{t('panel.aShareNews')}</div>
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
        <ul className="a-share-news-list">
          {aShareNews.length === 0 ? (
            <li className="a-share-news-item">
              <span>{!loadedOnceNews ? t('common.loading') : newsError.aShareNews ? t('common.loadFailed') : t('aShare.noNews')}</span>
              {loadedOnceNews && (
                <button type="button" className="panel__retry" onClick={refreshNews}>{t('common.retry')}</button>
              )}
            </li>
          ) : visibleNews.length === 0 ? (
            <li className="a-share-news-item">
              <span>{t('common.noData')}</span>
            </li>
          ) : (
            visibleNews.map((n) => (
              <li key={n.id} className="a-share-news-item">
                <NewsEventCard item={n} compact />
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
