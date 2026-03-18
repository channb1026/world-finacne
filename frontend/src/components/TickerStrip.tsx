import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useNewsData } from '../state/DataContext'
import { isSafeLink } from '../utils/linkSafety'

export function TickerStrip() {
  const { t } = useLocale()
  const { refreshNews } = useDataActions()
  const { ticker, error, loaded } = useNewsData()
  const loadedOnce = loaded.ticker

  if (ticker.length === 0) {
    const msg = !loadedOnce ? t('common.loading') : error.ticker ? t('common.loadFailed') : t('common.noData')
    return (
      <div className="ticker-strip">
        <span className="ticker-strip__label">{t('ticker.feed')}</span>
        <div className="ticker-strip__viewport ticker-strip__viewport--static">
          <span>{msg}</span>
          {loadedOnce && (
            <button type="button" className="panel__retry" onClick={refreshNews}>{t('common.retry')}</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="ticker-strip">
      <span className="ticker-strip__label">{t('ticker.feed')}</span>
      <div className="ticker-strip__viewport">
        <div className="ticker-strip__track">
          {[0, 1].flatMap((loopIndex) =>
            ticker.map((item) => ({ item, loopIndex }))
          ).map(({ item, loopIndex }) => {
            const href = isSafeLink(item.link) ? item.link : undefined
            const idx = ticker.indexOf(item)
            const itemKey = `${loopIndex}-${idx}-${item.link || item.title}`
            return (
              <span key={itemKey} className="ticker-strip__item">
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="ticker-strip__link">
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
