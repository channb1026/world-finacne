import { useMemo, useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useNewsData } from '../state/DataContext'
import { getNewsCategoryDisplay, getNewsSourceDisplay, getNewsTagDisplay } from '../i18n/displayNames'
import { isSafeLink } from '../utils/linkSafety'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function NewsPanel() {
  const { locale, t } = useLocale()
  const { refreshNews } = useDataActions()
  const { news, lastUpdated, error, loaded } = useNewsData()
  const loadedOnce = loaded.news
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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

  const visibleNews = useMemo(() => {
    if (activeCategory === 'all') return news
    return news.filter((item) => item.category === activeCategory)
  }, [activeCategory, news])

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
          visibleNews.map((n) => {
            const href = isSafeLink(n.link) ? n.link : undefined
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
                </div>
                <div className="news-item__meta">
                  {getNewsSourceDisplay(n.source, locale)} · {n.time}
                  {n.tags && n.tags.length > 0 ? ` · ${n.tags.slice(0, 2).map((tag) => getNewsTagDisplay(tag, locale)).join(' / ')}` : ''}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
