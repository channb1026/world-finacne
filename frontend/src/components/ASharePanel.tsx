import { useMemo, useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useMarketData, useNewsData } from '../state/DataContext'
import { getAShareIndexDisplayName, getNewsCategoryDisplay, getNewsSourceDisplay, getNewsTagDisplay } from '../i18n/displayNames'
import { isSafeLink } from '../utils/linkSafety'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

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

  const visibleNews = useMemo(() => {
    if (activeCategory === 'all') return aShareNews
    return aShareNews.filter((item) => item.category === activeCategory)
  }, [aShareNews, activeCategory])

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
            visibleNews.map((n) => {
              const href = isSafeLink(n.link) ? n.link : undefined
              return (
                <li key={n.id} className="a-share-news-item">
                  <div className="a-share-news-item__row">
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="a-share-news-item__title a-share-news-item__link">
                        {n.title}
                      </a>
                    ) : (
                      <span className="a-share-news-item__title">{n.title}</span>
                    )}
                    {n.category && (
                      <span className="news-item__tag" data-category={n.category}>
                        {getNewsCategoryDisplay(n.category, locale)}
                      </span>
                    )}
                  </div>
                  <span className="a-share-news-item__meta">
                    {getNewsSourceDisplay(n.source, locale)} · {n.time}
                    {n.tags && n.tags.length > 0 ? ` · ${n.tags.slice(0, 2).map((tag) => getNewsTagDisplay(tag, locale)).join(' / ')}` : ''}
                  </span>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
