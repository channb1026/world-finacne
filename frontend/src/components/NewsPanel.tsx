import { useLocale } from '../i18n/LocaleContext'
import { useData } from '../state/DataContext'
import { getNewsSourceDisplay } from '../i18n/displayNames'
import { isSafeLink } from '../utils/linkSafety'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function NewsPanel() {
  const { locale, t } = useLocale()
  const { data, refreshNews } = useData()
  const { news, lastUpdated, error, loaded } = data
  const loadedOnce = loaded.news

  return (
    <div className="panel panel--fill">
      <div className="panel__title">
        {t('panel.news')}
        {lastUpdated.news && <span className="panel__updated">{t('common.updated')} {formatLastUpdated(lastUpdated.news, locale)}</span>}
      </div>
      <div className="news-list">
        {news.length === 0 ? (
          <div className="news-item">
            {!loadedOnce ? t('common.loading') : error.news ? t('common.loadFailed') : t('common.noData')}
            {loadedOnce && error.news && (
              <button type="button" className="panel__retry" onClick={refreshNews}>{t('common.retry')}</button>
            )}
          </div>
        ) : (
          news.map((n) => {
            const href = isSafeLink(n.link) ? n.link : undefined
            return (
              <div key={n.id} className="news-item">
                <div className="news-item__title">
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="news-item__link">{n.title}</a>
                  ) : (
                    n.title
                  )}
                </div>
                <div className="news-item__meta">{getNewsSourceDisplay(n.source, locale)} · {n.time}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
