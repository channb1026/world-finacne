import { useLocale } from '../i18n/LocaleContext'
import { useData } from '../state/DataContext'
import { getAShareIndexDisplayName, getNewsSourceDisplay } from '../i18n/displayNames'
import { isSafeLink } from '../utils/linkSafety'
import { useFlashOnChange } from '../hooks/useFlashOnChange'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function ASharePanel() {
  const { locale, t } = useLocale()
  const { data, refreshMarket, refreshNews } = useData()
  const { aShareIndices, aShareNews, lastUpdated, error, loaded } = data
  const loadedOnceIndices = loaded.aShareIndices
  const loadedOnceNews = loaded.aShareNews

  return (
    <div className="panel panel--fill a-share-panel">
      <div className="panel__title">
        {t('panel.aShare')}
        {(lastUpdated.market || lastUpdated.news) && (
          <span className="panel__updated">
            {t('common.updated')}{' '}
            {formatLastUpdated(lastUpdated.market || lastUpdated.news!, locale)}
          </span>
        )}
      </div>
      <div className="a-share-panel__indices">
        <div className="a-share-panel__subtitle">{t('panel.mainIndices')}</div>
        {aShareIndices.length === 0 ? (
          <div className="panel__state a-share-row">
            <span>{!loadedOnceIndices ? t('common.loading') : error.aShareIndices ? t('common.loadFailed') : t('common.noData')}</span>
            {loadedOnceIndices && (
              <button type="button" className="panel__retry" onClick={refreshMarket}>{t('common.retry')}</button>
            )}
          </div>
        ) : (
          aShareIndices.map((idx) => {
            const flashValue = useFlashOnChange(idx.value, idx.symbol)
            const flashChange = useFlashOnChange(idx.changePct, `${idx.symbol}-chg`)
            return (
              <div key={idx.symbol} className="a-share-row">
                <span className="a-share-row__name">{getAShareIndexDisplayName(idx.name, idx.symbol, locale)}</span>
                <span className={`a-share-row__value ${flashValue ? 'value-flash' : ''}`}>
                  {idx.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </span>
                <span className={`a-share-row__chg ${idx.changePct >= 0 ? 'up' : 'down'} ${flashChange ? 'value-flash' : ''}`}>
                  {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({idx.changePct >= 0 ? '+' : ''}{idx.changePct.toFixed(2)}%)
                </span>
              </div>
            )
          })
        )}
      </div>
      <div className="a-share-panel__news">
        <div className="a-share-panel__subtitle">{t('panel.aShareNews')}</div>
        <ul className="a-share-news-list">
          {aShareNews.length === 0 ? (
            <li className="a-share-news-item">
              <span>{!loadedOnceNews ? t('common.loading') : error.aShareNews ? t('common.loadFailed') : t('aShare.noNews')}</span>
              {loadedOnceNews && (
                <button type="button" className="panel__retry" onClick={refreshNews}>{t('common.retry')}</button>
              )}
            </li>
          ) : (
            aShareNews.map((n) => {
              const href = isSafeLink(n.link) ? n.link : undefined
              return (
                <li key={n.id} className="a-share-news-item">
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="a-share-news-item__title a-share-news-item__link">
                      {n.title}
                    </a>
                  ) : (
                    <span className="a-share-news-item__title">{n.title}</span>
                  )}
                  <span className="a-share-news-item__meta">{getNewsSourceDisplay(n.source, locale)} · {n.time}</span>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
