import { useLocale } from '../i18n/LocaleContext'
import { useData } from '../state/DataContext'
import { getStockDisplayName } from '../i18n/displayNames'
import { useFlashOnChange } from '../hooks/useFlashOnChange'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function StocksPanel() {
  const { locale, t } = useLocale()
  const { data, refreshMarket } = useData()
  const { stocks, lastUpdated, error, loaded } = data
  const loadedOnce = loaded.stocks

  if (stocks.length === 0) {
    const msg = !loadedOnce ? t('common.loading') : error.stocks ? t('common.loadFailed') : t('common.noData')
    return (
      <div className="panel panel--min-height">
        <div className="panel__title">{t('panel.stocks')}</div>
        <div className="panel__state">
          <span>{msg}</span>
          {loadedOnce && (
            <button type="button" className="panel__retry" onClick={refreshMarket}>{t('common.retry')}</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="panel stocks-panel">
      <div className="panel__title">
        {t('panel.stocks')}
        {lastUpdated.market && <span className="panel__updated">{t('common.updated')} {formatLastUpdated(lastUpdated.market, locale)}</span>}
      </div>
      <div className="panel__subtitle">{t('panel.mainIndices')}</div>
      <div className="stocks-list">
        {stocks.map((s) => {
          const flashValue = useFlashOnChange(s.value, s.symbol)
          const flashChange = useFlashOnChange(s.changePct, `${s.symbol}-chg`)
          return (
            <div key={s.symbol} className="stock-row">
              <span className="stock-name">{getStockDisplayName(s.name, s.symbol, locale)}</span>
              <span className={`stock-value ${flashValue ? 'value-flash' : ''}`}>{s.value.toLocaleString()}</span>
              <span className={`stock-change ${s.change >= 0 ? 'up' : 'down'} ${flashChange ? 'value-flash' : ''}`}>
                {s.change >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
